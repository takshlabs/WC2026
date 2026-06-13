import React, { useMemo, useState, useEffect } from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor, roundLabel } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'
import { useMatchReactions, REACTIONS } from '../hooks/useMatchReactions'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const ROUNDS  = [
  { value: 'gs',    label: 'Group Stage'    },
  { value: 'r32',   label: 'Round of 32'    },
  { value: 'r16',   label: 'Round of 16'    },
  { value: 'qf',    label: 'Quarter-Final'  },
  { value: 'sf',    label: 'Semi-Final'     },
  { value: 'tp',    label: '3rd Place'      },
  { value: 'final', label: 'Final'          },
]

const TIME_SLOTS = [
  { id: '',          label: 'All Times' },
  { id: 'morning',   label: '🌅 Morning',   hours: [6, 7, 8, 9, 10, 11] },
  { id: 'afternoon', label: '☀️ Afternoon',  hours: [12, 13, 14, 15, 16, 17] },
  { id: 'evening',   label: '🌆 Evening',    hours: [18, 19, 20, 21, 22, 23] },
  { id: 'latenight', label: '🌙 Late Night', hours: [0, 1, 2, 3, 4, 5] },
]

function useAgo(date) {
  const [, forceRender] = useState(0)
  useEffect(() => {
    if (!date) return
    const id = setInterval(() => forceRender(n => n + 1), 30_000)
    return () => clearInterval(id)
  }, [date])
  if (!date) return null
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60)  return 'just now'
  if (secs < 120) return '1 min ago'
  return `${Math.floor(secs / 60)} mins ago`
}

