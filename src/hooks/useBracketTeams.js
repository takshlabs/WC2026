import { useMemo } from 'react'
import { MATCHES, TEAMS } from '../data'
import { calcStandings } from '../utils'

// ── Constants ────────────────────────────────────────────────────────────────
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

// Per-slot eligible source groups for the 8 3rd-place qualifiers.
// Derived from the slot labels in data.js (e.g. '3A/B/C/D/F').
// Assignment uses bipartite matching — a valid pairing, but the official
// FIFA Annex C table (not publicly available pre-tournament) may differ
// when multiple valid assignments exist. Treat as provisional.
// Key = matchLabel of the R32 match that receives a 3rd-place team.
const THIRD_PLACE_SLOTS = {
  'R32-2':  ['A','B','C','D','F'],
  'R32-5':  ['C','D','F','G','H'],
  'R32-7':  ['C','E','F','H','I'],
  'R32-8':  ['E','H','I','J','K'],
  'R32-9':  ['B','E','F','I','J'],
  'R32-10': ['A','E','H','I','J'],
  'R32-13': ['E','F','G','I','J'],
  'R32-15': ['D','E','I','J','L'],
}

// ── 3rd-place tiebreaker (Pts → GD → GF → FIFA ranking) ─────────────────────
function compareThirdPlace(a, b) {
  if (b.Pts !== a.Pts) return b.Pts - a.Pts
  if (b.GD  !== a.GD)  return b.GD  - a.GD
  if (b.GF  !== a.GF)  return b.GF  - a.GF
  const ra = TEAMS[a.code]?.ranking ?? 999
  const rb = TEAMS[b.code]?.ranking ?? 999
  return ra - rb
}

// ── Bipartite matching: assign qualifying 3rd-place teams to R32 slots ────────
// Uses augmenting-path DFS. Processes teams in best→worst order so the
// highest-ranked teams get the first viable slot when a choice exists.
// Returns Map<matchLabel, teamCode>.
function assign3rdPlaceTeams(qualifying3rds) {
  const slotKeys = Object.keys(THIRD_PLACE_SLOTS)
  const teamCodes = qualifying3rds.map(t => t.code)
  const matching = new Array(slotKeys.length).fill(-1)  // slotIdx → teamIdx

  function dfs(ti, visited) {
    for (let si = 0; si < slotKeys.length; si++) {
      if (visited[si]) continue
      const grp = TEAMS[teamCodes[ti]]?.group
      if (!THIRD_PLACE_SLOTS[slotKeys[si]].includes(grp)) continue
      visited[si] = true
      if (matching[si] === -1 || dfs(matching[si], visited)) {
        matching[si] = ti
        return true
      }
    }
    return false
  }

  for (let ti = 0; ti < teamCodes.length; ti++) {
    dfs(ti, new Array(slotKeys.length).fill(false))
  }

  const result = new Map()
  for (let si = 0; si < slotKeys.length; si++) {
    if (matching[si] !== -1) result.set(slotKeys[si], teamCodes[matching[si]])
  }
  return result
}

// ── Orientation-safe winner resolver ────────────────────────────────────────
// For KO matches liveMap entries carry scoreByCode: {code → score} built from
// ESPN/fd.org team names, avoiding home/away position ambiguity.
// Falls back to positional homeScore/awayScore (used by group stage).
// Handles AET/penalty outcomes via fd.org's score.winner field when scores tie.
function pickWinner(live, homeCode, awayCode) {
  if (live?.scoreByCode) {
    const hs  = live.scoreByCode[homeCode]
    const as_ = live.scoreByCode[awayCode]
    if (hs != null && as_ != null) {
      if (hs > as_) return homeCode
      if (as_ > hs) return awayCode
      // Scores level (AET/pens): use fd.org winner field if available.
      // winner is 'HOME_TEAM'|'AWAY_TEAM' relative to fd.org's home.
      // We identify fd.org's home by checking which code matches live.homeScore.
      if (live.winner === 'HOME_TEAM' || live.winner === 'AWAY_TEAM') {
        const fdHomeIsOurHome = live.homeScore === hs
        const fdHomeWon = live.winner === 'HOME_TEAM'
        return (fdHomeWon === fdHomeIsOurHome) ? homeCode : awayCode
      }
      return null  // truly unknown (rare: ESPN scoreByCode vs fd.org scores differ)
    }
  }
  // Fallback: positional scores (group stage, or KO without scoreByCode yet)
  const hs  = live?.homeScore ?? 0
  const as_ = live?.awayScore ?? 0
  if (hs > as_) return homeCode
  if (as_ > hs) return awayCode
  if (live?.winner === 'HOME_TEAM') return homeCode
  if (live?.winner === 'AWAY_TEAM') return awayCode
  return null
}

