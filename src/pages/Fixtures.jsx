import React, { useMemo, useState } from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor, roundLabel } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'

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

export default function Fixtures() {
  const { tz, setTeamModal, liveMap, fixtureFilter, setFixtureFilter } = useApp()
  const { group, round, team, focus } = fixtureFilter
  const [localTeam, setLocalTeam] = useState(team || '')

  function clearAll() {
    setFixtureFilter({ group: '', round: '', team: '', focus: null })
    setLocalTeam('')
  }
  function clearFocus() { setFixtureFilter(f => ({ ...f, focus: null })) }

  const enriched = useMemo(() => {
    const sorted = [...MATCHES].sort(
      (a, b) => new Date(`${a.date}T${a.time}:00Z`) - new Date(`${b.date}T${b.time}:00Z`)
    )
    return sorted.map(m => {
      const conv = convertTime(m.date, m.time, tz)
      const live = liveMap.get(m.id)
      return { ...m, conv, live }
    })
  }, [tz, liveMap])

  const filtered = useMemo(() => {
    const teamQ = localTeam.toLowerCase()
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
      return true
    })
  }, [enriched, group, round, localTeam, focus])

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

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <h1>Match Schedule</h1>
        <p>104 matches · 11 June – 19 July 2026 · Click any team name to view their profile</p>
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
        byDate.map(([dateLabel, matches]) => (
          <div key={dateLabel}>
            <div className="fixture-date-header">{dateLabel}</div>
            <div className="fx-grid">
              {matches.map(m => <MatchCard key={m.id} m={m} focus={focus} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function MatchCard({ m, focus }) {
  const { setTeamModal } = useApp()
  const homeT = TEAMS[m.home]
  const awayT = TEAMS[m.away]
  const v     = VENUES[m.venue]
  const live  = m.live
  const hs    = live?.homeScore ?? m.homeScore
  const as_   = live?.awayScore ?? m.awayScore
  const isLive  = live?.status === 'live'
  const isFocus = focus && (m.home === focus || m.away === focus)
  const color   = m.group ? groupColor(m.group) : 'var(--border-2)'

  return (
    <div className={`fx-card${isLive ? ' is-live' : ''}${isFocus ? ' is-focus' : ''}`}>
      <div className="fx-card-accent" style={{ background: color }} />

      <div className="fx-card-header">
        <div className="fx-card-time">
          {isLive
            ? <span className="live-badge"><span className="live-dot" />LIVE</span>
            : `${m.conv.time} ${m.conv.abbr}`}
        </div>
        <div className="fx-card-badges">
          {m.group && <span className="badge badge-group" style={{ background: color }}>Grp {m.group}</span>}
          {m.md    && <span className="badge badge-md">MD{m.md}</span>}
          {m.md === 3 && m.group && <span className="badge badge-simul">SIM</span>}
          {!m.group && <span className="badge badge-round">{m.matchLabel}</span>}
        </div>
      </div>

      <div className="fx-card-body">
        <div
          className={`fx-card-team home${!homeT ? ' tbd' : ''}${isFocus && m.home === focus ? ' focused' : ''}`}
          onClick={() => homeT && setTeamModal(m.home)}
        >
          <FlagImg code={m.home} size={22} />
          <span className="fx-card-team-name">{homeT ? homeT.name : (m.homeLabel || 'TBD')}</span>
        </div>

        <div className="fx-card-center">
          {hs !== undefined
            ? <span className="fx-card-score">{hs}–{as_}</span>
            : <span className="fx-card-vs">vs</span>}
        </div>

        <div
          className={`fx-card-team away${!awayT ? ' tbd' : ''}${isFocus && m.away === focus ? ' focused' : ''}`}
          onClick={() => awayT && setTeamModal(m.away)}
        >
          <span className="fx-card-team-name">{awayT ? awayT.name : (m.awayLabel || 'TBD')}</span>
          <FlagImg code={m.away} size={22} />
        </div>
      </div>

      {v && <div className="fx-card-footer">{v.city}</div>}
    </div>
  )
}
