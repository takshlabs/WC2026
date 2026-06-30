import React, { useState, useEffect } from 'react'
import { TEAMS, MATCHES } from '../data'
import { calcStandings, groupColor, convertTime } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'
import MatchFacts from '../components/MatchFacts'

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function Groups() {
  const { liveMap, setTeamModal, navigate, setFixtureFilter } = useApp()

  function goFixtures(g) {
    setFixtureFilter(f => ({ ...f, group: g, round: '', focus: null, team: '' }))
    navigate('fixtures')
  }

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <h1>Group Stage</h1>
        <p>12 groups · Top 2 per group + 8 best 3rd-place teams advance to Round of 32</p>
      </div>

      <div style={{ paddingTop: '1.5rem' }}>
        <div className="groups-grid">
          {ALL_GROUPS.map(g => (
            <GroupCard key={g} group={g} liveMap={liveMap} onTeamClick={setTeamModal} onFixturesClick={goFixtures} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Teams that appear in the Round of 32 bracket — the definitive qualified set
const R32_TEAMS = new Set(
  MATCHES
    .filter(m => m.round === 'r32' && m.home && m.away)
    .flatMap(m => [m.home, m.away])
)

function qualifyStatus(rows, totalMatches, played, liveMap = new Map(), group = '') {
  // Returns per-team status: 'safe' | 'alive' | 'eliminated'
  if (played === 0) return rows.map(() => 'alive')

  // All group matches played — use the R32 bracket as the definitive source of truth
  if (played === totalMatches) {
    return rows.map(r => R32_TEAMS.has(r.code) ? 'safe' : 'eliminated')
  }

  const groupLetter = group

  // A match counts as played if liveMap has a result OR data.js has a score
  const isPlayed = m => {
    const live = liveMap.get(m.id)
    return live?.status === 'finished' || live?.status === 'live' || m.homeScore !== undefined
  }

  return rows.map((r, i) => {
    // Max possible points = current pts + 3 per remaining match
    const teamRemaining = MATCHES.filter(
      m => m.group === groupLetter &&
           (m.home === r.code || m.away === r.code) &&
           !isPlayed(m)
    ).length
    const maxPts = r.Pts + teamRemaining * 3
    // Remaining matches for 3rd-placed team (to calculate their max points)
    const third = rows[2]
    const thirdRemaining = third
      ? MATCHES.filter(
          m => m.group === groupLetter &&
               (m.home === third.code || m.away === third.code) &&
               !isPlayed(m)
        ).length
      : 0
    const thirdMaxPts = (third?.Pts ?? 0) + thirdRemaining * 3
    if (i < 2 && r.Pts > thirdMaxPts) return 'safe'
    if (maxPts < (rows[1]?.Pts ?? 0)) return 'eliminated'
    return 'alive'
  })
}

function GroupCard({ group, liveMap, onTeamClick, onFixturesClick }) {
  const rows = calcStandings(group, liveMap)
  const color = groupColor(group)

  const gsMatches = MATCHES.filter(m => m.group === group)
  const played = gsMatches.filter(m => {
    const live = liveMap.get(m.id)
    return m.homeScore !== undefined || live?.homeScore !== undefined
  }).length

  const statuses = qualifyStatus(rows, gsMatches.length, played, liveMap, group)
  const hasLiveMatch = gsMatches.some(m => liveMap.get(m.id)?.status === 'live')

  return (
    <div className="group-section">
      <div className="group-header">
        <div className="group-letter">
          <span style={{ background: color, width: 4, height: 18, borderRadius: 2, display: 'inline-block' }} />
          Group {group}
          {hasLiveMatch && <span className="live-badge" style={{ fontSize: '0.5rem', marginLeft: 8 }}><span className="live-dot"/>LIVE</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {played > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>
              {played}/{gsMatches.length} played
            </span>
          )}
          <span className="group-fixtures-link" onClick={() => onFixturesClick(group)}>Fixtures →</span>
        </div>
      </div>

      <div className="standings-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 10 }}>Team</th>
              <th>P</th><th>W</th><th>D</th><th>L</th>
              <th>GF</th><th>GA</th><th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const t = TEAMS[r.code]
              const qClass = i < 2 ? 'qualify-top' : i === 2 ? 'qualify-3rd' : 'qualify-out'
              const status = statuses[i]
              return (
                <tr key={r.code} className={qClass}>
                  <td style={{ paddingLeft: 10, minWidth: 140 }} onClick={() => onTeamClick(r.code)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <FlagImg code={r.code} size={14} />{t.name}
                      {status === 'safe' && <span className="qualify-pill qualify-safe">✓ Safe</span>}
                      {status === 'eliminated' && <span className="qualify-pill qualify-elim">✕ Out</span>}
                    </span>
                  </td>
                  <td>{r.P}</td>
                  <td>{r.W}</td>
                  <td>{r.D}</td>
                  <td>{r.L}</td>
                  <td>{r.GF}</td>
                  <td>{r.GA}</td>
                  <td style={{ color: r.GD > 0 ? 'var(--green)' : r.GD < 0 ? 'var(--red)' : 'inherit' }}>
                    {r.GD > 0 ? `+${r.GD}` : r.GD}
                  </td>
                  <td className="pts">{r.Pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Group match list */}
      <GroupMatches group={group} liveMap={liveMap} onTeamClick={onTeamClick} />
    </div>
  )
}

function GroupMatches({ group, liveMap, onTeamClick }) {
  const { tz, timeFormat } = useApp()
  const matches = MATCHES.filter(m => m.group === group)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const recentCutoff = Date.now() - 36 * 60 * 60 * 1000
    const autoExpand = {}
    matches.forEach(m => {
      const live = liveMap.get(m.id)
      const isLive = live?.status === 'live'
      const isFinished = live?.status === 'finished'
      const matchTime = new Date(`${m.date}T${m.time}:00Z`).getTime()
      const isRecent = isFinished && matchTime > recentCutoff
      if (isLive || isRecent) autoExpand[m.id] = true
    })
    if (Object.keys(autoExpand).length > 0) {
      setExpanded(prev => ({ ...autoExpand, ...prev }))
    }
  }, [liveMap])

  function toggle(id) { setExpanded(prev => ({ ...prev, [id]: !prev[id] })) }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {[1,2,3].map(md => {
        const mdMatches = matches.filter(m => m.md === md)
        return (
          <div key={md} style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: '5px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', background: 'rgba(255,255,255,0.015)' }}>
              Matchday {md}{md === 3 ? ' · Simultaneous' : ''}
            </div>
            {mdMatches.map(m => {
              const live = liveMap.get(m.id)
              const hs  = live?.homeScore ?? m.homeScore
              const as_ = live?.awayScore ?? m.awayScore
              const isLive = live?.status === 'live'
              const isFinished = live?.status === 'finished'
              const homeT = TEAMS[m.home]
              const awayT = TEAMS[m.away]
              const conv  = convertTime(m.date, m.time, tz, timeFormat)
              const canExpand = isLive || isFinished
              const isExpanded = !!expanded[m.id]

              return (
                <div key={m.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: canExpand ? 'pointer' : 'default' }}
                  onClick={() => canExpand && toggle(m.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', fontSize: '0.78rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-3)', minWidth: 54 }}>
                      {isLive
                        ? <span className="live-badge" style={{ fontSize: '0.55rem' }}><span className="live-dot"/>LIVE</span>
                        : isFinished
                          ? <span style={{ color: 'var(--text-3)' }}>FT</span>
                          : conv.time}
                    </span>
                    <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      onClick={e => { e.stopPropagation(); onTeamClick(m.home) }}>
                      <FlagImg code={m.home} size={14} />{homeT?.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: hs !== undefined ? 'var(--gold)' : 'var(--text-3)', minWidth: 36, textAlign: 'center' }}>
                      {hs !== undefined ? `${hs}–${as_}` : 'vs'}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}
                      onClick={e => { e.stopPropagation(); onTeamClick(m.away) }}>
                      {awayT?.name}<FlagImg code={m.away} size={14} />
                    </span>
                    {canExpand && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-3)', marginLeft: 4 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  {isExpanded && canExpand && (
                    <div style={{ padding: '2px 14px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <MatchFacts live={live ?? { status: isLive ? 'live' : 'finished', goals: [], bookings: [] }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
