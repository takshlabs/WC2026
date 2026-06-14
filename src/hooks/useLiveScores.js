import { useState, useEffect } from 'react'
import { MATCHES, TEAMS } from '../data'

// Architecture: two-source live scoring
//
// 1. live-scores.json (same-origin, polled every 60s)
//    Written by GitHub Actions every 5 min. Provides: full schedule, match
//    events (goals/cards), stats, form. Floor data; never goes dark.
//
// 2. ESPN scoreboard API (direct browser fetch, polled every 20s)
//    site.api.espn.com returns CORS: * — confirmed from takshlabs.github.io.
//    Provides: real-time score, status, live clock for today's matches ONLY.
//    Overlaid on top of live-scores.json; a fetch failure falls back silently.
//
// Result: scores tick live within ~20s; events/stats lag at most 5 min.

const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// ── NFKD-safe name normaliser (mirrors the Python norm() in the workflow) ────
// Decomposes accented chars (ü→u, ô→o) before stripping, then applies
// known aliases. Fixes Türkiye, Côte d'Ivoire, etc.
const ESPN_ALIASES_JS = {
  unitedstates: 'usa', usa: 'usa', usmnt: 'usa',
  korea: 'southkorea', southkorea: 'southkorea',
  korearepublic: 'southkorea', republicofkorea: 'southkorea',
  ivorycoast: 'cotedivoire', cotedivoire: 'cotedivoire',
  drcongo: 'drcongo', congodrc: 'drcongo',
  democraticrepublicofthecongo: 'drcongo', democraticrepublicofcongo: 'drcongo',
  bosniaandherzegovina: 'bosnia', bosniaherzegovina: 'bosnia', bosnia: 'bosnia',
  czechrepublic: 'czechia', czechia: 'czechia',
  saudiarabia: 'saudiarabia', southafrica: 'southafrica', newzealand: 'newzealand',
  turkey: 'turkey', turkiye: 'turkey',
  northmacedonia: 'northmacedonia', macedonia: 'northmacedonia',
  capeverde: 'capeverde', republicofireland: 'ireland', ireland: 'ireland',
  iran: 'iran', islamicrepublicofiran: 'iran',
}
function normEspnName(s) {
  const nfkd = (s || '').normalize('NFKD').toLowerCase()
  const stripped = nfkd.replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  return ESPN_ALIASES_JS[stripped] || stripped
}

// ── TLA normalisation ────────────────────────────────────────────────────────
const TLA_MAP = {
  'URY': 'URU',  // Uruguay
  'IRI': 'IRN',  // Iran (AFC code)
  'PRY': 'PAR',  // Paraguay ISO
  'CHE': 'SUI',  // Switzerland ISO
  'DZA': 'ALG',  // Algeria ISO
  'NLD': 'NED',  // Netherlands ISO
  'DEU': 'GER',  // Germany ISO
  'PRT': 'POR',  // Portugal ISO
  'SAU': 'KSA',  // Saudi Arabia
  'ZAF': 'RSA',  // South Africa ISO
  'NZE': 'NZL',  // New Zealand
  'HTI': 'HAI',  // Haiti
  'BOS': 'BIH',  // Bosnia & Herz
  'IVC': 'CIV',  // Côte d'Ivoire
  'DRC': 'COD',  // DR Congo alt
}
function normalizeTla(code) { return TLA_MAP[code] || code }

// Name-based fallback matching
function normaliseName(n) {
  return (n || '').toLowerCase().replace(/[^a-z]/g, '')
    .replace('unitedstates', 'usa')
    .replace('cotedivoire', 'cotedivoire')
    .replace('ivoire', 'cotedivoire')
    .replace('democraticrepublicofthecongo', 'drcongo')
    .replace('bosniaandherzegovina', 'bosnia')
    .replace('czechrepublic', 'czechia')
    .replace('saudiarabia', 'saudiarabia')
    .replace('southkorea', 'southkorea')
    .replace('southafrica', 'southafrica')
    .replace('newzealand', 'newzealand')
}

const NAME_LOOKUP = {}
Object.entries(TEAMS).forEach(([code, t]) => {
  NAME_LOOKUP[normaliseName(t.name)] = code
})

