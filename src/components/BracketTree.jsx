import React from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime } from '../utils'
import FlagImg from './FlagImg'

// ── Static bracket tree ───────────────────────────────────────────────────────
// Each node: { id: matchId, top: node|null, bot: node|null }
// Leaf nodes have no top/bot. Structure derived from the W-label chain in data.js.
const L_TREE = {
  id: 101,
  top: { id: 97,  top: { id: 89, top: { id: 73 }, bot: { id: 74 } }, bot: { id: 90, top: { id: 75 }, bot: { id: 76 } } },
  bot: { id: 98,  top: { id: 91, top: { id: 77 }, bot: { id: 78 } }, bot: { id: 92, top: { id: 79 }, bot: { id: 80 } } },
}
const R_TREE = {
  id: 102,
  top: { id: 99,  top: { id: 93, top: { id: 81 }, bot: { id: 82 } }, bot: { id: 94, top: { id: 83 }, bot: { id: 84 } } },
  bot: { id: 100, top: { id: 95, top: { id: 85 }, bot: { id: 86 } }, bot: { id: 96, top: { id: 87 }, bot: { id: 88 } } },
}

const M = Object.fromEntries(MATCHES.map(m => [m.id, m]))

// ── Team slot ─────────────────────────────────────────────────────────────────
function TeamSlot({ code, label, score, isWinner, onTeamClick }) {
  const t = TEAMS[code]
  return (
    <div
      className={`bts-team${isWinner ? ' bts-team--win' : ''}${!t ? ' bts-team--tbd' : ''}`}
      onClick={() => t && onTeamClick && onTeamClick(code)}
      style={{ cursor: t ? 'pointer' : 'default' }}
    >
      <span className="bts-flag">{t ? <FlagImg code={code} size={16} /> : null}</span>
      <span className="bts-code">{code || (label?.length <= 6 ? label : 'TBD')}</span>
      {score != null && <span className="bts-score">{score}</span>}
    </div>
  )
}

// ── Single match card ─────────────────────────────────────────────────────────
function MatchCard({ matchId, liveMap, resolvedTeams, tz, timeFormat, onTeamClick, variant }) {
  const m = M[matchId]
  if (!m) return null

  const live = liveMap?.get(matchId)
  const r    = resolvedTeams?.get(matchId)

  const homeCode = m.home ?? r?.home ?? null
  const awayCode = m.away ?? r?.away ?? null

  const isLive     = live?.status === 'live'
  const isFinished = live?.status === 'finished'

  let hs = live?.homeScore ?? m.homeScore
  let as_ = live?.awayScore ?? m.awayScore
  if (live?.scoreByCode && homeCode && awayCode) {
    hs  = live.scoreByCode[homeCode] ?? hs
    as_ = live.scoreByCode[awayCode] ?? as_
  }

  const showScore  = isLive || isFinished
  const homeWin    = showScore && hs != null && as_ != null && hs > as_
  const awayWin    = showScore && hs != null && as_ != null && as_ > hs

  const conv  = convertTime(m.date, m.time, tz, timeFormat)
  const venue = VENUES[m.venue]

  return (
    <div className={`bts-card bts-card--${variant || 'r32'}${isLive ? ' bts-card--live' : ''}${isFinished ? ' bts-card--done' : ''}`}>
      <div className="bts-meta">
        {isLive
          ? <span className="bts-live-badge"><span className="live-dot" style={{ marginRight: 3 }} />LIVE {live.displayClock || ''}</span>
          : isFinished
            ? <span className="bts-ft">FT</span>
            : <span className="bts-date">{venue?.city ? `${venue.city} · ` : ''}{conv.dateShort}</span>
        }
      </div>
      <TeamSlot code={homeCode} label={m.homeLabel} score={showScore ? hs : undefined} isWinner={homeWin} onTeamClick={onTeamClick} />
      <TeamSlot code={awayCode} label={m.awayLabel} score={showScore ? as_ : undefined} isWinner={awayWin} onTeamClick={onTeamClick} />
    </div>
  )
}

// ── Recursive tree node ───────────────────────────────────────────────────────
// dir='left':  children on the LEFT, connector lines, match card on RIGHT
// dir='right': match card on LEFT, connector lines, children on RIGHT
function TreeNode({ node, dir, depth, liveMap, resolvedTeams, tz, timeFormat, onTeamClick }) {
  const isLeaf = !node.top && !node.bot
  const variant = ['r32', 'r16', 'qf', 'sf'][depth] || 'sf'
  const childProps = { dir, depth: depth - 1, liveMap, resolvedTeams, tz, timeFormat, onTeamClick }
  const cardProps  = { liveMap, resolvedTeams, tz, timeFormat, onTeamClick, variant }

  if (isLeaf) {
    return <MatchCard matchId={node.id} {...cardProps} />
  }

  const card = <MatchCard matchId={node.id} {...cardProps} />
  const pair = (
    <div className="bts-pair">
      <div className="bts-pair-top"><TreeNode node={node.top} {...childProps} /></div>
      <div className="bts-pair-bot"><TreeNode node={node.bot} {...childProps} /></div>
    </div>
  )
  const conn = (
    <div className={`bts-conn bts-conn--${dir}`}>
      <div className="bts-conn-top" />
      <div className="bts-conn-bot" />
    </div>
  )

  return (
    <div className={`bts-node bts-node--${dir}`}>
      {dir === 'left'  && pair}
      {dir === 'left'  && conn}
      {card}
      {dir === 'right' && conn}
      {dir === 'right' && pair}
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function BracketTree({ liveMap, resolvedTeams, tz, timeFormat, onTeamClick }) {
  const commonProps = { liveMap, resolvedTeams, tz, timeFormat, onTeamClick }

  return (
    <div className="bts-root">
      {/* Main bracket */}
      <div className="bts-layout">
        <div className="bts-half bts-half--left">
          <TreeNode node={L_TREE} dir="left" depth={3} {...commonProps} />
        </div>

        {/* Simple horizontal lines SF-1 ─── Final ─── SF-2  */}
        <div className="bts-hline" />
        <MatchCard matchId={104} variant="final" {...commonProps} />
        <div className="bts-hline" />

        <div className="bts-half bts-half--right">
          <TreeNode node={R_TREE} dir="right" depth={3} {...commonProps} />
        </div>
      </div>

      {/* 3rd place */}
      <div className="bts-third">
        <span className="bts-third-label">3rd Place Match</span>
        <MatchCard matchId={103} variant="r16" {...commonProps} />
      </div>
    </div>
  )
}
