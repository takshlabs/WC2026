import React, { useState, useEffect } from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor, computeFacts } from '../utils'
import { useApp } from '../App'
import { isPwa, isIos } from '../hooks/useNotifications'
import FlagImg from '../components/FlagImg'
import { useBracketTeams } from '../hooks/useBracketTeams'

// ── Bookmark button ───────────────────────────────────────────────────────────
function BookmarkButton() {
  const [hint, setHint] = useState(null)

  function handleBookmark() {
    // No programmatic bookmark API exists — show the appropriate hint
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isMobile) {
      setHint('tap ☆ in your browser')
    } else {
      const isMac = /mac/i.test(navigator.platform || navigator.userAgent)
      setHint(isMac ? '⌘D' : 'Ctrl+D')
    }
    setTimeout(() => setHint(null), 3000)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className="btn btn-ghost bookmark-btn"
        onClick={handleBookmark}
        title="Bookmark this page"
        aria-label="Bookmark this page"
      >
        🔖 Bookmark
      </button>
      {hint && (
        <div className="bookmark-hint">
          Press <kbd>{hint}</kbd> to bookmark
        </div>
      )}
    </div>
  )
}

// ── Team picker (shown in Your Teams empty state or when + is clicked) ────────
function TeamPicker() {
  const { myTeams, toggleMyTeam, notifPermission, requestPermission } = useApp()
  const sorted = Object.entries(TEAMS).sort(([,a],[,b]) =>
    a.group.localeCompare(b.group) || a.name.localeCompare(b.name)
  )
  return (
    <div className="teams-picker-grid">
      {sorted.map(([code, t]) => {
        const picked = myTeams.includes(code)
        return (
          <button
            key={code}
            className={`team-pick-btn${picked ? ' picked' : ''}`}
            onClick={() => {
              toggleMyTeam(code)
              if (!picked && notifPermission === 'default') requestPermission()
            }}
          >
            <FlagImg code={code} size={14} />
            <span>{t.name}</span>
            {picked && <span className="team-pick-check">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Your Teams section (always visible) ──────────────────────────────────────
function YourTeamsSection({ goGroup, resolvedTeams }) {
  const { tz, timeFormat, liveMap, myTeams, toggleMyTeam, notifPermission, requestPermission } = useApp()
  const [showPicker, setShowPicker] = useState(false)

  const myNext = MATCHES
    .filter(m => {
      const r = resolvedTeams?.get(m.id)
      const hCode = m.home ?? r?.home
      const aCode = m.away ?? r?.away
      return hCode && aCode && (myTeams.includes(hCode) || myTeams.includes(aCode)) && new Date(`${m.date}T${m.time}:00Z`) >= new Date()
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}:00Z`) - new Date(`${b.date}T${b.time}:00Z`))
    .slice(0, 4)

  const isEmpty = myTeams.length === 0

  return (
    <div className="home-section">
      <div className="home-section-header">
        <h2>⭐ Your Teams</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {myTeams.map(code => {
            const t = TEAMS[code]
            return (
              <span key={code} className="my-team-chip" onClick={() => toggleMyTeam(code)}>
                <FlagImg code={code} size={12} /> {t?.name}
                <span className="my-team-chip-x">✕</span>
              </span>
            )
          })}
          <button
            className={`my-teams-add-btn${isEmpty ? ' large' : ''}`}
            onClick={() => setShowPicker(v => !v)}
            title={showPicker ? 'Close' : 'Add team'}
          >{showPicker ? '✕' : '+'}</button>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && !showPicker && (
        <div className="teams-empty-hint">
          <p>Track teams, get live score alerts, and match reminders — right here.</p>
          <p>Tap <strong>+</strong> to add your teams.</p>
        </div>
      )}

      {/* Team picker */}
      {showPicker && <TeamPicker />}

      {/* Notification permission banner */}
      {!isEmpty && !showPicker && (() => {
        const onIosNonPwa = isIos() && !isPwa()
        if (onIosNonPwa) return (
          <div className="notif-banner">
            <span>🔔 Add to Home Screen to enable goal &amp; kickoff alerts</span>
            <span className="notif-banner-hint">Safari → Share → Add to Home Screen</span>
          </div>
        )
        if (notifPermission === 'default') return (
          <div className="notif-banner">
            <span>🔔 Get kickoff reminders &amp; goal alerts for your teams</span>
            <button className="btn btn-gold notif-banner-btn" onClick={requestPermission}>Enable</button>
          </div>
        )
        return null
      })()}

      {/* Upcoming fixtures */}
      {!isEmpty && !showPicker && (
        myNext.length === 0
          ? <p className="teams-no-fixtures">No upcoming fixtures scheduled yet.</p>
          : (
            <div className="home-fx-grid">
              {myNext.map(m => {
                const live = liveMap.get(m.id)
                const conv = convertTime(m.date, m.time, tz, timeFormat)
                const r = resolvedTeams?.get(m.id)
                const homeCode = m.home ?? r?.home ?? null
                const awayCode = m.away ?? r?.away ?? null
                const homeT = TEAMS[homeCode]; const awayT = TEAMS[awayCode]
                const v = VENUES[m.venue]
                const hs = live?.homeScore ?? m.homeScore; const as_ = live?.awayScore ?? m.awayScore
                const color = groupColor(m.group)
                return (
                  <div className="home-fx-card" key={m.id} onClick={() => m.group ? goGroup(m.group) : navigate('fixtures')}>
                    <div className="home-fx-accent" style={{ background: color }} />
                    <div className="home-fx-header">
                      <span className="home-fx-time">
                        {live?.status === 'live'
                          ? <span className="live-badge" style={{fontSize:'0.55rem'}}><span className="live-dot"/>{liveMap.get(m.id)?.displayClock || 'LIVE'}</span>
                          : `${conv.dateShort} · ${conv.time} ${conv.abbr}`}
                      </span>
                      <span className="badge badge-group" style={{ background: color, fontSize: '0.55rem' }}>Grp {m.group}</span>
                    </div>
                    <div className="home-fx-matchup">
                      <div className="home-fx-team home"><FlagImg code={homeCode} size={18} /><span>{homeT?.name}</span></div>
                      <div className="home-fx-center">
                        {hs !== undefined ? (
                          <>
                            <span className="home-fx-score">{hs}–{as_}</span>
                            {live?.penalties && live?.status === 'finished' && (
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: 'var(--text-3)' }}>pen {live.penalties.home}–{live.penalties.away}</div>
                            )}
                          </>
                        ) : <span className="home-fx-vs">vs</span>}
                      </div>
                      <div className="home-fx-team away"><span>{awayT?.name}</span><FlagImg code={awayCode} size={18} /></div>
                    </div>
                    <div className="home-fx-venue">{v?.city}</div>
                  </div>
                )
              })}
            </div>
          )
      )}
    </div>
  )
}

// ── Mini Knockout Bracket ────────────────────────────────────────────────────
// Same absolute-grid + SVG connector approach as BracketTree, scaled down.
const MB_COL_W   = 82
const MB_COL_GAP = 12
const MB_STEP    = MB_COL_W + MB_COL_GAP  // 94
const MB_ROW_H   = 60
const MB_N       = 8
const MB_H       = MB_N * MB_ROW_H  // 480

const MB_CENTER_GAP = 12
const MB_FINAL_X = MB_STEP * 3 + MB_COL_W + MB_CENTER_GAP   // 376
const MB_SF_R_X  = MB_FINAL_X + MB_COL_W + MB_CENTER_GAP    // 470
const MB_X = {
  R32_L: 0, R16_L: MB_STEP, QF_L: MB_STEP*2, SF_L: MB_STEP*3,
  FINAL: MB_FINAL_X,
  SF_R: MB_SF_R_X, QF_R: MB_SF_R_X+MB_STEP, R16_R: MB_SF_R_X+MB_STEP*2, R32_R: MB_SF_R_X+MB_STEP*3,
}
const MB_W = MB_X.R32_R + MB_COL_W  // 834

const mbYCtr = i => i * MB_ROW_H + MB_ROW_H / 2
const MB_R32_Y = Array.from({ length: 8 }, (_, i) => mbYCtr(i))
const MB_R16_Y = [(MB_R32_Y[0]+MB_R32_Y[1])/2,(MB_R32_Y[2]+MB_R32_Y[3])/2,(MB_R32_Y[4]+MB_R32_Y[5])/2,(MB_R32_Y[6]+MB_R32_Y[7])/2]
const MB_QF_Y  = [(MB_R16_Y[0]+MB_R16_Y[1])/2,(MB_R16_Y[2]+MB_R16_Y[3])/2]
const MB_SF_Y  = (MB_QF_Y[0]+MB_QF_Y[1])/2

const MB_POSITIONS = [
  // Left R32 — FIFA cross-pairings: {73,76}→89  {75,78}→90  {84,83}→93  {82,81}→94
  [73,MB_X.R32_L,MB_R32_Y[0]], [76,MB_X.R32_L,MB_R32_Y[1]],
  [75,MB_X.R32_L,MB_R32_Y[2]], [78,MB_X.R32_L,MB_R32_Y[3]],
  [84,MB_X.R32_L,MB_R32_Y[4]], [83,MB_X.R32_L,MB_R32_Y[5]],
  [82,MB_X.R32_L,MB_R32_Y[6]], [81,MB_X.R32_L,MB_R32_Y[7]],
  // Left R16
  [89,MB_X.R16_L,MB_R16_Y[0]], [90,MB_X.R16_L,MB_R16_Y[1]],
  [93,MB_X.R16_L,MB_R16_Y[2]], [94,MB_X.R16_L,MB_R16_Y[3]],
  // Left QF + SF + Final + Right SF
  [97,MB_X.QF_L, MB_QF_Y[0]], [98,MB_X.QF_L, MB_QF_Y[1]],
  [101,MB_X.SF_L,MB_SF_Y], [104,MB_FINAL_X,MB_SF_Y], [102,MB_SF_R_X,MB_SF_Y],
  // Right QF
  [99,MB_X.QF_R, MB_QF_Y[0]], [100,MB_X.QF_R,MB_QF_Y[1]],
  // Right R16
  [91,MB_X.R16_R,MB_R16_Y[0]], [92,MB_X.R16_R,MB_R16_Y[1]],
  [95,MB_X.R16_R,MB_R16_Y[2]], [96,MB_X.R16_R,MB_R16_Y[3]],
  // Right R32 — {74,77}→91  {79,80}→92  {87,86}→95  {85,88}→96
  [74,MB_X.R32_R,MB_R32_Y[0]], [77,MB_X.R32_R,MB_R32_Y[1]],
  [79,MB_X.R32_R,MB_R32_Y[2]], [80,MB_X.R32_R,MB_R32_Y[3]],
  [87,MB_X.R32_R,MB_R32_Y[4]], [86,MB_X.R32_R,MB_R32_Y[5]],
  [85,MB_X.R32_R,MB_R32_Y[6]], [88,MB_X.R32_R,MB_R32_Y[7]],
]

const MB_L_CONN = [
  {cx:MB_X.R32_L+MB_COL_W, yA:MB_R32_Y[0], yB:MB_R32_Y[1], px:MB_X.R16_L},
  {cx:MB_X.R32_L+MB_COL_W, yA:MB_R32_Y[2], yB:MB_R32_Y[3], px:MB_X.R16_L},
  {cx:MB_X.R32_L+MB_COL_W, yA:MB_R32_Y[4], yB:MB_R32_Y[5], px:MB_X.R16_L},
  {cx:MB_X.R32_L+MB_COL_W, yA:MB_R32_Y[6], yB:MB_R32_Y[7], px:MB_X.R16_L},
  {cx:MB_X.R16_L+MB_COL_W, yA:MB_R16_Y[0], yB:MB_R16_Y[1], px:MB_X.QF_L},
  {cx:MB_X.R16_L+MB_COL_W, yA:MB_R16_Y[2], yB:MB_R16_Y[3], px:MB_X.QF_L},
  {cx:MB_X.QF_L +MB_COL_W, yA:MB_QF_Y[0],  yB:MB_QF_Y[1],  px:MB_X.SF_L},
]
const MB_R_CONN = [
  {cx:MB_X.R32_R, yA:MB_R32_Y[0], yB:MB_R32_Y[1], px:MB_X.R16_R+MB_COL_W},
  {cx:MB_X.R32_R, yA:MB_R32_Y[2], yB:MB_R32_Y[3], px:MB_X.R16_R+MB_COL_W},
  {cx:MB_X.R32_R, yA:MB_R32_Y[4], yB:MB_R32_Y[5], px:MB_X.R16_R+MB_COL_W},
  {cx:MB_X.R32_R, yA:MB_R32_Y[6], yB:MB_R32_Y[7], px:MB_X.R16_R+MB_COL_W},
  {cx:MB_X.R16_R, yA:MB_R16_Y[0], yB:MB_R16_Y[1], px:MB_X.QF_R+MB_COL_W},
  {cx:MB_X.R16_R, yA:MB_R16_Y[2], yB:MB_R16_Y[3], px:MB_X.QF_R+MB_COL_W},
  {cx:MB_X.QF_R,  yA:MB_QF_Y[0],  yB:MB_QF_Y[1],  px:MB_X.SF_R+MB_COL_W},
]

function MiniCard({ matchId, liveMap, resolvedTeams }) {
  const m = MATCHES.find(mm => mm.id === matchId)
  if (!m) return null
  const live = liveMap?.get(matchId)
  const r    = resolvedTeams?.get(matchId)
  const homeCode = m.home ?? r?.home ?? null
  const awayCode = m.away ?? r?.away ?? null
  const isLive = live?.status === 'live'
  const isFinished = live?.status === 'finished'
  let hs = live?.homeScore ?? m.homeScore
  let as_ = live?.awayScore ?? m.awayScore
  if (live?.scoreByCode && homeCode && awayCode) {
    hs  = live.scoreByCode[homeCode] ?? hs
    as_ = live.scoreByCode[awayCode] ?? as_
  }
  const showScore = isLive || isFinished
  let homeWin = showScore && hs != null && as_ != null && hs > as_
  let awayWin = showScore && hs != null && as_ != null && as_ > hs
  if (showScore && !homeWin && !awayWin && isFinished && live?.winnerCode) {
    if (live.winnerCode === homeCode) homeWin = true
    if (live.winnerCode === awayCode) awayWin = true
  }

  let penH = null, penA = null
  if (live?.penaltiesByCode && homeCode && awayCode) {
    penH = live.penaltiesByCode[homeCode]
    penA = live.penaltiesByCode[awayCode]
  } else if (live?.penalties) {
    penH = live.penalties.home
    penA = live.penalties.away
  }
  const hasPens = penH != null && penA != null

  function Slot({ code, label, win }) {
    const t = TEAMS[code]
    return (
      <div className={`mb-slot${win ? ' mb-slot--win' : ''}${!t ? ' mb-slot--tbd' : ''}`}>
        <span className="mb-flag">{t ? <FlagImg code={code} size={13} /> : null}</span>
        <span className="mb-tla">{code || (label && label.length <= 6 ? label : '—')}</span>
        {showScore && <span className="mb-score">{homeCode===code ? hs : as_}</span>}
      </div>
    )
  }

  return (
    <div className={`mb-card${isLive ? ' mb-card--live' : ''}${matchId===104 ? ' mb-card--final' : ''}`}>
      <Slot code={homeCode} label={m.homeLabel} win={homeWin} />
      <Slot code={awayCode} label={m.awayLabel} win={awayWin} />
      {hasPens && isFinished && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: 'var(--text-3)', lineHeight: 1.2 }}>
          pen {penH}–{penA}
        </div>
      )}
    </div>
  )
}

function MiniKnockoutBracket({ liveMap, resolvedTeams, onNavigate }) {
  const clr = 'var(--border-2)'
  const sw  = 1.5

  function Connectors({ conns, side }) {
    return conns.map(({ cx, yA, yB, px }, i) => {
      const mid  = side === 'left' ? cx + MB_COL_GAP/2 : cx - MB_COL_GAP/2
      const yMid = (yA + yB) / 2
      return (
        <g key={i} stroke={clr} strokeWidth={sw} fill="none" strokeLinecap="round">
          <line x1={cx}  y1={yA}   x2={mid}  y2={yA}   />
          <line x1={cx}  y1={yB}   x2={mid}  y2={yB}   />
          <line x1={mid} y1={yA}   x2={mid}  y2={yB}   />
          <line x1={mid} y1={yMid} x2={px}   y2={yMid} />
        </g>
      )
    })
  }

  const cardProps = { liveMap, resolvedTeams }

  return (
    <div className="mb-scroll" onClick={onNavigate} title="Open full bracket">
      <div className="mb-canvas" style={{ width: MB_W, height: MB_H }}>
        <svg className="mb-svg" width={MB_W} height={MB_H}>
          <Connectors conns={MB_L_CONN} side="left" />
          <Connectors conns={MB_R_CONN} side="right" />
          <line x1={MB_X.SF_L+MB_COL_W} y1={MB_SF_Y} x2={MB_FINAL_X}         y2={MB_SF_Y} stroke={clr} strokeWidth={sw} strokeLinecap="round" />
          <line x1={MB_FINAL_X+MB_COL_W} y1={MB_SF_Y} x2={MB_SF_R_X}         y2={MB_SF_Y} stroke={clr} strokeWidth={sw} strokeLinecap="round" />
        </svg>
        {MB_POSITIONS.map(([matchId, x, yCenter]) => (
          <div
            key={matchId}
            style={{ position: 'absolute', left: x, top: yCenter, transform: 'translateY(-50%)', width: MB_COL_W }}
          >
            <MiniCard matchId={matchId} {...cardProps} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { tz, timeFormat, navigate, setFixtureFilter, liveMap, setTeamModal, myTeams, toggleMyTeam, notifPermission, requestPermission } = useApp()
  const resolvedTeams = useBracketTeams(liveMap)
  const [streamsOpen,     setStreamsOpen]      = useState(false)
  const [highlightsOpen,  setHighlightsOpen]  = useState(false)
  const [newsArticles,    setNewsArticles]    = useState([])

  // News feed — fetched on mount and every 3 hours
  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}wc2026-news.json?_=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setNewsArticles(data.articles || [])
        }
      } catch (_) {}
    }
    fetchNews()
    const id = setInterval(fetchNews, 3 * 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // Next 8 upcoming matches - sorted chronologically
  const now = Date.now()
  const msToTs = m => new Date(`${m.date}T${m.time}:00Z`).getTime()
  const upcoming = MATCHES
    .filter(m => (m.home || resolvedTeams?.get(m.id)?.home) && msToTs(m) >= now)
    .sort((a, b) => msToTs(a) - msToTs(b))
    .slice(0, 8)

  // Live matches - sorted by kickoff time
  const liveMatches = MATCHES
    .filter(m => liveMap.get(m.id)?.status === 'live')
    .sort((a, b) => msToTs(a) - msToTs(b))

  // Recent results — finished matches in the past 48 hours, most recent first
  const recentCutoffMs = Date.now() - 48 * 60 * 60 * 1000
  const recentResults = MATCHES
    .filter(m => {
      const ts = msToTs(m)
      if (ts > now || ts < recentCutoffMs) return false
      const live = liveMap.get(m.id)
      return live?.status === 'finished'
    })
    .sort((a, b) => msToTs(b) - msToTs(a))

  const facts = computeFacts()

  function goGroup(g) {
    setFixtureFilter(f => ({ ...f, group: g, round: '', focus: null, team: '' }))
    navigate('fixtures')
  }

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">FIFA World Cup™</div>
            <h1 className="hero-title">
              World Cup <span className="year">2026</span>
            </h1>
            <p className="hero-sub">USA · Canada · Mexico</p>
            <p className="hero-meta">11 JUNE – 19 JULY 2026 &nbsp;·&nbsp; 48 TEAMS &nbsp;·&nbsp; 104 MATCHES</p>

            {liveMatches.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span className="live-badge"><span className="live-dot" />LIVE NOW - {liveMatches.length} match{liveMatches.length > 1 ? 'es' : ''}</span>
              </div>
            )}

            <div className="hero-actions">
              <button className="btn btn-gold" onClick={() => navigate('fixtures')}>View Schedule</button>
              <button className="btn btn-ghost" onClick={() => navigate('stats')}>Stats Dashboard</button>
              <BookmarkButton />
            </div>
            <div className="hero-byline">
              <span className="hero-byline-rule" />
              Built by Saswat Biswas & Vasu Pal at Taksh✦Labs
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="live-badge" style={{ fontSize: '1rem', padding: '12px 20px' }}>
              <span className="live-dot" /> TOURNAMENT IS LIVE
            </div>
            <button
              className="btn btn-ghost streams-btn"
              onClick={() => setStreamsOpen(true)}
            >
              📺 Watch Live Streams
            </button>
            <button
              className="btn btn-ghost streams-btn highlights-hero-btn"
              onClick={() => setHighlightsOpen(true)}
            >
              🎬 Match Highlights
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      <div className="quick-stats">
        {[['48','TEAMS'],['104','MATCHES'],['16','VENUES'],['3','COUNTRIES'],['39','DAYS'],['12','GROUPS']].map(([n,l]) => (
          <div className="qs-item" key={l}>
            <span className="qs-num">{n}</span>
            <span className="qs-label">{l}</span>
          </div>
        ))}
      </div>

      {/* ── Streams modal ─────────────────────────────────────────────────── */}
      {streamsOpen && (
        <div className="modal-overlay" onClick={() => setStreamsOpen(false)}>
          <div className="modal-box streams-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setStreamsOpen(false)}>✕</button>
            <div className="streams-modal-body">
              <div className="streams-modal-icon">📺</div>
              <h2 className="streams-modal-title">Watch on Third Party Streams</h2>
              <p className="streams-modal-sub">
                These are fan-operated third party streams not affiliated with FIFA or this tracker. Use at your own discretion.
              </p>
              <div className="streams-links">
                {[
                  { label: 'XYZ Streams',      url: 'https://xyzstreams.st/',                      note: 'Live sports streams' },
                  { label: 'Tifo Live',        url: 'https://www.tifo-live.app',                    note: 'Football & WC coverage' },
                  { label: 'FIFA Footy Bitez', url: 'https://fifa.footybitez.is',                  note: 'WC 2026 coverage' },
                  { label: 'SportsBite',       url: 'https://sportsbite.xyz',                      note: 'Multi-sport streams' },
                  { label: 'EPL Footy Bitez',  url: 'https://epl.footybitez.is',                  note: 'Football streams' },
                  { label: 'Soccer Streams',   url: 'https://www.soccerstreams.news/sport-tv5/',   note: 'Soccer streams' },
                  { label: 'Streams East',     url: 'https://streamseast.is/soccer',               note: 'Soccer streams' },
                ].map(({ label, url, note }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stream-link-card"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="stream-link-label">{label}</div>
                      <div className="stream-link-url">{url.replace('https://', '')}</div>
                    </div>
                    <div className="stream-link-note">{note}</div>
                    <span className="stream-link-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Highlights modal ──────────────────────────────────────────────── */}
      {highlightsOpen && (() => {
        const finished = MATCHES
          .filter(m => liveMap.get(m.id)?.status === 'finished')
          .sort((a, b) => new Date(`${b.date}T${b.time}:00Z`) - new Date(`${a.date}T${a.time}:00Z`))
        return (
          <div className="modal-overlay" onClick={() => setHighlightsOpen(false)}>
            <div className="modal-box streams-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setHighlightsOpen(false)}>✕</button>
              <div className="streams-modal-body">
                <div className="streams-modal-icon">🎬</div>
                <h2 className="streams-modal-title">Match Highlights</h2>
                <p className="streams-modal-sub">
                  Official FIFA highlights on YouTube · updates automatically as matches finish
                </p>
                {finished.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    No finished matches yet
                  </p>
                ) : (
                  <div className="hl-grid">
                    {finished.map(m => {
                      const live  = liveMap.get(m.id)
                      const homeT = TEAMS[m.home]
                      const awayT = TEAMS[m.away]
                      const q   = `FIFA World Cup 2026 ${homeT?.name} vs ${awayT?.name} highlights`
                      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
                      return (
                        <a key={m.id} href={url} target="_blank" rel="noopener noreferrer" className="hl-row">
                          <FlagImg code={m.home} size={13} />
                          <span className="hl-name">{homeT?.name || m.home}</span>
                          <span className="hl-sc">{live?.homeScore}–{live?.awayScore}{live?.penalties && <span style={{ fontSize: '0.55rem', color: 'var(--text-3)', marginLeft: 3 }}>(p {live.penalties.home}–{live.penalties.away})</span>}</span>
                          <span className="hl-name hl-name-r">{awayT?.name || m.away}</span>
                          <FlagImg code={m.away} size={13} />
                          <span className="hl-arrow">▶</span>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="container">

        {/* ── My Teams ───────────────────────────────────────────────────── */}
        <YourTeamsSection goGroup={goGroup} resolvedTeams={resolvedTeams} />

        {/* ── Live scores or upcoming ────────────────────────────────────── */}
        <div className="home-section">
          <div className="home-section-header">
            <h2>
              {liveMatches.length > 0
                ? <><span className="live-dot" style={{marginRight:7,verticalAlign:'middle'}} />Live Scores</>
                : 'Next Fixtures'}
            </h2>
            <span className="see-all" onClick={() => navigate('fixtures')}>All fixtures →</span>
          </div>

          <div className="home-fx-grid">
          {(liveMatches.length > 0 ? liveMatches : upcoming).map(m => {
            const live = liveMap.get(m.id)
            const conv = convertTime(m.date, m.time, tz, timeFormat)
            const r = resolvedTeams?.get(m.id)
            const homeCode = m.home ?? r?.home ?? null
            const awayCode = m.away ?? r?.away ?? null
            const homeT = TEAMS[homeCode]
            const awayT = TEAMS[awayCode]
            const v = VENUES[m.venue]
            const hs = live?.homeScore ?? m.homeScore
            const as_ = live?.awayScore ?? m.awayScore
            const color = groupColor(m.group)

            return (
              <div className="home-fx-card" key={m.id} onClick={() => m.group ? goGroup(m.group) : navigate('fixtures')}>
                <div className="home-fx-accent" style={{ background: color }} />
                <div className="home-fx-header">
                  <span className="home-fx-time">
                    {live?.status === 'live'
                      ? <span className="live-badge" style={{fontSize:'0.55rem'}}><span className="live-dot"/>LIVE</span>
                      : `${conv.dateShort} · ${conv.time} ${conv.abbr}`}
                  </span>
                  <span className="badge badge-group" style={{ background: color, fontSize: '0.55rem' }}>
                    Grp {m.group}
                  </span>
                </div>
                <div className="home-fx-matchup">
                  <div className="home-fx-team home">
                    <FlagImg code={homeCode} size={18} />
                    <span>{homeT?.name || (m.homeLabel || '–')}</span>
                  </div>
                  <div className="home-fx-center">
                    {hs !== undefined
                      ? <>
                          <span className="home-fx-score">{hs}–{as_}</span>
                          {live?.penalties && live?.status === 'finished' && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: 'var(--text-3)' }}>pen {live.penalties.home}–{live.penalties.away}</div>
                          )}
                        </>
                      : <span className="home-fx-vs">vs</span>}
                  </div>
                  <div className="home-fx-team away">
                    <span>{awayT?.name || (m.awayLabel || '–')}</span>
                    <FlagImg code={awayCode} size={18} />
                  </div>
                </div>
                <div className="home-fx-venue">{v?.city}</div>
              </div>
            )
          })}
          </div>
        </div>

        {/* ── Recent Results ────────────────────────────────────────── */}
        {recentResults.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h2>Recent Results</h2>
              <span className="see-all" onClick={() => navigate('fixtures')}>All fixtures →</span>
            </div>
            <div className="yesterday-grid">
              {recentResults.map(m => {
                const live = liveMap.get(m.id)
                const r = resolvedTeams?.get(m.id)
                const homeCode = m.home ?? r?.home ?? null
                const awayCode = m.away ?? r?.away ?? null
                const homeT = TEAMS[homeCode]; const awayT = TEAMS[awayCode]
                const hs = live?.homeScore; const as_ = live?.awayScore
                const color = groupColor(m.group)
                const homeGoals = (live?.goals || []).filter(g => g.side === 'home')
                const awayGoals = (live?.goals || []).filter(g => g.side === 'away')
                const homeCards = (live?.bookings || []).filter(b => b.side === 'home')
                const awayCards = (live?.bookings || []).filter(b => b.side === 'away')
                return (
                  <div key={m.id} className="yesterday-card" onClick={() => m.group ? goGroup(m.group) : navigate('fixtures')}>
                    <div className="yesterday-accent" style={{ background: color }} />
                    <div className="yesterday-inner">
                      <div className="yesterday-matchup">
                        <div className="yesterday-team">
                          <FlagImg code={homeCode} size={20} />
                          <span>{homeT?.name || (m.homeLabel || '–')}</span>
                        </div>
                        <div className="yesterday-score-block">
                          <span className="yesterday-score">{hs}–{as_}</span>
                          <span className="yesterday-ft">{live?.duration === 'PENALTY_SHOOTOUT' ? 'pens' : live?.duration === 'EXTRA_TIME' ? 'AET' : 'FT'}</span>
                          {live?.penalties && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-3)' }}>pen {live.penalties.home}–{live.penalties.away}</span>
                          )}
                        </div>
                        <div className="yesterday-team away">
                          <span>{awayT?.name || (m.awayLabel || '–')}</span>
                          <FlagImg code={awayCode} size={20} />
                        </div>
                      </div>
                      {(homeGoals.length > 0 || awayGoals.length > 0 || homeCards.length > 0 || awayCards.length > 0) && (
                        <div className="yesterday-events">
                          <div className="yesterday-events-side">
                            {[...homeGoals, ...homeCards].sort((a,b) => a.minute - b.minute).map((e, i) => (
                              <span key={i} className="yesterday-event">
                                {e.card ? (e.card === 'RED_CARD' || e.card === 'YELLOW_RED_CARD' ? '🟥' : '🟨') : (e.type === 'OWN_GOAL' ? '⚽ OG' : e.type === 'PENALTY' ? '⚽ P' : '⚽')}
                                {' '}{e.minute}' {e.player}
                              </span>
                            ))}
                          </div>
                          <div className="yesterday-events-side away">
                            {[...awayGoals, ...awayCards].sort((a,b) => a.minute - b.minute).map((e, i) => (
                              <span key={i} className="yesterday-event">
                                {e.player} {e.minute}'{' '}
                                {e.card ? (e.card === 'RED_CARD' || e.card === 'YELLOW_RED_CARD' ? '🟥' : '🟨') : (e.type === 'OWN_GOAL' ? 'OG ⚽' : e.type === 'PENALTY' ? 'P ⚽' : '⚽')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── News Feed ─────────────────────────────────────────────────── */}
        {newsArticles.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h2>WC2026 News</h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>via ESPN · refreshes 3h</span>
            </div>
            <div className="news-grid">
              {newsArticles.slice(0, 6).map(a => (
                <a
                  key={a.id || a.headline}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                >
                  {a.image && (
                    <div className="news-img-wrap">
                      <img src={a.image} alt="" className="news-img" loading="lazy" />
                    </div>
                  )}
                  <div className="news-body">
                    <div className="news-type">{a.type === 'Recap' ? '📋 Recap' : a.type === 'Preview' ? '🔭 Preview' : '📰 News'}</div>
                    <div className="news-headline">{a.headline}</div>
                    {a.description && <div className="news-desc">{a.description}</div>}
                    {a.teams?.length > 0 && (
                      <div className="news-teams">{a.teams.slice(0,3).join(' · ')}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Knockout Bracket (mini) ─────────────────────────────────── */}
        <div className="home-section">
          <div className="home-section-header">
            <h2>Knockout Bracket</h2>
            <span className="see-all" onClick={() => navigate('bracket')}>Full bracket →</span>
          </div>
          <div className="mb-hint">← swipe to explore · tap to open full bracket →</div>
          <MiniKnockoutBracket
            liveMap={liveMap}
            resolvedTeams={resolvedTeams}
            onNavigate={() => navigate('bracket')}
          />
        </div>

        {/* ── Tournament facts ───────────────────────────────────────────── */}
        <div className="home-section home-section-compact">
          <div className="home-section-header">
            <h2>Tournament Facts</h2>
            <span className="see-all" onClick={() => navigate('stats')}>Stats →</span>
          </div>
          <div className="facts-list facts-list-compact">
            {facts.map(f => (
              <div className="fact-row" key={f.label}>
                <span className="fact-label">{f.label}</span>
                <span className="fact-value">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
