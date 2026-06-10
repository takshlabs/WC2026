import { TIMEZONES, MATCHES, TEAMS, VENUES } from './data'

// ── Time conversion ────────────────────────────────────────────────────────────
export function convertTime(dateStr, timeStr, tz, timeFormat = '24') {
  const [h, m] = timeStr.split(':').map(Number)
  const [yr, mo, dy] = dateStr.split('-').map(Number)
  const utcMs = Date.UTC(yr, mo - 1, dy, h, m)
  const localMs = utcMs + tz.offset * 3600000
  const d = new Date(localMs)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const h24 = d.getUTCHours()
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const hh = String(h24).padStart(2, '0')
  let time
  if (timeFormat === '12') {
    const ampm = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 % 12 || 12
    time = `${h12}:${mm} ${ampm}`
  } else {
    time = `${hh}:${mm}`
  }
  return {
    date: `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
    dateShort: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
    time,
    time24: `${hh}:${mm}`,
    abbr: tz.abbr,
    sortKey: localMs,
  }
}

// ── Group color palette ────────────────────────────────────────────────────────
const GROUP_COLORS = {
  A: '#e74c3c', B: '#e67e22', C: '#f39c12', D: '#27ae60',
  E: '#1abc9c', F: '#3498db', G: '#9b59b6', H: '#e91e8c',
  I: '#ff6b6b', J: '#45b7d1', K: '#96ceb4', L: '#a29bfe',
}
export function groupColor(g) { return GROUP_COLORS[g] || '#888' }

// ── Standings calculation ─────────────────────────────────────────────────────
export function calcStandings(group, liveMap = new Map()) {
  const teams = Object.entries(TEAMS)
    .filter(([, t]) => t.group === group)
    .map(([code]) => code)

  const stats = {}
  teams.forEach(c => { stats[c] = { P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 } })

  const groupMatches = MATCHES.filter(m => m.group === group)
  groupMatches.forEach(m => {
    const live = liveMap.get(m.id)
    const hs = live?.homeScore ?? m.homeScore
    const as_ = live?.awayScore ?? m.awayScore
    if (hs === undefined || as_ === undefined) return
    const h = stats[m.home], a = stats[m.away]
    if (!h || !a) return
    h.P++; a.P++
    h.GF += hs; h.GA += as_
    a.GF += as_; a.GA += hs
    h.GD = h.GF - h.GA; a.GD = a.GF - a.GA
    if (hs > as_) { h.W++; h.Pts += 3; a.L++ }
    else if (hs < as_) { a.W++; a.Pts += 3; h.L++ }
    else { h.D++; a.D++; h.Pts++; a.Pts++ }
  })

  return teams.map(code => ({ code, ...stats[code] })).sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts
    if (b.GD  !== a.GD)  return b.GD  - a.GD
    if (b.GF  !== a.GF)  return b.GF  - a.GF
    return a.code.localeCompare(b.code)
  })
}

// ── Round labels ──────────────────────────────────────────────────────────────
const ROUND_LABELS = {
  gs: 'Group Stage', r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarter-Final', sf: 'Semi-Final', tp: '3rd Place', final: 'Final',
}
export function roundLabel(r) { return ROUND_LABELS[r] || r }

// ── Timezone auto-detection ───────────────────────────────────────────────────
// Uses the OS/browser IANA timezone (Intl API) — same info your phone uses when
// you set "Set time zone automatically". Not GPS; no permission prompt.
export function autoDetectTz() {
  try {
    const ianaZone  = Intl.DateTimeFormat().resolvedOptions().timeZone
    const byIana    = TIMEZONES.find(t => t.iana?.includes(ianaZone))
    if (byIana) return byIana
    // Fallback: match by UTC offset
    const offsetHr  = -new Date().getTimezoneOffset() / 60
    return TIMEZONES.find(t => t.offset === offsetHr) || TIMEZONES.find(t => t.id === 'utc')
  } catch {
    return TIMEZONES.find(t => t.id === 'utc')
  }
}

// On first load: respect saved user preference; otherwise auto-detect.
export function detectUserTz() {
  try {
    const saved = localStorage.getItem('wc2026-tz')
    if (saved) {
      const found = TIMEZONES.find(t => t.id === saved)
      if (found) return found
    }
    return autoDetectTz()
  } catch {
    return TIMEZONES.find(t => t.id === 'utc')
  }
}

// ── Tournament facts (computed, not static) ───────────────────────────────────
export function computeFacts() {
  const teams = Object.entries(TEAMS)

  // Strongest group by avg FIFA ranking (lower = stronger)
  const groups = [...new Set(teams.map(([,t]) => t.group))]
  const groupAvgRank = groups.map(g => {
    const gt = teams.filter(([,t]) => t.group === g)
    const avg = gt.reduce((s,[,t]) => s + t.ranking, 0) / gt.length
    return { group: g, avg: Math.round(avg) }
  })
  const strongest = groupAvgRank.sort((a,b) => a.avg - b.avg)[0]

  const mostApps = teams.sort((a,b) => b[1].wcApps - a[1].wcApps)[0]
  const topRanked = teams.sort((a,b) => a[1].ranking - b[1].ranking)[0]
  const mostWins  = teams.sort((a,b) => b[1].wcWins - a[1].wcWins)[0]
  const maxCapVenue = Object.values(VENUES).sort((a,b) => b.capacity - a.capacity)[0]

  return [
    { label: 'FIRST EXPANDED WORLD CUP',  value: '48 teams · 12 groups · 104 matches' },
    { label: 'MOST WC TITLES (IN 2026)',   value: `${mostWins[1].name} · ${mostWins[1].wcWins} titles` },
    { label: 'MOST APPEARANCES',           value: `${mostApps[1].name} · ${mostApps[1].wcApps} WCs` },
    { label: 'HIGHEST RANKED TEAM',        value: `${topRanked[1].name} · FIFA #${topRanked[1].ranking}` },
    { label: 'LARGEST VENUE',              value: `${maxCapVenue.name} · ${maxCapVenue.capacity.toLocaleString()} capacity` },
    { label: 'TOUGHEST GROUP (AVG RANK)',  value: `Group ${strongest.group} · avg FIFA #${strongest.avg}` },
    { label: 'HOST COUNTRIES',             value: 'USA (11 venues) · Canada (2) · Mexico (3)' },
    { label: 'TOURNAMENT DURATION',        value: '39 days · 11 June – 19 July 2026' },
    { label: 'ONLY OFC REPRESENTATIVE',    value: 'New Zealand · FIFA #97' },
    { label: 'DEBUTANTS IN 2026',          value: 'Curaçao, Haiti, Cape Verde, Jordan, Uzbekistan' },
  ]
}
