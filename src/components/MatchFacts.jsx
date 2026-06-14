import React, { useState, useCallback } from 'react'

const SCORES_BASE = import.meta.env.BASE_URL   // e.g. '/WC2026/'

function highlightsUrl(homeTeam, awayTeam) {
  const q = `FIFA World Cup 2026 ${homeTeam} vs ${awayTeam} highlights`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

// ── Form badge row ────────────────────────────────────────────────────────────
function FormRow({ form, align = 'left' }) {
  if (!form || !form.length) return null
  const colors = { W: '#4ade80', D: '#94a3b8', L: '#f87171', T: '#f87171' }
  return (
    <div className={`mf-form-row mf-form-${align}`}>
      {form.slice(-5).map((r, i) => (
        <span key={i} className="mf-form-dot" style={{ background: colors[r] || '#94a3b8' }} title={r} />
      ))}
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, home, away }) {
  if (home == null || away == null) return null
  const total = (Number(home) || 0) + (Number(away) || 0)
  const homePct = total ? Math.round((Number(home) / total) * 100) : 50
  return (
    <div className="mf-stat-row">
      <span className="mf-stat-val">{home}</span>
      <div className="mf-stat-bar">
        <div className="mf-stat-fill mf-stat-fill-home" style={{ width: `${homePct}%` }} />
      </div>
      <span className="mf-stat-label">{label}</span>
      <div className="mf-stat-bar">
        <div className="mf-stat-fill mf-stat-fill-away" style={{ width: `${100 - homePct}%` }} />
      </div>
      <span className="mf-stat-val mf-stat-val-r">{away}</span>
    </div>
  )
}

// ── Lineup + H2H modal (lazy-fetched) ────────────────────────────────────────
function LineupModal({ matchId, homeTeam, awayTeam, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  React.useEffect(() => {
    fetch(`${SCORES_BASE}match-details.json?_=${Date.now()}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setDetails(data[matchId] || {})
        setLoading(false)
      })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [matchId])

  const lineup  = details?.lineup
  const h2hData = details?.h2h

  function renderLineupSide(players, label) {
    if (!players) return null
    const starters = players.filter(p => p.starter)
    const subs     = players.filter(p => !p.starter)
    return (
      <div className="mf-lineup-col">
        <div className="mf-lineup-team">{label}</div>
        <div className="mf-lineup-group-label">Starting XI</div>
        {starters.map((p, i) => (
          <div key={i} className="mf-lineup-player">
            <span className="mf-jersey">{p.jersey}</span>
            <span className="mf-pos">{p.pos}</span>
            <span className="mf-pname">{p.name}</span>
          </div>
        ))}
        {subs.length > 0 && <>
          <div className="mf-lineup-group-label">Substitutes</div>
          {subs.map((p, i) => (
            <div key={i} className="mf-lineup-player mf-sub">
              <span className="mf-jersey">{p.jersey}</span>
              <span className="mf-pos">{p.pos}</span>
              <span className="mf-pname">{p.name}</span>
            </div>
          ))}
        </>}
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box mf-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {loading && <div className="mf-detail-loading">Loading...</div>}
        {error   && <div className="mf-detail-loading" style={{ color: 'var(--text-3)' }}>Could not load details</div>}

        {!loading && !error && (
          <>
            {/* Lineups */}
            {lineup ? (
              <div className="mf-detail-section">
                <div className="mf-detail-header">Lineups</div>
                <div className="mf-lineup-grid">
                  {renderLineupSide(lineup.home, homeTeam)}
                  {renderLineupSide(lineup.away, awayTeam)}
                </div>
              </div>
            ) : (
              <div className="mf-detail-section">
                <div className="mf-detail-header">Lineups</div>
                <div className="mf-empty">Not yet available</div>
              </div>
            )}

            {/* H2H */}
            {h2hData && h2hData.length > 0 && (
              <div className="mf-detail-section">
                <div className="mf-detail-header">Head to Head</div>
                <div className="mf-h2h-list">
                  {h2hData.map((g, i) => {
                    const isDraw = g.homeScore === g.awayScore
                    return (
                      <div key={i} className="mf-h2h-row">
                        <span className="mf-h2h-date">{g.date?.slice(0, 7)}</span>
                        <span className="mf-h2h-team">{g.home}</span>
                        <span className="mf-h2h-score">{g.homeScore}–{g.awayScore}</span>
                        <span className="mf-h2h-team mf-h2h-r">{g.away}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!lineup && !(h2hData && h2hData.length) && (
              <div className="mf-empty" style={{ padding: '1.5rem 0' }}>No detail data available yet</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MatchFacts({ live, homeTeam, awayTeam }) {
  const [lineupOpen, setLineupOpen] = useState(false)
  if (!live) return null

  const goals    = live.goals    || []
  const bookings = live.bookings || []
  const stats    = live.stats
  const isFinished = live.status === 'finished'
  const isLive     = live.status === 'live'

  const homeEvents = [
    ...goals.filter(g => g.side === 'home'),
    ...bookings.filter(b => b.side === 'home'),
  ].sort((a, b) => a.minute - b.minute)

  const awayEvents = [
    ...goals.filter(g => g.side === 'away'),
    ...bookings.filter(b => b.side === 'away'),
  ].sort((a, b) => a.minute - b.minute)

  const hasEvents  = homeEvents.length > 0 || awayEvents.length > 0
  const hasStats   = stats?.home && Object.keys(stats.home).length > 0
  const hasForm    = live.homeForm || live.awayForm
  const hlUrl      = isFinished && homeTeam && awayTeam ? highlightsUrl(homeTeam, awayTeam) : null

  return (
    <div className="mf-wrapper">

      {/* ── Stats bar (live + finished) ───────────────── */}
      {hasStats && (
        <div className="mf-stats-block">
          <StatBar label="Possession %" home={stats.home.possession} away={stats.away.possession} />
          <StatBar label="Shots"        home={stats.home.shots}      away={stats.away.shots} />
          <StatBar label="On Target"    home={stats.home.shotsOnTarget} away={stats.away.shotsOnTarget} />
          <StatBar label="Corners"      home={stats.home.corners}    away={stats.away.corners} />
          <StatBar label="Fouls"        home={stats.home.fouls}      away={stats.away.fouls} />
        </div>
      )}

      {/* ── Form badges ──────────────────────────────── */}
      {hasForm && (
        <div className="mf-form-block">
          <FormRow form={live.homeForm} align="left" />
          <span className="mf-form-label">Form</span>
          <FormRow form={live.awayForm} align="right" />
        </div>
      )}

      {/* ── Match events (goals + cards) ─────────────── */}
      {hasEvents ? (
        <div className="mf-events">
          <div className="mf-col">
            {homeEvents.map((e, i) => <EventItem key={i} event={e} side="home" />)}
          </div>
          <div className="mf-col mf-col-away">
            {awayEvents.map((e, i) => <EventItem key={i} event={e} side="away" />)}
          </div>
        </div>
      ) : (
        <div className="mf-empty">
          {isLive ? 'Match in progress — no goals yet' : 'No events recorded'}
        </div>
      )}

      {/* ── Action row ───────────────────────────────── */}
      <div className="mf-actions">
        {live.matchId && (
          <button
            className="mf-action-btn"
            onClick={e => { e.stopPropagation(); setLineupOpen(true) }}
          >
            👥 Lineup & H2H
          </button>
        )}
        {hlUrl && (
          <a
            href={hlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mf-highlights-btn"
            onClick={e => e.stopPropagation()}
          >
            ▶ Official Highlights
          </a>
        )}
      </div>

      {/* ── Lineup / H2H modal ───────────────────────── */}
      {lineupOpen && live.matchId && (
        <LineupModal
          matchId={live.matchId}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onClose={() => setLineupOpen(false)}
        />
      )}
    </div>
  )
}

function EventItem({ event, side }) {
  const minStr = event.injTime ? `${event.minute}+${event.injTime}'` : `${event.minute}'`
  let icon
  if (event.card) {
    icon = event.card === 'RED_CARD' || event.card === 'YELLOW_RED_CARD' ? '🟥' : '🟨'
  } else {
    icon = event.type === 'OWN_GOAL' ? '⚽ OG' : event.type === 'PENALTY' ? '⚽ P' : '⚽'
  }
  const assist = event.assist ? <span className="mf-assist"> ↳ {event.assist}</span> : null
  if (side === 'away') {
    return <div className="mf-event mf-event-away">{event.player} {minStr} {icon}{assist}</div>
  }
  return <div className="mf-event">{icon} {minStr} {event.player}{assist}</div>
}
