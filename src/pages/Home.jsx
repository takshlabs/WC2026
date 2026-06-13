import React, { useState, useEffect } from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor, calcStandings, computeFacts } from '../utils'
import { useApp } from '../App'
import { isPwa, isIos } from '../hooks/useNotifications'
import FlagImg from '../components/FlagImg'

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
function YourTeamsSection({ goGroup }) {
  const { tz, timeFormat, liveMap, myTeams, toggleMyTeam, notifPermission, requestPermission } = useApp()
  const [showPicker, setShowPicker] = useState(false)

  const myNext = MATCHES
    .filter(m => m.home && (myTeams.includes(m.home) || myTeams.includes(m.away)) && new Date(`${m.date}T${m.time}:00Z`) >= new Date())
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
                const homeT = TEAMS[m.home]; const awayT = TEAMS[m.away]
                const v = VENUES[m.venue]
                const hs = live?.homeScore ?? m.homeScore; const as_ = live?.awayScore ?? m.awayScore
                const color = groupColor(m.group)
                return (
                  <div className="home-fx-card" key={m.id} onClick={() => goGroup(m.group)}>
                    <div className="home-fx-accent" style={{ background: color }} />
                    <div className="home-fx-header">
                      <span className="home-fx-time">
                        {live?.status === 'live'
                          ? <span className="live-badge" style={{fontSize:'0.55rem'}}><span className="live-dot"/>LIVE</span>
                          : `${conv.dateShort} · ${conv.time} ${conv.abbr}`}
                      </span>
                      <span className="badge badge-group" style={{ background: color, fontSize: '0.55rem' }}>Grp {m.group}</span>
                    </div>
                    <div className="home-fx-matchup">
                      <div className="home-fx-team home"><FlagImg code={m.home} size={18} /><span>{homeT?.name}</span></div>
                      <div className="home-fx-center">
                        {hs !== undefined ? <span className="home-fx-score">{hs}–{as_}</span> : <span className="home-fx-vs">vs</span>}
                      </div>
                      <div className="home-fx-team away"><span>{awayT?.name}</span><FlagImg code={m.away} size={18} /></div>
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

export default function Home() {
  const { tz, timeFormat, navigate, setFixtureFilter, liveMap, setTeamModal, myTeams, toggleMyTeam, notifPermission, requestPermission } = useApp()
  const [countdown,    setCountdown]    = useState(null)
  const [streamsOpen,  setStreamsOpen]   = useState(false)

  // Countdown to Jun 11 2026 21:00 UTC
  useEffect(() => {
    const target = new Date('2026-06-11T19:00:00Z').getTime()
    function tick() {
      const diff = target - Date.now()
      if (diff <= 0) { setCountdown(null); return }
      const d  = Math.floor(diff / 86400000)
      const h  = Math.floor((diff % 86400000) / 3600000)
      const m  = Math.floor((diff % 3600000)  / 60000)
      const s  = Math.floor((diff % 60000)    / 1000)
      setCountdown({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Next 8 upcoming matches - sorted chronologically
  const now = Date.now()
  const msToTs = m => new Date(`${m.date}T${m.time}:00Z`).getTime()
  const upcoming = MATCHES
    .filter(m => m.home && msToTs(m) >= now)
    .sort((a, b) => msToTs(a) - msToTs(b))
    .slice(0, 8)

  // Live matches - sorted by kickoff time
  const liveMatches = MATCHES
    .filter(m => liveMap.get(m.id)?.status === 'live')
    .sort((a, b) => msToTs(a) - msToTs(b))

  // Yesterday's results (UTC date)
  const yestD = new Date(); yestD.setUTCDate(yestD.getUTCDate() - 1)
  const yesterdayStr = yestD.toISOString().slice(0, 10)
  const yesterdayResults = MATCHES
    .filter(m => {
      if (m.date !== yesterdayStr) return false
      const live = liveMap.get(m.id)
      return live?.status === 'finished' || (live?.homeScore != null && live?.awayScore != null)
    })
    .sort((a, b) => msToTs(a) - msToTs(b))

  // Groups A–D preview
  const previewGroups = ['A','B','C','D','E','F','G','H','I','J','K','L']
  const facts = computeFacts()

  const pad = n => String(n).padStart(2, '0')

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
            </div>
            <div className="hero-byline">
              <span className="hero-byline-rule" />
              Built by Saswat Biswas & Vasu Pal at Taksh✦Labs
            </div>
          </div>

          {/* Countdown */}
          {countdown ? (
            <div className="countdown">
              <div className="cd-item">
                <span className="cd-num t-display">{pad(countdown.d)}</span>
                <span className="cd-label">Days</span>
              </div>
              <div className="cd-item">
                <span className="cd-num t-display">{pad(countdown.h)}</span>
                <span className="cd-label">Hours</span>
              </div>
              <div className="cd-item">
                <span className="cd-num t-display">{pad(countdown.m)}</span>
                <span className="cd-label">Mins</span>
              </div>
              <div className="cd-item">
                <span className="cd-num t-display">{pad(countdown.s)}</span>
                <span className="cd-label">Secs</span>
              </div>
            </div>
          ) : (
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
            </div>
          )}
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
                  { label: 'FIFA Footy Bitez', url: 'https://fifa.footybitez.is', note: 'WC 2026 coverage' },
                  { label: 'SportsBite',       url: 'https://sportsbite.xyz',     note: 'Multi-sport streams' },
                  { label: 'EPL Footy Bitez',  url: 'https://epl.footybitez.is',  note: 'Football streams' },
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

      <div className="container">

        {/* ── My Teams ───────────────────────────────────────────────────── */}
        <YourTeamsSection goGroup={goGroup} />

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
            const homeT = TEAMS[m.home]
            const awayT = TEAMS[m.away]
            const v = VENUES[m.venue]
            const hs = live?.homeScore ?? m.homeScore
            const as_ = live?.awayScore ?? m.awayScore
            const color = groupColor(m.group)

            return (
              <div className="home-fx-card" key={m.id} onClick={() => goGroup(m.group)}>
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
                    <FlagImg code={m.home} size={18} />
                    <span>{homeT?.name || '–'}</span>
                  </div>
                  <div className="home-fx-center">
                    {hs !== undefined
                      ? <span className="home-fx-score">{hs}–{as_}</span>
                      : <span className="home-fx-vs">vs</span>}
                  </div>
                  <div className="home-fx-team away">
                    <span>{awayT?.name || '–'}</span>
                    <FlagImg code={m.away} size={18} />
                  </div>
                </div>
                <div className="home-fx-venue">{v?.city}</div>
              </div>
            )
          })}
          </div>
        </div>

        {/* ── Yesterday's Results ────────────────────────────────────────── */}
        {yesterdayResults.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h2>Yesterday's Results</h2>
              <span className="see-all" onClick={() => navigate('fixtures')}>All fixtures →</span>
            </div>
            <div className="yesterday-grid">
              {yesterdayResults.map(m => {
                const live = liveMap.get(m.id)
                const homeT = TEAMS[m.home]; const awayT = TEAMS[m.away]
                const hs = live?.homeScore; const as_ = live?.awayScore
                const color = groupColor(m.group)
                const homeGoals = (live?.goals || []).filter(g => g.side === 'home')
                const awayGoals = (live?.goals || []).filter(g => g.side === 'away')
                const homeCards = (live?.bookings || []).filter(b => b.side === 'home')
                const awayCards = (live?.bookings || []).filter(b => b.side === 'away')
                return (
                  <div key={m.id} className="yesterday-card" onClick={() => goGroup(m.group)}>
                    <div className="yesterday-accent" style={{ background: color }} />
                    <div className="yesterday-inner">
                      <div className="yesterday-matchup">
                        <div className="yesterday-team">
                          <FlagImg code={m.home} size={20} />
                          <span>{homeT?.name}</span>
                        </div>
                        <div className="yesterday-score-block">
                          <span className="yesterday-score">{hs}–{as_}</span>
                          <span className="yesterday-ft">FT</span>
                        </div>
                        <div className="yesterday-team away">
                          <span>{awayT?.name}</span>
                          <FlagImg code={m.away} size={20} />
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

        {/* ── Groups preview ─────────────────────────────────────────────── */}
        <div className="home-section">
          <div className="home-section-header">
            <h2>Group Standings</h2>
            <span className="see-all" onClick={() => navigate('groups')}>All groups →</span>
          </div>

          <div className="preview-groups-grid">
            {previewGroups.map(g => {
              const rows = calcStandings(g, liveMap).slice(0, 4)
              return (
                <div className="preview-group" key={g} onClick={() => goGroup(g)} style={{ cursor: 'pointer' }}>
                  <div className="preview-group-title">
                    <span style={{ background: groupColor(g), width: 3, height: 10, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
                    Group {g}
                  </div>
                  <div className="preview-group-cols">
                    <span className="preview-col-hdr preview-team-name">Team</span>
                    <span className="preview-col-hdr">P</span>
                    <span className="preview-col-hdr">W</span>
                    <span className="preview-col-hdr">D</span>
                    <span className="preview-col-hdr">GD</span>
                    <span className="preview-col-hdr preview-col-pts">Pts</span>
                  </div>
                  {rows.map((r, i) => (
                    <div className="preview-team-row preview-group-cols" key={r.code}>
                      <span className="preview-team-name" style={{ color: i < 2 ? 'var(--text)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', minWidth: 0 }}>
                        <FlagImg code={r.code} size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TEAMS[r.code]?.name}</span>
                      </span>
                      <span className="preview-col-stat">{r.P}</span>
                      <span className="preview-col-stat">{r.W}</span>
                      <span className="preview-col-stat">{r.D}</span>
                      <span className="preview-col-stat">{r.GD > 0 ? `+${r.GD}` : r.GD}</span>
                      <span className="preview-team-pts preview-col-pts">{r.Pts}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bracket preview ────────────────────────────────────────────── */}
        <div className="home-section">
          <div className="home-section-header">
            <h2>Knockout Path</h2>
            <span className="see-all" onClick={() => navigate('bracket')}>Full bracket →</span>
          </div>

          <div style={{ display: 'flex', gap: '0', overflow: 'auto', paddingBottom: '4px' }}>
            {[
              { label: 'ROUND OF 32', dates: 'Jun 28 – Jul 5',  matches: '16 matches' },
              { label: 'ROUND OF 16', dates: 'Jul 5–9',         matches: '8 matches'  },
              { label: 'QUARTER-FINAL', dates: 'Jul 10–11',     matches: '4 matches'  },
              { label: 'SEMI-FINAL',  dates: 'Jul 14–15',       matches: '2 matches'  },
              { label: 'FINAL',       dates: '19 Jul · MetLife, NY', matches: '104th match', gold: true },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                <div
                  style={{
                    padding: '12px 16px',
                    background: s.gold ? 'var(--gold-dim)' : 'var(--surface)',
                    border: `1px solid ${s.gold ? 'rgba(232,184,75,0.3)' : 'var(--border)'}`,
                    borderRadius: 6,
                    minWidth: 160,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={() => navigate('bracket')}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: s.gold ? 'var(--gold)' : 'var(--text-3)', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700, color: s.gold ? 'var(--gold)' : 'var(--text)' }}>{s.dates}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 3 }}>{s.matches}</div>
                </div>
                {i < 4 && <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--text-3)', fontSize: '0.8rem', flexShrink: 0 }}>›</div>}
              </React.Fragment>
            ))}
          </div>
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
