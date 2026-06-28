import React, { useState, useRef, createContext, useContext, useEffect } from 'react'
import { TIMEZONES, MATCHES } from './data'
import { detectUserTz } from './utils'
import { useLiveScores } from './hooks/useLiveScores'
import { useVisitorCount } from './hooks/useVisitorCount'
import { useMyTeamsSync } from './hooks/useMyTeamsSync'
import { useNotifications, showGoalNotif } from './hooks/useNotifications'
import Home     from './pages/Home'
import Fixtures from './pages/Fixtures'
import Groups   from './pages/Groups'
import Bracket  from './pages/Bracket'
import Stats    from './pages/Stats'
import Print    from './pages/Print'
import Venues   from './pages/Venues'
import FPL      from './pages/FPL'
import TeamModal   from './components/TeamModal'
import ScrollToTop from './components/ScrollToTop'
import GlobalChat  from './components/GlobalChat'

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
  const { myTeams, toggleMyTeam, syncId, importFromSyncId, syncing } = useMyTeamsSync()
  const { matches, liveMap, lastUpdated } = useLiveScores()
  const { permission: notifPermission, requestPermission, scheduleNotifications } = useNotifications()
  const prevScoresRef = useRef(new Map())

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
    window.addEventListener('keydown', onKey, { passive: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  // Reschedule kickoff notifications when starred teams or permission changes
  useEffect(() => { scheduleNotifications(myTeams) }, [myTeams, notifPermission]) // eslint-disable-line

  // Goal notifications — fires whenever live scores update
  useEffect(() => {
    if (notifPermission !== 'granted' || !myTeams.length) return
    liveMap.forEach((live, matchId) => {
      if (live.status !== 'live') return
      const m = MATCHES.find(mm => mm.id === matchId)
      if (!m || (!myTeams.includes(m.home) && !myTeams.includes(m.away))) return
      const key = `${live.homeScore}-${live.awayScore}`
      const prev = prevScoresRef.current.get(matchId)
      if (prev !== undefined && prev !== key) showGoalNotif(m, live.homeScore, live.awayScore)
      prevScoresRef.current.set(matchId, key)
    })
  }, [liveMap]) // eslint-disable-line

  const ctx = {
    page, navigate, tz, setTz, timeFormat, setTimeFormat,
    theme, toggleTheme, matches, liveMap, lastUpdated, teamModal, setTeamModal, fixtureFilter, setFixtureFilter,
    myTeams, toggleMyTeam, syncId, importFromSyncId, syncing,
    notifPermission, requestPermission,
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
        {page === 'fpl'      && <FPL />}
        {page === 'print'    && <Print />}
      </div>
      {teamModal && <TeamModal code={teamModal} onClose={() => setTeamModal(null)} />}
      <ScrollToTop />
      <GlobalChat />
    </AppCtx.Provider>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Nav() {
  const { page, navigate, tz, setTz, timeFormat, setTimeFormat, theme, toggleTheme, liveMap, syncId, importFromSyncId, syncing } = useApp()
  const hasLive = [...liveMap.values()].some(v => v.status === 'live')
  const visitCount = useVisitorCount()
  const [importInput, setImportInput] = useState('')
  const [importMsg,   setImportMsg]   = useState('')
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [coffeeOpen, setCoffeeOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyUPI() {
    navigator.clipboard?.writeText('saswatbiswas@ibl').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
          <li>
            <span className="nav-link nav-link-coffee" onClick={() => setCoffeeOpen(true)}>
              ☕ Support
            </span>
          </li>
          <li>
            <span
              className={`nav-link nav-link-fpl${page === 'fpl' ? ' active' : ''}`}
              onClick={() => goTo('fpl')}
            >
              FPL
            </span>
          </li>
        </ul>

        <div className="nav-actions">
          {visitCount !== null && (
            <span className="nav-visits" title="Total all-time visits">
              <span className="nav-visits-dot" />
              {visitCount.toLocaleString()}
              <span className="nav-visits-label">VISITS</span>
            </span>
          )}
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
          <div className="mobile-nav-drawer mobile-nav-drawer--settings">
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

              {visitCount !== null && (
                <div className="mobile-nav-settings-row">
                  <span className="mobile-settings-label">Visits</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700 }}>{visitCount.toLocaleString()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>all-time</span>
                </div>
              )}

              {syncId && (
                <div className="mobile-sync-section">
                  <div className="mobile-nav-settings-row">
                    <span className="mobile-settings-label">Sync ID</span>
                    <code className="sync-id-chip">{syncId}</code>
                    <button className="sync-copy-btn" onClick={() => navigator.clipboard?.writeText(syncId)}>Copy</button>
                  </div>
                  <div className="mobile-nav-settings-row" style={{ gap: 6 }}>
                    <input
                      className="sync-import-input"
                      placeholder="Enter another device's ID"
                      value={importInput}
                      onChange={e => { setImportInput(e.target.value); setImportMsg('') }}
                      maxLength={8}
                    />
                    <button
                      className="btn btn-ghost sync-import-btn"
                      disabled={syncing || importInput.trim().length < 4}
                      onClick={async () => {
                        const result = await importFromSyncId(importInput)
                        if (result === 'empty') setImportMsg('No teams found for that ID.')
                        else if (result === 'same') setImportMsg('That\'s your current ID.')
                        else if (result === 'error') setImportMsg('Could not connect.')
                      }}
                    >{syncing ? '…' : 'Import'}</button>
                  </div>
                  {importMsg && <p className="sync-msg">{importMsg}</p>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── ☕ Support modal ──────────────────────────────────────────────── */}
      {coffeeOpen && (
        <div className="modal-overlay" onClick={() => setCoffeeOpen(false)}>
          <div className="modal-box coffee-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCoffeeOpen(false)}>✕</button>

            <div className="coffee-modal-body">
              <div className="coffee-emoji">☕</div>
              <h2 className="coffee-title">Buy me a coffee?</h2>
              <p className="coffee-sub">
                Enjoying the tracker? Fuel the developer with coffee or tokens, same energy.
              </p>

              <div className="coffee-upi-wrap">
                <span className="coffee-upi-label">UPI ID</span>
                <div className="coffee-upi-row">
                  <code className="coffee-upi-id">saswatbiswas@ibl</code>
                  <button className="coffee-copy-btn" onClick={copyUPI}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="coffee-thanks">
                Thank you for the support. 🙏
              </p>
              <p className="coffee-brand">Built by Saswat Biswas · Taksh✦Labs</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
