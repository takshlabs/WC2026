import React from 'react'
import { TEAMS, MATCHES } from '../data'
import { calcStandings, groupColor, convertTime } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'

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

function qualifyStatus(rows, totalMatches, played, liveMap = new Map()) {
  // Returns per-team status: 'safe' | 'alive' | 'eliminated'
  if (played === 0) return rows.map(() => 'alive')
  const groupLetter = rows[0]?.group

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

  const statuses = qualifyStatus(rows, gsMatches.length, played, liveMap)

  return (
    <div className="group-section">
      <div className="group-header">
        <div className="group-letter">
          <span style={{ background: color, width: 4, height: 18, borderRadius: 2, display: 'inline-block' }} />
          Group {group}
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
              const homeT = TEAMS[m.home]
              const awayT = TEAMS[m.away]
              const conv  = convertTime(m.date, m.time, tz, timeFormat)

              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-3)', minWidth: 54 }}>
                    {isLive ? <span className="live-badge" style={{ fontSize: '0.55rem' }}><span className="live-dot"/>LIVE</span> : `${conv.time}`}
                  </span>
                  <span style={{ cursor: 'pointer', flex: 1, display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => onTeamClick(m.home)}>
                    <FlagImg code={m.home} size={14} />{homeT?.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: hs !== undefined ? 'var(--gold)' : 'var(--text-3)', minWidth: 36, textAlign: 'center' }}>
                    {hs !== undefined ? `${hs}–${as_}` : 'vs'}
                  </span>
                  <span style={{ cursor: 'pointer', flex: 1, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }} onClick={() => onTeamClick(m.away)}>
                    {awayT?.name}<FlagImg code={m.away} size={14} />
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
