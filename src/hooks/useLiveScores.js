import { useState, useEffect } from 'react'
import { MATCHES } from '../data'

// Map football-data.org TLAs → our data.js codes where they differ
const TLA_MAP = { 'URY': 'URU' }
function normalizeTla(code) { return TLA_MAP[code] || code }

// Works on GitHub Pages (direct) and local dev (proxy)
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.football-data.org/v4'

export function useLiveScores() {
  const [liveMap, setLiveMap] = useState(new Map())

  useEffect(() => {
    async function poll() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const res = await fetch(`${API_BASE}/competitions/2000/matches?dateFrom=${today}&dateTo=${today}`, {
          headers: { 'X-Auth-Token': import.meta.env.VITE_FOOTBALL_DATA_KEY || '' }
        })
        if (!res.ok) return
        const json = await res.json()
        const map = new Map()
        for (const m of (json.matches || [])) {
          const homeTla = normalizeTla(m.homeTeam?.tla || '')
          const awayTla = normalizeTla(m.awayTeam?.tla || '')
          const local = MATCHES.find(lm => lm.home === homeTla && lm.away === awayTla)
          if (!local) continue
          const hs = m.score?.fullTime?.home
          const as_ = m.score?.fullTime?.away
          if (hs == null && as_ == null) continue
          map.set(local.id, {
            homeScore: hs ?? 0,
            awayScore: as_ ?? 0,
            status: ['IN_PLAY','PAUSED'].includes(m.status) ? 'live'
                   : m.status === 'FINISHED' ? 'finished'
                   : 'upcoming',
          })
        }
        if (map.size > 0) setLiveMap(map)
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
