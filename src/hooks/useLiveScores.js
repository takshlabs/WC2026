import { useState, useEffect } from 'react'
import { MATCHES } from '../data'

// Map football-data.org TLAs → our data.js codes where they differ.
// football-data.org mostly uses FIFA codes (which match ours), but a few diverge.
// Add entries here whenever DevTools shows "[live] unmatched X vs Y" after kickoff.
const TLA_MAP = {
  'URY': 'URU',  // Uruguay (confirmed)
  'IRI': 'IRN',  // Iran (AFC sometimes uses IRI)
  'PRY': 'PAR',  // Paraguay ISO alpha-3
  'CHE': 'SUI',  // Switzerland ISO alpha-3
  'DZA': 'ALG',  // Algeria ISO alpha-3
  'NLD': 'NED',  // Netherlands ISO alpha-3
  'DEU': 'GER',  // Germany ISO alpha-3
  'PRT': 'POR',  // Portugal ISO alpha-3
  'AUS': 'AUS',  // Australia (same – included for completeness)
}
function normalizeTla(code) { return TLA_MAP[code] || code }

// Works on GitHub Pages (direct) and local dev (proxy)
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.football-data.org/v4'

export function useLiveScores() {
  const [liveMap, setLiveMap] = useState(new Map())

  useEffect(() => {
    async function poll() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const key = import.meta.env.VITE_FOOTBALL_DATA_KEY || ''
        if (!key) { console.warn('[live] VITE_FOOTBALL_DATA_KEY not set — live scores disabled'); return }
        const res = await fetch(`${API_BASE}/competitions/2000/matches?dateFrom=${today}&dateTo=${today}`, {
          headers: { 'X-Auth-Token': key }
        })
        if (!res.ok) {
          console.warn(`[live] API ${res.status}: ${res.statusText} — check key or competition access`)
          return
        }
        const json = await res.json()
        const map = new Map()
        for (const m of (json.matches || [])) {
          const homeTla = normalizeTla(m.homeTeam?.tla || '')
          const awayTla = normalizeTla(m.awayTeam?.tla || '')
          const local = MATCHES.find(lm => lm.home === homeTla && lm.away === awayTla)
          if (!local) {
            if (homeTla && awayTla) console.warn('[live] unmatched TLA pair:', homeTla, 'vs', awayTla, '— add to TLA_MAP in useLiveScores.js')
            continue
          }
          // fullTime holds the running score during IN_PLAY; fall back to
          // halfTime (populated during HALFTIME) then regularTime for extra time
          const hs = m.score?.fullTime?.home
                  ?? m.score?.halfTime?.home
                  ?? m.score?.regularTime?.home
          const as_ = m.score?.fullTime?.away
                   ?? m.score?.halfTime?.away
                   ?? m.score?.regularTime?.away
          if (hs == null && as_ == null) continue
          map.set(local.id, {
            homeScore: hs ?? 0,
            awayScore: as_ ?? 0,
            status: ['IN_PLAY','PAUSED','HALFTIME'].includes(m.status) ? 'live'
                   : m.status === 'FINISHED' ? 'finished'
                   : 'upcoming',
          })
        }
        setLiveMap(map)
      } catch {
        // Network failure or no API key - silently fall through to static data
      }
    }

    poll()
    const id = setInterval(poll, 60_000)
    return () => clearInterval(id)
  }, [])

  return liveMap
}
