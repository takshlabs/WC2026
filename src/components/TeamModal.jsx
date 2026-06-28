import React from 'react'
import ReactDOM from 'react-dom'
import { TEAMS, VENUES } from '../data'
import { convertTime, groupColor, roundLabel } from '../utils'
import { useApp } from '../App'

export default function TeamModal({ code, onClose }) {
  const { tz, timeFormat, matches, liveMap, navigate, setFixtureFilter } = useApp()
  const t = TEAMS[code]
  if (!t) return null

  const teamMatches = matches.filter(m => m.home === code || m.away === code)

  function focusTeam() {
    setFixtureFilter(f => ({ ...f, focus: code, team: '', group: '', round: '' }))
    navigate('fixtures')
    onClose()
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-header">
          <div className="modal-flag">{t.flag}</div>
          <div>
            <div className="modal-team-name" id="team-modal-title">{t.name}</div>
            <div className="modal-badges">
              <span className="badge badge-group" style={{ background: groupColor(t.group) }}>
                Group {t.group}
              </span>
              <span className="badge badge-md">{t.conf}</span>
            </div>
          </div>
        </div>

        <div className="modal-stats-row">
          <div className="modal-stat">
            <span className="modal-stat-val">#{t.ranking}</span>
            <span className="modal-stat-lbl">FIFA Rank</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-val">{t.wcWins}</span>
            <span className="modal-stat-lbl">WC Titles</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-val">{t.wcApps}</span>
            <span className="modal-stat-lbl">Appearances</span>
          </div>
        </div>

        <div className="modal-matches-title">All Fixtures</div>
        {teamMatches.map(m => {
          const isHome = m.home === code
          const opp    = isHome ? m.away : m.home
          const oppT   = opp ? TEAMS[opp] : null
          const conv   = convertTime(m.date, m.time, tz, timeFormat)
          const live   = liveMap.get(m.id)
          const hs     = live?.homeScore ?? m.homeScore
          const as_    = live?.awayScore ?? m.awayScore
          const score  = hs !== undefined
            ? (isHome ? `${hs}–${as_}` : `${as_}–${hs}`)
            : '–'

          return (
            <div className="modal-match-row" key={m.id}>
              <span className="mm-date">{conv.dateShort} {conv.time}</span>
              <span className="mm-ha">{isHome ? 'vs' : 'at'}</span>
              <span className="mm-opp">
                {oppT ? `${oppT.flag} ${oppT.name}` : m.homeLabel || m.awayLabel || 'TBD'}
              </span>
              <span className="mm-score">{score}</span>
              {m.group
                ? <span className="badge badge-group" style={{ background: groupColor(m.group), fontSize:'0.55rem' }}>Grp {m.group}</span>
                : <span className="badge badge-round">{roundLabel(m.round)}</span>
              }
            </div>
          )
        })}

        <div className="modal-footer">
          <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={focusTeam}>
            Highlight All Fixtures →
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
