import { useState, useEffect } from 'react'
import { MATCHES, TEAMS } from '../data'

// Map football-data.org TLAs → our data.js codes where they differ.
// football-data.org mostly uses FIFA codes (which match ours), but a few diverge.
// Add entries here whenever DevTools shows "[live] unmatched" after kickoff.
const TLA_MAP = {
  // Confirmed remaps
  'URY': 'URU',  // Uruguay (ISO alpha-3 vs FIFA)
  'IRI': 'IRN',  // Iran (AFC sometimes uses IRI)
  'PRY': 'PAR',  // Paraguay ISO alpha-3
  'CHE': 'SUI',  // Switzerland ISO alpha-3
  'DZA': 'ALG',  // Algeria ISO alpha-3
  'NLD': 'NED',  // Netherlands ISO alpha-3
  'DEU': 'GER',  // Germany ISO alpha-3
  'PRT': 'POR',  // Portugal ISO alpha-3
  // Likely remaps for WC2026 teams
  'SAU': 'KSA',  // Saudi Arabia
  'RSA': 'RSA',  // South Africa (same)
  'ZAF': 'RSA',  // South Africa ISO alpha-3
  'NZE': 'NZL',  // New Zealand
  'HTI': 'HAI',  // Haiti
  'BOS': 'BIH',  // Bosnia & Herzegovina
  'CPV': 'CPV',  // Cape Verde (same)
  'COD': 'COD',  // DR Congo (same)
  'CUW': 'CUW',  // Curaçao (same)
  'IRQ': 'IRQ',  // Iraq (same)
  'JOR': 'JOR',  // Jordan (same)
  'UZB': 'UZB',  // Uzbekistan (same)
  'IVC': 'CIV',  // Côte d'Ivoire
  'DRC': 'COD',  // DR Congo alt
  'KVX': 'KVX',  // Kosovo
  'AUS': 'AUS',  // Australia (same)
  'CRC': 'CRC',  // Costa Rica (same)
}
function normalizeTla(code) { return TLA_MAP[code] || code }

// Name-based fallback: normalise a team name for loose matching
function normaliseName(n) {
  return (n || '').toLowerCase()
    .replace(/[^a-z]/g, '')     // strip non-alpha
    .replace('unitedstates', 'usa')
    .replace('coted', 'cotedivoire')
    .replace('ivoire', 'cotedivoire')
    .replace('democraticrepublicofthecongo', 'drcongo')
    .replace('republicofthecongo', 'congo')
    .replace('bosniaandherzegovina', 'bosnia')
    .replace('newzealand', 'newzealand')
    .replace('saudiarabia', 'saudiarabia')
    .replace('southkorea', 'southkorea')
    .replace('southafrica', 'southafrica')
    .replace('czechia', 'czechia')
    .replace('czechrepublic', 'czechia')
}

// Build a name→code lookup from our TEAMS
const NAME_LOOKUP = {}
Object.entries(TEAMS).forEach(([code, t]) => {
  NAME_LOOKUP[normaliseName(t.name)] = code
})

function findLocalMatch(homeTla, awayTla, homeNameRaw, awayNameRaw) {
  // 1. Try TLA match first
  const byTla = MATCHES.find(lm => lm.home === homeTla && lm.away === awayTla)
  if (byTla) return byTla

  // 2. Fallback: match by team name
  const homeName = normaliseName(homeNameRaw)
  const awayName = normaliseName(awayNameRaw)
  const homeCode = NAME_LOOKUP[homeName]
  const awayCode = NAME_LOOKUP[awayName]
  if (homeCode && awayCode) {
    const byName = MATCHES.find(lm => lm.home === homeCode && lm.away === awayCode)
    if (byName) {
      console.info(`[live] name-matched: ${homeNameRaw} (${homeTla}→${homeCode}) vs ${awayNameRaw} (${awayTla}→${awayCode})`)
      return byName
    }
  }

  return null
}

// Works on GitHub Pages (direct) and local dev (proxy)
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.football-data.org/v4'

export function useLiveScores() {
  const [liveMap, setLiveMap] = useState(new Map())

  useEffect(() => {
    async function poll() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const key = import.meta.env.VITE_FOOTBALL_DATA_KEY || ''
        if (!key) {
          console.warn('[live] VITE_FOOTBALL_DATA_KEY not set — live scores disabled. Set it in GitHub Secrets and redeploy.')
          return
        }

        const url = `${API_BASE}/competitions/2000/matches?dateFrom=${today}&dateTo=${today}`
        const res = await fetch(url, { headers: { 'X-Auth-Token': key } })

        if (!res.ok) {
          console.warn(`[live] API ${res.status}: ${res.statusText} — check key or competition access (url: ${url})`)
          return
        }

        const json = await res.json()
        const apiMatches = json.matches || []
        console.info(`[live] API OK — ${apiMatches.length} matches for ${today}`)

        const map = new Map()
        for (const m of apiMatches) {
          const homeTla    = normalizeTla(m.homeTeam?.tla || '')
          const awayTla    = normalizeTla(m.awayTeam?.tla || '')
          const homeNameRaw = m.homeTeam?.name || m.homeTeam?.shortName || ''
          const awayNameRaw = m.awayTeam?.name || m.awayTeam?.shortName || ''

          console.info(`[live] ${m.status} | ${homeNameRaw} (${m.homeTeam?.tla}) vs ${awayNameRaw} (${m.awayTeam?.tla}) | score: ${JSON.stringify(m.score?.fullTime)} / halfTime: ${JSON.stringify(m.score?.halfTime)} / regular: ${JSON.stringify(m.score?.regularTime)}`)

          const local = findLocalMatch(homeTla, awayTla, homeNameRaw, awayNameRaw)
          if (!local) {
            console.warn(`[live] unmatched: "${homeNameRaw}" (${m.homeTeam?.tla}→${homeTla}) vs "${awayNameRaw}" (${m.awayTeam?.tla}→${awayTla}) — add to TLA_MAP in useLiveScores.js`)
            continue
          }

          // fullTime holds running score during IN_PLAY on football-data.org v4
          // Fall back to halfTime (HALFTIME status) then regularTime (extra time / fallback)
          const hs  = m.score?.fullTime?.home
                   ?? m.score?.halfTime?.home
                   ?? m.score?.regularTime?.home
          const as_ = m.score?.fullTime?.away
                   ?? m.score?.halfTime?.away
                   ?? m.score?.regularTime?.away
          if (hs == null && as_ == null) {
            console.info(`[live] matched ${homeNameRaw} vs ${awayNameRaw} but no score yet (status: ${m.status})`)
            continue
          }

          map.set(local.id, {
            homeScore: hs ?? 0,
            awayScore: as_ ?? 0,
            status: ['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status) ? 'live'
                   : m.status === 'FINISHED' ? 'finished'
                   : 'upcoming',
          })
          console.info(`[live] ✓ matched id=${local.id} ${homeNameRaw} ${hs ?? 0}-${as_ ?? 0} ${awayNameRaw} [${m.status}]`)
        }

        setLiveMap(map)
      } catch (err) {
        console.warn('[live] fetch error:', err)
      }
    }

    poll()
    const id = setInterval(poll, 60_000)
    return () => clearInterval(id)
  }, [])

  return liveMap
}