// ── Core computation ─────────────────────────────────────────────────────────
// Returns Map<matchId, { home: string|null, away: string|null }> for all
// knockout matches where at least one team can be resolved.
export function computeBracketTeams(liveMap) {
  // 1. Group standings (all 12)
  const standingsMap = {}
  for (const g of GROUPS) standingsMap[g] = calcStandings(g, liveMap)

  // A group is "complete" when all 6 of its group-stage matches are finished
  function groupComplete(g) {
    return MATCHES
      .filter(m => m.group === g)
      .every(m => {
        const live = liveMap.get(m.id)
        return live?.status === 'finished' || m.homeScore !== undefined
      })
  }

  // 2. Identify best 8 3rd-place qualifiers (only when ALL 12 groups are done)
  const allGroupsComplete = GROUPS.every(groupComplete)
  let thirdAssignment = new Map()

  if (allGroupsComplete) {
    const thirds = GROUPS
      .map(g => ({ ...standingsMap[g][2], group: g }))
      .filter(t => t?.code)
      .sort(compareThirdPlace)
      .slice(0, 8)
    thirdAssignment = assign3rdPlaceTeams(thirds)
  }

  // 3. matchLabel → match lookup (R32-1, R16-2, QF-3, etc.)
  const matchByLabel = {}
  for (const m of MATCHES) if (m.matchLabel) matchByLabel[m.matchLabel] = m

  // 4. Iteratively resolve knockout team codes in round order (IDs 73–104)
  // Each round's results depend on the previous round's resolved teams + scores.
  const resolved = new Map()  // matchId → { home: code|null, away: code|null }

  function resolveLabel(label, matchLabel) {
    if (!label) return null

    // '1A' / '2B' → group finisher
    const direct = label.match(/^([12])([A-L])$/)
    if (direct) {
      const pos = parseInt(direct[1]) - 1
      const g = direct[2]
      if (!groupComplete(g)) return null
      return standingsMap[g][pos]?.code ?? null
    }

    // '3A/B/C/D/F' → pre-assigned best 3rd-place team for this slot
    if (label.startsWith('3')) {
      return thirdAssignment.get(matchLabel) ?? null
    }

    // 'W R32-1' / 'W R16-2' → winner of source match
    const w = label.match(/^W (.+)$/)
    if (w) {
      const src = matchByLabel[w[1]]
      if (!src) return null
      const r = resolved.get(src.id)
      if (!r?.home || !r?.away) return null
      const live = liveMap.get(src.id)
      if (live?.status !== 'finished') return null
      return pickWinner(live, r.home, r.away)
    }

    // 'L SF-1' / 'L SF-2' → loser of source match (3rd place match)
    const l = label.match(/^L (.+)$/)
    if (l) {
      const src = matchByLabel[l[1]]
      if (!src) return null
      const r = resolved.get(src.id)
      if (!r?.home || !r?.away) return null
      const live = liveMap.get(src.id)
      if (live?.status !== 'finished') return null
      const winner = pickWinner(live, r.home, r.away)
      if (!winner) return null
      return winner === r.home ? r.away : r.home
    }

    return null
  }

  // Process knockout matches in ID order — R32 (73-88) before R16 (89-96) etc.
  const koMatches = MATCHES.filter(m => m.round !== 'gs')
  for (const m of koMatches) {
    const home = m.home ?? resolveLabel(m.homeLabel, m.matchLabel)
    const away = m.away ?? resolveLabel(m.awayLabel, m.matchLabel)
    resolved.set(m.id, { home, away })
  }

  return resolved
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useBracketTeams(liveMap) {
  return useMemo(() => computeBracketTeams(liveMap), [liveMap])
}
