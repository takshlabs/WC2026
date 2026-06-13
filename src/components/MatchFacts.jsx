import React from 'react'

function EventItem({ event, side }) {
  const minStr = event.injTime ? `${event.minute}+${event.injTime}'` : `${event.minute}'`

  let icon
  if (event.card) {
    icon = event.card === 'RED_CARD' || event.card === 'YELLOW_RED_CARD' ? '🟥' : '🟨'
  } else {
    icon = event.type === 'OWN_GOAL' ? '⚽ OG' : event.type === 'PENALTY' ? '⚽ P' : '⚽'
  }

  const assist = event.assist
    ? <span className="mf-assist"> ↳ {event.assist}</span>
    : null

  if (side === 'away') {
    return (
      <div className="mf-event mf-event-away">
        {event.player} {minStr} {icon}{assist}
      </div>
    )
  }
  return (
    <div className="mf-event">
      {icon} {minStr} {event.player}{assist}
    </div>
  )
}

export default function MatchFacts({ live }) {
  if (!live) return null

  const goals    = live.goals    || []
  const bookings = live.bookings || []

  const homeEvents = [
    ...goals.filter(g => g.side === 'home'),
    ...bookings.filter(b => b.side === 'home'),
  ].sort((a, b) => a.minute - b.minute)

  const awayEvents = [
    ...goals.filter(g => g.side === 'away'),
    ...bookings.filter(b => b.side === 'away'),
  ].sort((a, b) => a.minute - b.minute)

  const hasEvents = homeEvents.length > 0 || awayEvents.length > 0

  if (!hasEvents) {
    return (
      <div className="mf-empty">
        {live.status === 'live' ? 'Match in progress — no goals yet' : 'No events recorded'}
      </div>
    )
  }

  return (
    <div className="mf-events">
      <div className="mf-col">
        {homeEvents.map((e, i) => <EventItem key={i} event={e} side="home" />)}
      </div>
      <div className="mf-col mf-col-away">
        {awayEvents.map((e, i) => <EventItem key={i} event={e} side="away" />)}
      </div>
    </div>
  )
}
