import React, { useState, createContext, useContext, useEffect } from 'react'
import { TIMEZONES } from './data'
import { detectUserTz } from './utils'
import { useLiveScores } from './hooks/useLiveScores'
import Home     from './pages/Home'
import Fixtures from './pages/Fixtures'
import Groups   from './pages/Groups'
import Bracket  from './pages/Bracket'
import Stats    from './pages/Stats'
import Print    from './pages/Print'
import TeamModal from './components/TeamModal'

// ── Global context ─────────────────────────────────────────────────────────────
export const AppCtx = createContext(null)
export function useApp() { return useContext(AppCtx) }

export default function App() {
  const [page,      setPage]      = useState('home')
  const [tz,        setTzState]   = useState(() => detectUserTz())
  const [teamModal, setTeamModal] = useState(null)   // team code or null
  const [fixtureFilter, setFixtureFilter] = useState({ group: '', round: '', team: '', focus: null })
  const liveMap = useLiveScores()

  function setTz(id) {
    const found = TIMEZONES.find(t => t.id === id)
    if (!found) return
    setTzState(found)
    try { localStorage.setItem('wc2026-tz', id) } catch {}
  }

  function navigate(p, opts) {
    setPage(p)
    if (opts?.filterGroup) setFixtureFilter(f => ({ ...f, group: opts.filterGroup, round: '' }))
    if (opts?.focus)       setFixtureFilter(f => ({ ...f, focus: opts.focus, team: '' }))
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setTeamModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ctx = { page, navigate, tz, setTz, liveMap, teamModal, setTeamModal, fixtureFilter, setFixtureFilter }

  return (
    <AppCtx.Provider value={ctx}>
      <Nav />
      <div className="page-wrap">
        {page === 'home'     && <Home />}
        {page === 'fixtures' && <Fixtures />}
        {page === 'groups'   && <Groups />}
        {page === 'bracket'  && <Bracket />}
        {page === 'stats'    && <Stats />}
        {page === 'print'    && <Print />}
      </div>
      {teamModal && <TeamModal code={teamModal} onClose={() => setTeamModal(null)} />}
    </AppCtx.Provider>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Nav() {
  const { page, navigate, tz, setTz, liveMap } = useApp()
  const hasLive = [...liveMap.values()].some(v => v.status === 'live')

  const LINKS = [
    { id: 'home',     label: 'Home' },
    { id: 'groups',   label: 'Groups' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'bracket',  label: 'Bracket' },
    { id: 'stats',    label: 'Stats' },
    { id: 'print',    label: '🖨 Print' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('home')}>
        World Cup <span>2026</span>
        <span style={{
          fontSize: '0.52rem', fontWeight: 600, color: 'rgba(232,184,75,0.75)',
          borderLeft: '1px solid rgba(232,184,75,0.25)', paddingLeft: 8, marginLeft: 8,
          letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
        }}>Taksh✦Labs</span>
      </div>

      <ul className="nav-links">
        {LINKS.map(l => (
          <li key={l.id}>
            <span
              className={`nav-link${page === l.id ? ' active' : ''}`}
              onClick={() => navigate(l.id)}
            >
              {l.id === 'fixtures' && hasLive
                ? <><span className="live-dot" style={{marginRight:5}} />{l.label}</>
                : l.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="nav-actions">
        <select
          className="tz-select"
          value={tz.id}
          onChange={e => setTz(e.target.value)}
          aria-label="Timezone"
        >
          {TIMEZONES.map(t => (
            <option key={t.id} value={t.id}>{t.label} ({t.abbr})</option>
          ))}
        </select>
      </div>
    </nav>
  )
}
