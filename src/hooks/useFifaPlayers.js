import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Live FIFA World Cup Fantasy data (CORS-open, refreshed after each match).
const PLAYERS_URL = 'https://play.fifa.com/json/fantasy/players.json'
const SQUADS_URL  = 'https://play.fifa.com/json/fantasy/squads.json'

// Real-life club per FIFA player id, from the Supabase `players` table (the FIFA
// feed has no club field). Powers the United-Clubs rule. Empty when unavailable.
async function fetchClubMap() {
  if (!supabase) return {}
  const map = {}
  // Page through in case the table grows beyond the default row cap.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('players').select('id, club').range(from, from + 999)
    if (error || !data?.length) break
    data.forEach(r => { if (r.club) map[r.id] = r.club })
    if (data.length < 1000) break
  }
  return map
}

// Statuses that mean a player is unavailable to field.
const UNAVAILABLE = new Set(['injured', 'suspended', 'transferred', 'unavailable'])

function displayName(p) {
  if (p.knownName) return p.knownName
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || `Player ${p.id}`
}

// Fetches players + squads and normalises into the shape the squad UI expects.
// player.id is the FIFA integer id; country is the squad abbreviation (matches TEAMS).
export function useFifaPlayers() {
  const [players, setPlayers] = useState([])
  const [byId, setById] = useState({})
  const [squads, setSquads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    Promise.all([
      fetch(PLAYERS_URL).then(r => r.json()),
      fetch(SQUADS_URL).then(r => r.json()),
      fetchClubMap(),
    ])
      .then(([rawPlayers, rawSquads, clubMap]) => {
        if (cancelled) return
        const squadById = {}
        rawSquads.forEach(s => { squadById[s.id] = s })

        const norm = rawPlayers.map(p => {
          const sq = squadById[p.squadId] || {}
          return {
            id: p.id,                              // FIFA integer id
            name: displayName(p),
            country: sq.abbr || '???',             // 3-letter code (matches TEAMS)
            countryName: sq.name || '',
            squadId: p.squadId,
            club: clubMap[p.id] || null,           // real-life club (Supabase) — for United-Clubs
            pos: p.position,                       // GK | DEF | MID | FWD
            price: Number(p.price) || 0,
            status: p.status || 'playing',
            available: !UNAVAILABLE.has(p.status) && !sq.isEliminated,
            eliminated: !!sq.isEliminated,
            totalPoints: p.stats?.totalPoints ?? 0,
            lastRoundPoints: p.stats?.lastRoundPoints ?? 0,
            avgPoints: p.stats?.avgPoints ?? 0,
            percentSelected: p.percentSelected ?? 0,
            oneToWatch: !!p.oneToWatch,
          }
        })
        setPlayers(norm)
        setById(norm.reduce((a, p) => (a[p.id] = p, a), {}))
        setSquads(rawSquads)
        setLoading(false)
      })
      .catch(err => { if (!cancelled) { setError(err.message || 'Failed to load FIFA data'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { players, byId, squads, loading, error }
}