function findLocalMatch(homeTla, awayTla, homeNameRaw, awayNameRaw) {
  const byTla = MATCHES.find(lm => lm.home === homeTla && lm.away === awayTla)
  if (byTla) return byTla

  const homeCode = NAME_LOOKUP[normaliseName(homeNameRaw)]
  const awayCode = NAME_LOOKUP[normaliseName(awayNameRaw)]
  if (homeCode && awayCode) {
    const byName = MATCHES.find(lm => lm.home === homeCode && lm.away === awayCode)
    if (byName) {
      console.info(`[live] name-matched: ${homeNameRaw}→${homeCode} vs ${awayNameRaw}→${awayCode}`)
      return byName
    }
  }
  return null
}

// ── Data source ──────────────────────────────────────────────────────────────
// Production: same-origin /WC2026/live-scores.json (no CORS, written by GH Action)
// Local dev:  Vite proxy at /api/football (set VITE_API_BASE=/api/football)
const API_BASE = import.meta.env.VITE_API_BASE   // local dev proxy only
const SCORES_URL = `${import.meta.env.BASE_URL}live-scores.json`

async function fetchMatches() {
  if (API_BASE) {
    // Local dev — go through the Vite proxy, same as before
    const today = new Date().toISOString().slice(0, 10)
    const key = import.meta.env.VITE_FOOTBALL_DATA_KEY || ''
    const res = await fetch(
      `${API_BASE}/competitions/2000/matches?dateFrom=${today}&dateTo=${today}`,
      key ? { headers: { 'X-Auth-Token': key } } : {}
    )
    if (!res.ok) throw new Error(`proxy ${res.status}`)
    return res.json()
  }

  // Production — fetch the cron-written JSON (same origin, no CORS)
  const res = await fetch(`${SCORES_URL}?_=${Date.now()}`)
  if (res.status === 404) return null   // file not yet written by cron — silent
  if (!res.ok) throw new Error(`live-scores.json ${res.status}`)
  return res.json()
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useLiveScores() {
  const [liveMap,     setLiveMap]     = useState(new Map())
  const [lastUpdated, setLastUpdated] = useState(null)  // Date | null

  useEffect(() => {
    async function poll() {
      try {
        const json = await fetchMatches()
        if (!json) return   // 404 — cron hasn't run yet

        const apiMatches = json.matches || []
        const map = new Map()

        for (const m of apiMatches) {
          const homeTla     = normalizeTla(m.homeTeam?.tla || '')
          const awayTla     = normalizeTla(m.awayTeam?.tla || '')
          const homeNameRaw = m.homeTeam?.name || m.homeTeam?.shortName || ''
          const awayNameRaw = m.awayTeam?.name || m.awayTeam?.shortName || ''

          const local = findLocalMatch(homeTla, awayTla, homeNameRaw, awayNameRaw)
          if (!local) {
            if (homeTla || homeNameRaw) {
              console.warn(`[live] unmatched: "${homeNameRaw}" (${m.homeTeam?.tla}) vs "${awayNameRaw}" (${m.awayTeam?.tla}) — add to TLA_MAP`)
            }
            continue
          }

          const hs  = m.score?.fullTime?.home
                   ?? m.score?.halfTime?.home
                   ?? m.score?.regularTime?.home
          const as_ = m.score?.fullTime?.away
                   ?? m.score?.halfTime?.away
                   ?? m.score?.regularTime?.away
          if (hs == null && as_ == null) continue

          const homeTeamId = m.homeTeam?.id
          const awayTeamId = m.awayTeam?.id

          const goals = (m.goals || []).map(g => {
            const isOG      = (g.type || 'REGULAR') === 'OWN_GOAL'
            const playerName = g.scorer?.shortName || g.scorer?.name || '?'
            const assistRaw  = g.assist?.shortName  || g.assist?.name  || null
            // OG: team.id is the scorer's team (who conceded), goal benefits the OTHER side
            const side = isOG
              ? (g.team?.id === homeTeamId ? 'away' : 'home')
              : (g.team?.id === homeTeamId ? 'home' : 'away')
            return {
              minute:  g.minute ?? 0,
              injTime: g.injuryTime ?? null,
              type:    g.type || 'REGULAR',
              player:  playerName,
              // Null out self-assists (ESPN sometimes echoes the scorer as assist)
              assist:  assistRaw === playerName ? null : assistRaw,
              side,
            }
          }).sort((a, b) => a.minute - b.minute)

          const bookings = (m.bookings || []).map(b => ({
            minute: b.minute ?? 0,
            player: b.player?.shortName || b.player?.name || '?',
            card:   b.card || 'YELLOW_CARD',
            side:   b.team?.id === homeTeamId ? 'home' : 'away',
          })).sort((a, b) => a.minute - b.minute)

          // ── Status resolution ─────────────────────────────────────────────
          // fd.org sometimes returns stale IN_PLAY for matches that ended hours ago.
          // Guard: if kickoff was >3.5 h ago and score is set, treat as finished.
          const kickoffMs  = m.utcDate ? new Date(m.utcDate).getTime() : 0
          const ageHours   = kickoffMs ? (Date.now() - kickoffMs) / 3_600_000 : 0
          const staleInPlay = ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)
                              && ageHours > 3.5
          const status = m.status === 'FINISHED' || staleInPlay
            ? 'finished'
            : ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status)
              ? 'live'
              : 'upcoming'

          if (staleInPlay) {
            console.info(`[live] stale IN_PLAY overridden → finished: ${homeNameRaw} vs ${awayNameRaw} (${ageHours.toFixed(1)}h old)`)
          }

          map.set(local.id, {
            homeScore:    hs  ?? 0,
            awayScore:    as_ ?? 0,
            status,
            goals,
            bookings,
            stats:        m.stats        || null,
            homeForm:     m.homeForm     || null,
            awayForm:     m.awayForm     || null,
            displayClock: m.displayClock || null,
            matchId:      String(m.id),
          })
        }

        setLiveMap(map)
        setLastUpdated(new Date())
      } catch (err) {
        console.warn('[live] poll error:', err.message)
      }
    }

    // ── ESPN real-time overlay (every 20s, today ±1 day) ──────────────────
    // Fetches scores/status/clock directly from ESPN — no cron dependency.
    // Only updates score+status+clock; goals/cards come from live-scores.json.
    // Failure is silent; live-scores.json remains the floor.
    async function pollEspn() {
      try {
        const now   = new Date()
        const yest  = new Date(now); yest.setUTCDate(yest.getUTCDate() - 1)
        const tom   = new Date(now); tom.setUTCDate(tom.getUTCDate() + 1)
        const fmt   = d => d.toISOString().slice(0, 10).replace(/-/g, '')
        const dates = `${fmt(yest)}-${fmt(tom)}`

        const res  = await fetch(`${ESPN_SCOREBOARD}?dates=${dates}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()

        setLiveMap(prev => {
          const next = new Map(prev)
          for (const event of (data.events || [])) {
            const comp      = event.competitions?.[0]
            if (!comp) continue
            const competitors = comp.competitors || []

            // Scores keyed by team name — safe against position swap
            const scoreByName = {}
            for (const c of competitors) {
              const n = normEspnName(c.team?.displayName || '')
              if (n) scoreByName[n] = Number(c.score ?? 0)
            }

            const hComp  = competitors.find(c => c.homeAway === 'home') || {}
            const aComp  = competitors.find(c => c.homeAway === 'away') || {}
            const hName  = hComp.team?.displayName || ''
            const aName  = aComp.team?.displayName || ''

            // Match to local record by team display name
            const hCode  = NAME_LOOKUP[normEspnName(hName)]
            const aCode  = NAME_LOOKUP[normEspnName(aName)]
            const local  = hCode && aCode ? MATCHES.find(m => m.home === hCode && m.away === aCode) : null
            if (!local) continue

            const sObj       = comp.status || {}
            const state      = sObj.type?.state || ''
            const statusName = sObj.type?.name  || ''
            const clock      = sObj.displayClock || null

            const espnStatus = state === 'post' ? 'finished'
              : state === 'in'
                ? ('HALFTIME' in statusName ? 'live' : 'live')
                : 'upcoming'

            const hScore = scoreByName[normEspnName(hName)] ?? null
            const aScore = scoreByName[normEspnName(aName)] ?? null

            const existing = next.get(local.id)
            if (!existing && espnStatus === 'upcoming') continue  // no entry yet, skip scheduled

            next.set(local.id, {
              ...(existing || {}),
              // Overlay: only score/status/clock from ESPN (real-time)
              // goals/bookings/stats/form kept from live-scores.json floor
              homeScore:    hScore ?? existing?.homeScore ?? 0,
              awayScore:    aScore ?? existing?.awayScore ?? 0,
              status:       espnStatus,
              displayClock: clock,
            })
          }
          return next
        })
      } catch (_) {
        // Silent — live-scores.json floor remains
      }
    }

    poll()
    pollEspn()
    const id     = setInterval(poll,     60_000)   // events/stats every 60s
    const espnId = setInterval(pollEspn, 20_000)   // scores/status every 20s
    return () => { clearInterval(id); clearInterval(espnId) }
  }, [])

  return { liveMap, lastUpdated }
}
