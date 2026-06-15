import React from 'react'

const SCORES_BASE = import.meta.env.BASE_URL

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

// ── Stats table (clean numbers, no bars) ─────────────────────────────────────
function StatsTable({ stats }) {
  if (!stats?.home || !stats?.away) return null
  const rows = [
    { key: 'possession',    label: 'Possession %' },
    { key: 'shots',         label: 'Shots' },
    { key: 'shotsOnTarget', label: 'On Target' },
    { key: 'corners',       label: 'Corners' },
    { key: 'fouls',         label: 'Fouls' },
  ]
  const visible = rows.filter(r => stats.home[r.key] != null || stats.away[r.key] != null)
  if (!visible.length) return null

  return (
    <div className="mf-stats-table">
      {visible.map(({ key, label }) => {
        const h = stats.home[key] ?? '–'
        const a = stats.away[key] ?? '–'
        const hNum = Number(h)
        const aNum = Number(a)
        const total = hNum + aNum
        const homePct = total > 0 ? Math.round((hNum / total) * 100) : 50
        return (
          <div key={key} className="mf-st-row">
            <span className={`mf-st-num mf-st-home${hNum > aNum ? ' mf-st-win' : ''}`}>{h}</span>
            <div className="mf-st-mid">
              <div className="mf-st-bar">
                <div className="mf-st-home-fill" style={{ width: `${homePct}%` }} />
              </div>
              <span className="mf-st-label">{label}</span>
            </div>
            <span className={`mf-st-num mf-st-away${aNum > hNum ? ' mf-st-win' : ''}`}>{a}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MatchFacts({ live, homeTeam, awayTeam }) {
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

  const hasEvents = homeEvents.length > 0 || awayEvents.length > 0
  const hasForm   = live.homeForm || live.awayForm
  const hlUrl     = isFinished && homeTeam && awayTeam ? highlightsUrl(homeTeam, awayTeam) : null

  return (
    <div className="mf-wrapper">

      {/* ── Stats table ──────────────────────────────── */}
      <StatsTable stats={stats} />

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

      {/* ── Highlights link ───────────────────────────── */}
      {hlUrl && (
        <div className="mf-highlights">
          <a
            href={hlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mf-highlights-btn"
            onClick={e => e.stopPropagation()}
          >
            ▶ Official Highlights
          </a>
        </div>
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
