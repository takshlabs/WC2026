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
import Venues   from './pages/Venues'
import TeamModal from './components/TeamModal'

// ── Global context ─────────────────────────────────────────────────────────────
export const AppCtx = createContext(null)
export function useApp() { return useContext(AppCtx) }

function loadPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}

export default function App() {
  const [page,      setPage]      = useState('home')
  const [tz,        setTzState]   = useState(() => detectUserTz())
  const [timeFormat, setTimeFormatState] = useState(() => loadPref('wc2026-time', '24'))
  const [theme,     setThemeState] = useState(() => loadPref('wc2026-theme', 'light'))
  const [teamModal, setTeamModal] = useState(null)
  const [fixtureFilter, setFixtureFilter] = useState({ group: '', round: '', team: '', focus: null, timeSlot: '', venue: '' })
  const [myTeams, setMyTeamsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wc2026-myteams') || '[]') } catch { return [] }
  })
  const liveMap = useLiveScores()

  function toggleMyTeam(code) {
    setMyTeamsState(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
      try { localStorage.setItem('wc2026-myteams', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function setTz(id) {
    const found = TIMEZONES.find(t => t.id === id)
    if (!found) return
    setTzState(found)
    try { localStorage.setItem('wc2026-tz', id) } catch {}
  }

  function setTimeFormat(fmt) {
    setTimeFormatState(fmt)
    try { localStorage.setItem('wc2026-time', fmt) } catch {}
  }

  function toggleTheme() {
    setThemeState(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('wc2026-theme', next) } catch {}
      return next
    })
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const ctx = {
    page, navigate, tz, setTz, timeFormat, setTimeFormat,
    theme, toggleTheme, liveMap, teamModal, setTeamModal, fixtureFilter, setFixtureFilter,
    myTeams, toggleMyTeam,
  }

  return (
    <AppCtx.Provider value={ctx}>
      <Nav />
      <div className="page-wrap">
        {page === 'home'     && <Home />}
        {page === 'fixtures' && <Fixtures />}
        {page === 'groups'   && <Groups />}
        {page === 'bracket'  && <Bracket />}
        {page === 'venues'   && <Venues />}
        {page === 'stats'    && <Stats />}
        {page === 'print'    && <Print />}
      </div>
      {teamModal && <TeamModal code={teamModal} onClose={() => setTeamModal(null)} />}
    </AppCtx.Provider>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Nav() {
  const { page, navigate, tz, setTz, timeFormat, setTimeFormat, theme, toggleTheme, liveMap } = useApp()
  const hasLive = [...liveMap.values()].some(v => v.status === 'live')
  const [menuOpen, setMenuOpen] = useState(false)

  const LINKS = [
    { id: 'home',     label: 'Home' },
    { id: 'groups',   label: 'Groups' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'bracket',  label: 'Bracket' },
    { id: 'venues',   label: 'Venues' },
    { id: 'stats',    label: 'Stats' },
    { id: 'print',    label: '🖨 Print' },
  ]

  function goTo(id) {
    navigate(id)
    setMenuOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => goTo('home')}>
          World Cup <span>2026</span>
          <span className="nav-brand-sub">Taksh✦Labs</span>
        </div>

        <ul className="nav-links">
          {LINKS.map(l => (
            <li key={l.id}>
              <span
                className={`nav-link${page === l.id ? ' active' : ''}`}
                onClick={() => goTo(l.id)}
              >
                {l.id === 'fixtures' && hasLive
                  ? <><span className="live-dot" style={{marginRight:5}} />{l.label}</>
                  : l.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <div className="nav-toggle-group" role="group" aria-label="Time format">
            {['12', '24'].map(fmt => (
              <button
                key={fmt}
                type="button"
                className={`nav-toggle${timeFormat === fmt ? ' active' : ''}`}
                onClick={() => setTimeFormat(fmt)}
              >
                {fmt}h
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nav-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <select
            className="tz-select nav-tz-desktop"
            value={tz.id}
            onChange={e => setTz(e.target.value)}
            aria-label="Timezone"
          >
            {TIMEZONES.map(t => (
              <option key={t.id} value={t.id}>{t.label} ({t.abbr})</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="nav-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)} />
          <div className="mobile-nav-drawer">
            {LINKS.map(l => (
              <span
                key={l.id}
                className={`mobile-nav-link${page === l.id ? ' active' : ''}`}
                onClick={() => goTo(l.id)}
              >
                {l.id === 'fixtures' && hasLive
                  ? <><span className="live-dot" />{l.label}</>
                  : l.label}
              </span>
            ))}

            {/* ── Settings section ── */}
            <div className="mobile-nav-divider" />
            <div className="mobile-nav-settings">
              <div className="mobile-nav-settings-row">
                <span className="mobile-settings-label">Time</span>
                <div className="nav-toggle-group">
                  {['12','24'].map(fmt => (
                    <button key={fmt} type="button"
                      className={`nav-toggle${timeFormat === fmt ? ' active' : ''}`}
                      onClick={() => setTimeFormat(fmt)}>
                      {fmt}h
                    </button>
                  ))}
                </div>
                <button type="button" className="nav-icon-btn" onClick={toggleTheme}
                  style={{ marginLeft: 'auto' }}>
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </div>
              <div className="mobile-nav-settings-row">
                <span className="mobile-settings-label">Timezone</span>
                <select className="tz-select" style={{ flex: 1, maxWidth: 'none' }}
                  value={tz.id} onChange={e => setTz(e.target.value)}>
                  {TIMEZONES.map(t => (
                    <option key={t.id} value={t.id}>{t.label} ({t.abbr})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
