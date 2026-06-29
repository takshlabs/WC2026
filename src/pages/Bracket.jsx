import React, { useState, useCallback } from 'react'
import { TEAMS, VENUES } from '../data'
import { convertTime, groupColor } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'
import { useBracketTeams } from '../hooks/useBracketTeams'
import BracketTree from '../components/BracketTree'

const ROUNDS_ORDER = [
  { key: 'r32',   label: 'Round of 32',   ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { key: 'r16',   label: 'Round of 16',   ids: [89,90,91,92,93,94,95,96] },
  { key: 'qf',    label: 'Quarter-Finals',ids: [97,98,99,100] },
  { key: 'sf',    label: 'Semi-Finals',   ids: [101,102] },
  { key: 'final', label: 'Final',         ids: [104] },
]

const ALL_TEAM_CODES = Object.keys(TEAMS)

function loadPredictions() {
  try { return JSON.parse(localStorage.getItem('wc2026-predictions') || '{}') } catch { return {} }
}
function savePredictions(p) {
  try { localStorage.setItem('wc2026-predictions', JSON.stringify(p)) } catch {}
}

export default function Bracket() {
  const { tz, timeFormat, matches, setTeamModal, liveMap } = useApp()
  const resolvedTeams = useBracketTeams(liveMap)
  const [tab, setTab] = useState('live')
  const [predictions, setPredictions] = useState(loadPredictions)
  const [editSlot, setEditSlot] = useState(null) // { matchId, side: 'home'|'away' }
  const [searchQ, setSearchQ] = useState('')

  const matchById = Object.fromEntries(matches.map(m => [m.id, m]))

  function setPick(matchId, side, code) {
    const next = { ...predictions, [matchId]: { ...(predictions[matchId] || {}), [side]: code } }
    setPredictions(next)
    savePredictions(next)
    setEditSlot(null)
    setSearchQ('')
  }

  function clearAll() {
    setPredictions({})
    savePredictions({})
  }


  const filledCount = Object.values(predictions).reduce(
    (n, p) => n + (p.home ? 1 : 0) + (p.away ? 1 : 0), 0
  )
  const totalSlots = ROUNDS_ORDER.reduce((n, r) => n + r.ids.length * 2, 0) + 2 // +2 for 3rd place both sides

  return (
    <div className="container-wide" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Knockout Stage</h1>
            <p>Round of 32 → Round of 16 → Quarter-Finals → Semi-Finals → Final</p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['live', 'predict'].map(t => (
              <button
                key={t}
                className={`bracket-tab${tab === t ? ' active' : ''}${t === 'predict' ? ' predict-tab-hint' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'live' ? '📡 Live' : '🔮 Predict'}
              </button>
            ))}
            <button className="bracket-tab bracket-print-btn" onClick={() => window.print()}>🖨 Print</button>
          </div>
        </div>
      </div>

      {tab === 'predict' && (
        <div className="predictor-bar">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-2)' }}>
            Your bracket prediction · {filledCount} / {totalSlots} slots filled
          </span>
          <button className="btn btn-ghost" style={{ height: 28, fontSize: '0.65rem', padding: '0 12px' }} onClick={clearAll}>
            Reset
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}>
            Auto-saved to browser
          </span>
        </div>
      )}

      {tab === 'live' ? (
        <BracketTree
          liveMap={liveMap}
          resolvedTeams={resolvedTeams}
          tz={tz}
          timeFormat={timeFormat}
          onTeamClick={setTeamModal}
        />
      ) : (
        <>
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
                      <PredictMatch
                        key={id}
                        m={m}
                        isFinal={round.key === 'final'}
                        predictions={predictions}
                        editSlot={editSlot}
                        setEditSlot={setEditSlot}
                        searchQ={searchQ}
                        setSearchQ={setSearchQ}
                        setPick={setPick}
                        isR32={round.key === 'r32'}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <div className="section-title">3rd Place Match</div>
            <div style={{ maxWidth: 240 }}>
              <PredictMatch m={matchById[103]} isFinal={false} predictions={predictions} editSlot={editSlot} setEditSlot={setEditSlot} searchQ={searchQ} setSearchQ={setSearchQ} setPick={setPick} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BracketMatch({ m, tz, timeFormat, liveMap, resolvedTeams, isFinal, onTeamClick }) {
  if (!m) return null
  const conv  = convertTime(m.date, m.time, tz, timeFormat)
  const live  = liveMap.get(m.id)

  // Use static team codes when available (group stage), otherwise use computed
  // bracket progression from useBracketTeams (knockout rounds).
  const r = resolvedTeams?.get(m.id)
  const homeCode = m.home ?? r?.home ?? null
  const awayCode = m.away ?? r?.away ?? null
  const homeT = TEAMS[homeCode]
  const awayT = TEAMS[awayCode]

  const isLive     = live?.status === 'live'
  const isFinished = live?.status === 'finished'

  // Use scoreByCode for KO matches (orientation-safe); fall back to positional.
  let hs, as_
  if (live?.scoreByCode && homeCode && awayCode) {
    hs  = live.scoreByCode[homeCode] ?? live?.homeScore ?? m.homeScore
    as_ = live.scoreByCode[awayCode] ?? live?.awayScore ?? m.awayScore
  } else {
    hs  = live?.homeScore ?? m.homeScore
    as_ = live?.awayScore ?? m.awayScore
  }

  return (
    <div className={`bracket-match${isFinal ? ' final-match' : ''}`}>
      <div className="bm-meta">
        <span>{m.matchLabel}</span>
        <span style={{ color: isLive ? 'var(--green)' : isFinished ? 'var(--text-3)' : 'inherit' }}>
          {isLive
            ? <><span className="live-dot" style={{ marginRight: 3 }}/>LIVE</>
            : isFinished ? 'FT' : conv.dateShort}
        </span>
      </div>
      <div className={`bm-team${!homeT ? ' tbd' : ''}`} onClick={() => homeT && onTeamClick(homeCode)}>
        <span className="bm-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {homeT ? <><FlagImg code={homeCode} size={16} />{homeT.name}</> : (m.homeLabel || 'TBD')}
        </span>
        {hs !== undefined && (
          <span className="bm-score" style={{ color: hs > as_ ? 'var(--green)' : hs < as_ ? 'var(--red)' : 'var(--gold)' }}>{hs}</span>
        )}
      </div>
      <div className={`bm-team${!awayT ? ' tbd' : ''}`} onClick={() => awayT && onTeamClick(awayCode)}>
        <span className="bm-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {awayT ? <><FlagImg code={awayCode} size={16} />{awayT.name}</> : (m.awayLabel || 'TBD')}
        </span>
        {as_ !== undefined && (
          <span className="bm-score" style={{ color: as_ > hs ? 'var(--green)' : as_ < hs ? 'var(--red)' : 'var(--gold)' }}>{as_}</span>
        )}
      </div>
    </div>
  )
}

function PredictMatch({ m, isFinal, predictions, editSlot, setEditSlot, searchQ, setSearchQ, setPick, isR32 }) {
  if (!m) return null
  const pred = predictions[m.id] || {}
  const homeCode = m.home || pred.home
  const awayCode = m.away || pred.away
  const homeT = homeCode ? TEAMS[homeCode] : null
  const awayT = awayCode ? TEAMS[awayCode] : null
  const editingHome = editSlot?.matchId === m.id && editSlot.side === 'home'
  const editingAway = editSlot?.matchId === m.id && editSlot.side === 'away'

  function getSlotTeams(label) {
    if (!isR32 && !searchQ.trim()) return []
    let pool = ALL_TEAM_CODES
    if (isR32 && label) {
      const groups = label.match(/[A-L]/g) || []
      if (groups.length > 0) {
        pool = ALL_TEAM_CODES.filter(c => groups.includes(TEAMS[c]?.group))
      }
    }
    return pool.filter(c => TEAMS[c]?.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, isR32 ? 24 : 8)
  }

  function SlotPicker({ side, code, teamObj, isEditing }) {
    const label = side === 'home' ? (m.homeLabel || 'Pick team') : (m.awayLabel || 'Pick team')
    const slotTeams = getSlotTeams(side === 'home' ? m.homeLabel : m.awayLabel)
    return (
      <div className={`bm-team predict-slot${!code ? ' tbd' : ''}${isEditing ? ' editing' : ''}`}
        onClick={() => !code && setEditSlot({ matchId: m.id, side })}>
        {isEditing ? (
          <div className="predict-search" onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              className="predict-input"
              placeholder="Search team…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <div className="predict-dropdown">
              {slotTeams.map(c => (
                <div key={c} className="predict-option" onClick={() => setPick(m.id, side, c)}>
                  <FlagImg code={c} size={14} />{TEAMS[c]?.name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="bm-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {teamObj
              ? <><FlagImg code={code} size={16} />{teamObj.name}</>
              : code
                ? <span style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => setEditSlot({ matchId: m.id, side })}>
                    <FlagImg code={code} size={16} />{TEAMS[code]?.name}
                  </span>
                : <span className="predict-empty" onClick={() => setEditSlot({ matchId: m.id, side })}>{label}</span>
            }
          </span>
        )}
        {code && !isEditing && (
          <button className="predict-clear" onClick={e => { e.stopPropagation(); setPick(m.id, side, undefined) }}>✕</button>
        )}
      </div>
    )
  }

  return (
    <div className={`bracket-match${isFinal ? ' final-match' : ''} predict-match`}>
      <div className="bm-meta">
        <span>{m.matchLabel}</span>
        <span style={{ color: 'var(--text-3)', fontSize: '0.55rem' }}>{m.date?.slice(5)}</span>
      </div>
      <SlotPicker side="home" code={homeCode} teamObj={homeT} isEditing={editingHome} />
      <SlotPicker side="away" code={awayCode} teamObj={awayT} isEditing={editingAway} />
    </div>
  )
}