export default function Fixtures() {
  const { tz, timeFormat, setTeamModal, liveMap, lastUpdated, fixtureFilter, setFixtureFilter } = useApp()
  const { group, round, team, focus, timeSlot, venue } = fixtureFilter
  const [localTeam, setLocalTeam] = useState(team || '')
  const ago = useAgo(lastUpdated)

  function clearAll() {
    setFixtureFilter({ group: '', round: '', team: '', focus: null, timeSlot: '', venue: '' })
    setLocalTeam('')
  }
  function clearFocus() { setFixtureFilter(f => ({ ...f, focus: null })) }
  function clearVenue() { setFixtureFilter(f => ({ ...f, venue: '' })) }

  const enriched = useMemo(() => {
    const sorted = [...MATCHES].sort(
      (a, b) => new Date(`${a.date}T${a.time}:00Z`) - new Date(`${b.date}T${b.time}:00Z`)
    )
    return sorted.map(m => {
      const conv = convertTime(m.date, m.time, tz, timeFormat)
      const live = liveMap.get(m.id)
      return { ...m, conv, live }
    })
  }, [tz, timeFormat, liveMap])

  const filtered = useMemo(() => {
    const teamQ = localTeam.toLowerCase()
    const slotHours = TIME_SLOTS.find(s => s.id === timeSlot)?.hours
    return enriched.filter(m => {
      if (group && group !== 'KO') {
        if (m.group !== group) return false
      } else if (group === 'KO') {
        if (m.round === 'gs') return false
      }
      if (round && m.round !== round) return false
      if (teamQ) {
        const hn = TEAMS[m.home]?.name.toLowerCase() || (m.homeLabel||'').toLowerCase()
        const an = TEAMS[m.away]?.name.toLowerCase() || (m.awayLabel||'').toLowerCase()
        if (!hn.includes(teamQ) && !an.includes(teamQ)) return false
      }
      if (focus && m.home !== focus && m.away !== focus) return false
      if (venue && m.venue !== venue) return false
      if (slotHours) {
        const dt = new Date(`${m.date}T${m.time}:00Z`)
        const utcMins = dt.getUTCHours() * 60 + dt.getUTCMinutes()
        const offsetMins = Math.round((tz?.offset ?? 0) * 60)
        const localMins = ((utcMins + offsetMins) % 1440 + 1440) % 1440
        const h = Math.floor(localMins / 60)
        if (!slotHours.includes(h)) return false
      }
      return true
    })
  }, [enriched, group, round, localTeam, focus, timeSlot, venue, tz])

  const byDate = useMemo(() => {
    const map = new Map()
    filtered.forEach(m => {
      const key = m.conv.date
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(m)
    })
    return [...map.entries()]
  }, [filtered])

  const focusTeam = focus ? TEAMS[focus] : null
  const venueObj = venue ? VENUES[venue] : null

  return (
    <div className="container fixtures-page" style={{ paddingTop: '1rem' }}>
      <div className="page-header page-header-compact">
        <h1>Match Schedule</h1>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>104 matches · 11 June – 19 July 2026 · Click any team name to view their profile</span>
          {ago && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap' }}>
              ● scores updated {ago}
            </span>
          )}
        </p>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>Group / Stage</label>
          <select value={group} onChange={e => setFixtureFilter(f => ({ ...f, group: e.target.value }))}>
            <option value="">All Matches</option>
            <optgroup label="Groups">
              {GROUPS.map(g => <option key={g} value={g}>Group {g}</option>)}
            </optgroup>
            <optgroup label="Knockout">
              <option value="KO">All Knockout</option>
            </optgroup>
          </select>
        </div>

        <div className="filter-group">
          <label>Round</label>
          <select value={round} onChange={e => setFixtureFilter(f => ({ ...f, round: e.target.value }))}>
            <option value="">All Rounds</option>
            {ROUNDS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label>Search Team</label>
          <input
            type="text"
            placeholder="e.g. Brazil, England…"
            value={localTeam}
            onChange={e => {
              setLocalTeam(e.target.value)
              setFixtureFilter(f => ({ ...f, team: e.target.value }))
            }}
            style={{ minWidth: 160 }}
          />
        </div>

        <button className="btn btn-ghost" style={{ height: 32, marginTop: 18 }} onClick={clearAll}>
          Clear
        </button>

        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)', alignSelf: 'flex-end', paddingBottom: '6px' }}>
          {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Time-of-day filter */}
      <div className="timeslot-bar">
        {TIME_SLOTS.map(s => (
          <button
            key={s.id}
            className={`timeslot-chip${timeSlot === s.id ? ' active' : ''}`}
            onClick={() => setFixtureFilter(f => ({ ...f, timeSlot: s.id }))}
          >{s.label}</button>
        ))}
        {timeSlot && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)', alignSelf: 'center' }}>
            In your timezone ({tz.abbr})
          </span>
        )}
      </div>

      {venueObj && (
        <div className="focus-banner">
          <span>🏟 <strong>{venueObj.name}</strong> · {venueObj.city}</span>
          <button className="focus-clear" onClick={clearVenue}>✕ Clear</button>
        </div>
      )}
      {focusTeam && (
        <div className="focus-banner">
          <span>Showing fixtures for <strong>{focusTeam.flag} {focusTeam.name}</strong></span>
          <button className="focus-clear" onClick={clearFocus}>✕ Clear</button>
        </div>
      )}

      {byDate.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          No matches found
        </div>
      ) : (
        <div className="fixture-schedule-outer">
          <div className="fixture-schedule">
            {byDate.map(([dateLabel, matches]) => (
              <div key={dateLabel} className="fixture-day-block">
                <div className="fixture-date-header">{dateLabel}</div>
                <div className="fixture-day-rows">
                  {matches.map(m => <MatchRow key={m.id} m={m} focus={focus} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchEventBadge({ event }) {
  const minStr = event.injTime ? `${event.minute}+${event.injTime}'` : `${event.minute}'`
  if (event.card) {
    const icon = event.card === 'RED_CARD' || event.card === 'YELLOW_RED_CARD' ? '🟥' : '🟨'
    return <span className="fx-event-item">{icon} {minStr} {event.player}</span>
  }
  const icon = event.type === 'OWN_GOAL' ? '⚽ OG' : event.type === 'PENALTY' ? '⚽ P' : '⚽'
  const assistStr = event.assist ? ` (${event.assist})` : ''
  return <span className="fx-event-item">{icon} {minStr} {event.player}{assistStr}</span>
}

function MatchRow({ m, focus }) {
  const { setTeamModal, myTeams, toggleMyTeam } = useApp()
  const homeT = TEAMS[m.home]
  const awayT = TEAMS[m.away]
  const v     = VENUES[m.venue]
  const live  = m.live
  const { counts, react } = useMatchReactions(m.id, live?.status === 'live')
  const hs    = live?.homeScore ?? m.homeScore
  const as_   = live?.awayScore ?? m.awayScore
  const isLive     = live?.status === 'live'
  const isFinished = live?.status === 'finished'
  const isFocus = focus && (m.home === focus || m.away === focus)
  const color   = m.group ? groupColor(m.group) : 'var(--border-2)'

  const hasEvents = (live?.goals?.length > 0 || live?.bookings?.length > 0)
  const homeEvents = (isLive || isFinished) && hasEvents
    ? [...(live.goals || []).filter(g => g.side === 'home'), ...(live.bookings || []).filter(b => b.side === 'home')]
        .sort((a, b) => a.minute - b.minute)
    : []
  const awayEvents = (isLive || isFinished) && hasEvents
    ? [...(live.goals || []).filter(g => g.side === 'away'), ...(live.bookings || []).filter(b => b.side === 'away')]
        .sort((a, b) => a.minute - b.minute)
    : []

  return (
    <div className={`fx-row${isLive ? ' is-live' : ''}${isFocus ? ' is-focus' : ''}`}>
      <div className="fx-accent" style={{ background: color }} />
      <div className="fx-time">
        {isLive
          ? <span className="live-badge" style={{ fontSize: '0.55rem' }}><span className="live-dot" />LIVE</span>
          : isFinished
            ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-3)' }}>FT</span>
            : m.conv.time}
      </div>
      <div className={`fx-team home${!homeT ? ' tbd' : ''}`}>
        {homeT && (
          <button className={`fx-star${myTeams.includes(m.home) ? ' starred' : ''}`}
            onClick={e => { e.stopPropagation(); toggleMyTeam(m.home) }}
            title={myTeams.includes(m.home) ? 'Unwatch' : 'Watch team'}>★</button>
        )}
        <span onClick={() => homeT && setTeamModal(m.home)} style={{ display:'inline-flex', alignItems:'center', gap:5, cursor: homeT ? 'pointer' : 'default' }}>
          {homeT && <FlagImg code={m.home} size={16} />}
          {homeT ? homeT.name : (m.homeLabel || 'TBD')}
        </span>
      </div>
      <div>
        {hs !== undefined
          ? <span className="fx-score">{hs}–{as_}</span>
          : <span className="fx-vs">vs</span>}
      </div>
      <div className={`fx-team away${!awayT ? ' tbd' : ''}`}>
        <span onClick={() => awayT && setTeamModal(m.away)} style={{ display:'inline-flex', alignItems:'center', gap:5, cursor: awayT ? 'pointer' : 'default' }}>
          {awayT ? awayT.name : (m.awayLabel || 'TBD')}
          {awayT && <FlagImg code={m.away} size={16} />}
        </span>
        {awayT && (
          <button className={`fx-star${myTeams.includes(m.away) ? ' starred' : ''}`}
            onClick={e => { e.stopPropagation(); toggleMyTeam(m.away) }}
            title={myTeams.includes(m.away) ? 'Unwatch' : 'Watch team'}>★</button>
        )}
      </div>
      <div className="fx-venue">{v?.city || '-'}</div>
      <div className="fx-badge">
        {m.group && <span className="badge badge-group" style={{ background: color }}>G{m.group}</span>}
        {m.md    && <span className="badge badge-md">MD{m.md}</span>}
        {m.md === 3 && m.group && <span className="badge badge-simul">SIM</span>}
        {!m.group && <span className="badge badge-round">{m.matchLabel}</span>}
      </div>
      {isLive && (
        <div className="fx-reactions">
          {REACTIONS.map(({ key, emoji }) => (
            <button key={key} className="rx-btn" onClick={() => react(key)}>
              {emoji}<span className="rx-count">{counts[key] ? ` ${counts[key]}` : ''}</span>
            </button>
          ))}
          <span className="rx-label">React</span>
        </div>
      )}
      {(homeEvents.length > 0 || awayEvents.length > 0) && (
        <div className="fx-events">
          <div className="fx-events-home">
            {homeEvents.map((e, i) => <MatchEventBadge key={i} event={e} />)}
          </div>
          <div className="fx-events-away">
            {awayEvents.map((e, i) => <MatchEventBadge key={i} event={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}
