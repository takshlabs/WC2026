import React from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'

const ROUNDS_ORDER = [
  { key: 'r32',   label: 'Round of 32',   ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { key: 'r16',   label: 'Round of 16',   ids: [89,90,91,92,93,94,95,96] },
  { key: 'qf',    label: 'Quarter-Finals',ids: [97,98,99,100] },
  { key: 'sf',    label: 'Semi-Finals',   ids: [101,102] },
  { key: 'final', label: 'Final',         ids: [104] },
]

export default function Bracket() {
  const { tz, setTeamModal, liveMap } = useApp()
  const matchById = Object.fromEntries(MATCHES.map(m => [m.id, m]))

  return (
    <div className="container-wide" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <h1>Knockout Stage</h1>
        <p>Round of 32 → Round of 16 → Quarter-Finals → Semi-Finals → Final</p>
      </div>

      <div className="bracket-wrap">
        <div
          className="bracket-grid"
          style={{ gridTemplateColumns: `repeat(${ROUNDS_ORDER.length}, minmax(200px, 1fr))` }}
        >
          {ROUNDS_ORDER.map(round => (
            <div className="bracket-col" key={round.key}>
              <div className="bracket-col-label">{round.label}</div>
              {round.ids.map(id => {
                const m = matchById[id]
                if (!m) return null
                return (
                  <BracketMatch
                    key={id}
                    m={m}
                    tz={tz}
                    liveMap={liveMap}
                    isFinal={round.key === 'final'}
                    onTeamClick={setTeamModal}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Third place separately */}
      <div style={{ marginTop: '2rem' }}>
        <div className="section-title">3rd Place Match</div>
        <div style={{ maxWidth: 240 }}>
          <BracketMatch
            m={matchById[103]}
            tz={tz}
            liveMap={liveMap}
            isFinal={false}
            onTeamClick={setTeamModal}
          />
        </div>
      </div>
    </div>
  )
}

function BracketMatch({ m, tz, liveMap, isFinal, onTeamClick }) {
  if (!m) return null
  const conv  = convertTime(m.date, m.time, tz)
  const live  = liveMap.get(m.id)
  const homeT = TEAMS[m.home]
  const awayT = TEAMS[m.away]
  const v     = VENUES[m.venue]
  const isLive = live?.status === 'live'
  const hs    = live?.homeScore ?? m.homeScore
  const as_   = live?.awayScore ?? m.awayScore

  return (
    <div className={`bracket-match${isFinal ? ' final-match' : ''}`}>
      <div className="bm-meta">
        <span>{m.matchLabel}</span>
        <span style={{ color: isLive ? 'var(--green)' : 'inherit' }}>
          {isLive ? 'LIVE' : conv.dateShort}
        </span>
      </div>

      {/* Home */}
      <div
        className={`bm-team${!homeT ? ' tbd' : ''}`}
        onClick={() => homeT && onTeamClick(m.home)}
      >
        <span className="bm-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {homeT ? <><FlagImg code={m.home} size={16} />{homeT.name}</> : (m.homeLabel || 'TBD')}
        </span>
        {hs !== undefined && (
          <span className="bm-score" style={{ color: hs > as_ ? 'var(--green)' : hs < as_ ? 'var(--red)' : 'var(--gold)' }}>
            {hs}
          </span>
        )}
      </div>

      {/* Away */}
      <div
        className={`bm-team${!awayT ? ' tbd' : ''}`}
        onClick={() => awayT && onTeamClick(m.away)}
      >
        <span className="bm-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {awayT ? <><FlagImg code={m.away} size={16} />{awayT.name}</> : (m.awayLabel || 'TBD')}
        </span>
        {as_ !== undefined && (
          <span className="bm-score" style={{ color: as_ > hs ? 'var(--green)' : as_ < hs ? 'var(--red)' : 'var(--gold)' }}>
            {as_}
          </span>
        )}
      </div>
    </div>
  )
}
