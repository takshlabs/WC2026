import { useState, useEffect } from 'react'
import { MATCHES, TEAMS } from '../data'

// Live scores are fetched from a same-origin static JSON file written by a
// GitHub Actions cron job (.github/workflows/live-scores.yml) every 5 minutes.
// This avoids the CORS preflight failure that occurs when calling football-data.org
// directly from the browser with a custom X-Auth-Token header.
//
// Local dev: place a mock file at public/live-scores.json OR set VITE_API_BASE
// to use the Vite proxy (/api/football → api.football-data.org).

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

          map.set(local.id, {
            homeScore: hs  ?? 0,
            awayScore: as_ ?? 0,
            status: ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status) ? 'live'
                   : m.status === 'FINISHED'                              ? 'finished'
                   : 'upcoming',
            goals,
            bookings,
          })
        }

        setLiveMap(map)
        setLastUpdated(new Date())
      } catch (err) {
        console.warn('[live] poll error:', err.message)
      }
    }

    poll()
    const id = setInterval(poll, 60_000)
    return () => clearInterval(id)
  }, [])

  return { liveMap, lastUpdated }
}
