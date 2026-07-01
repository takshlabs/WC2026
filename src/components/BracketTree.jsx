import React from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime } from '../utils'
import FlagImg from './FlagImg'

// ── Layout constants (px) ─────────────────────────────────────────────────────
// Sized to fit a 1440px MacBook without horizontal scroll (~1380px usable width).
const COL_W   = 134   // card width — must match CSS .bts-card width
const COL_GAP = 20    // gap between adjacent columns (connector space)
const STEP    = COL_W + COL_GAP   // 154 px per column step

const ROW_H   = 96    // vertical slot height per R32 match
const N       = 8     // R32 matches per side
const H       = N * ROW_H          // 768 canvas height

// Column left-edge x positions.
// CENTER_SECTION = space taken by the Final card + its flanking gaps.
// Right-half columns must add CENTER_SECTION (not just CENTER_GAP*2) so that
// the right half mirrors the left half exactly.
const CENTER_GAP = 20  // gap between SF cards and the Final card (each side)
// Derived: FINAL left edge = right edge of SF_L + CENTER_GAP (perfectly symmetric)
const FINAL_X = STEP * 3 + COL_W + CENTER_GAP   // 616
const SF_R_X  = FINAL_X + COL_W + CENTER_GAP    // 770
const X = {
  R32_L: 0,
  R16_L: STEP,         // 154
  QF_L:  STEP * 2,     // 308
  SF_L:  STEP * 3,     // 462
  FINAL: FINAL_X,      // 616
  SF_R:  SF_R_X,       // 770
  QF_R:  SF_R_X + STEP,        // 924
  R16_R: SF_R_X + STEP * 2,    // 1078
  R32_R: SF_R_X + STEP * 3,    // 1232
}
const TOTAL_W = X.R32_R + COL_W   // 1366 px — fits MacBook 1440px

// ── Y-center positions (derived from the binary tree) ────────────────────────
const yCtr    = i => i * ROW_H + ROW_H / 2
const R32_Y   = Array.from({ length: N }, (_, i) => yCtr(i))
// [52, 156, 260, 364, 468, 572, 676, 780]

const R16_Y   = [
  (R32_Y[0] + R32_Y[1]) / 2,   // 104
  (R32_Y[2] + R32_Y[3]) / 2,   // 312
  (R32_Y[4] + R32_Y[5]) / 2,   // 520
  (R32_Y[6] + R32_Y[7]) / 2,   // 728
]
const QF_Y    = [
  (R16_Y[0] + R16_Y[1]) / 2,   // 208
  (R16_Y[2] + R16_Y[3]) / 2,   // 624
]
const SF_Y    = (QF_Y[0] + QF_Y[1]) / 2   // 416
const FINAL_Y = SF_Y

// ── Card positions: [matchId, x (left edge), y (center), variant] ────────────
const POSITIONS = [
  // Left R32 — ordered to match the FIFA bracket cross-pairings:
  //   {73,76}→R16-89  {75,78}→R16-90  {84,83}→R16-93  {82,81}→R16-94
  [73, X.R32_L, R32_Y[0], 'r32'], [76, X.R32_L, R32_Y[1], 'r32'],
  [75, X.R32_L, R32_Y[2], 'r32'], [78, X.R32_L, R32_Y[3], 'r32'],
  [84, X.R32_L, R32_Y[4], 'r32'], [83, X.R32_L, R32_Y[5], 'r32'],
  [82, X.R32_L, R32_Y[6], 'r32'], [81, X.R32_L, R32_Y[7], 'r32'],
  // Left R16
  [89, X.R16_L, R16_Y[0], 'r16'], [90, X.R16_L, R16_Y[1], 'r16'],
  [93, X.R16_L, R16_Y[2], 'r16'], [94, X.R16_L, R16_Y[3], 'r16'],
  // Left QF
  [97, X.QF_L, QF_Y[0], 'qf'],   [98, X.QF_L, QF_Y[1], 'qf'],
  // Left SF
  [101, X.SF_L, SF_Y, 'sf'],
  // Final
  [104, X.FINAL, FINAL_Y, 'final'],
  // Right SF
  [102, X.SF_R, SF_Y, 'sf'],
  // Right QF
  [99,  X.QF_R, QF_Y[0], 'qf'],  [100, X.QF_R, QF_Y[1], 'qf'],
  // Right R16
  [91,  X.R16_R, R16_Y[0], 'r16'], [92,  X.R16_R, R16_Y[1], 'r16'],
  [95,  X.R16_R, R16_Y[2], 'r16'], [96,  X.R16_R, R16_Y[3], 'r16'],
  // Right R32 — {74,77}→R16-91  {79,80}→R16-92  {87,86}→R16-95  {85,88}→R16-96
  [74,  X.R32_R, R32_Y[0], 'r32'], [77,  X.R32_R, R32_Y[1], 'r32'],
  [79,  X.R32_R, R32_Y[2], 'r32'], [80,  X.R32_R, R32_Y[3], 'r32'],
  [87,  X.R32_R, R32_Y[4], 'r32'], [86,  X.R32_R, R32_Y[5], 'r32'],
  [85,  X.R32_R, R32_Y[6], 'r32'], [88,  X.R32_R, R32_Y[7], 'r32'],
]

// ── Connector definitions ─────────────────────────────────────────────────────
// Left connectors: children are to the LEFT, parent to the RIGHT.
// cx = right edge of children column, px = left edge of parent column.
const L_CONN = [
  // R32 pairs → R16 (left)
  { cx: X.R32_L + COL_W, yA: R32_Y[0], yB: R32_Y[1], px: X.R16_L },
  { cx: X.R32_L + COL_W, yA: R32_Y[2], yB: R32_Y[3], px: X.R16_L },
  { cx: X.R32_L + COL_W, yA: R32_Y[4], yB: R32_Y[5], px: X.R16_L },
  { cx: X.R32_L + COL_W, yA: R32_Y[6], yB: R32_Y[7], px: X.R16_L },
  // R16 pairs → QF (left)
  { cx: X.R16_L + COL_W, yA: R16_Y[0], yB: R16_Y[1], px: X.QF_L },
  { cx: X.R16_L + COL_W, yA: R16_Y[2], yB: R16_Y[3], px: X.QF_L },
  // QF pair → SF (left)
  { cx: X.QF_L  + COL_W, yA: QF_Y[0],  yB: QF_Y[1],  px: X.SF_L },
]

// Right connectors: children are to the RIGHT, parent to the LEFT.
// cx = left edge of children column, px = right edge of parent column.
const R_CONN = [
  // R32 pairs → R16 (right)
  { cx: X.R32_R, yA: R32_Y[0], yB: R32_Y[1], px: X.R16_R + COL_W },
  { cx: X.R32_R, yA: R32_Y[2], yB: R32_Y[3], px: X.R16_R + COL_W },
  { cx: X.R32_R, yA: R32_Y[4], yB: R32_Y[5], px: X.R16_R + COL_W },
  { cx: X.R32_R, yA: R32_Y[6], yB: R32_Y[7], px: X.R16_R + COL_W },
  // R16 pairs → QF (right)
  { cx: X.R16_R, yA: R16_Y[0], yB: R16_Y[1], px: X.QF_R + COL_W },
  { cx: X.R16_R, yA: R16_Y[2], yB: R16_Y[3], px: X.QF_R + COL_W },
  // QF pair → SF (right)
  { cx: X.QF_R,  yA: QF_Y[0],  yB: QF_Y[1],  px: X.SF_R + COL_W },
]

// ── SVG connector renderer ────────────────────────────────────────────────────
// Each bracket connection draws 4 lines:
//   top arm  : child_A right/left edge → spine x
//   bot arm  : child_B right/left edge → spine x
//   spine    : vertical from yA to yB at mid_x
//   out arm  : mid_x at y_mid → parent left/right edge
function BracketConnectors({ conns, side }) {
  const clr = 'var(--border-2)'
  const sw = 1.5

  return conns.map(({ cx, yA, yB, px }, i) => {
    const mid = side === 'left'
      ? cx + COL_GAP / 2      // spine is in the middle of the gap (right of children)
      : cx - COL_GAP / 2      // spine is in the middle of the gap (left of children)
    const yMid = (yA + yB) / 2

    return (
      <g key={i} stroke={clr} strokeWidth={sw} fill="none" strokeLinecap="round">
        <line x1={cx}   y1={yA}   x2={mid}  y2={yA}   />  {/* top arm */}
        <line x1={cx}   y1={yB}   x2={mid}  y2={yB}   />  {/* bot arm */}
        <line x1={mid}  y1={yA}   x2={mid}  y2={yB}   />  {/* spine  */}
        <line x1={mid}  y1={yMid} x2={px}   y2={yMid} />  {/* output */}
      </g>
    )
  })
}

// ── Match card ────────────────────────────────────────────────────────────────
const M = Object.fromEntries(MATCHES.map(m => [m.id, m]))

function TeamSlot({ code, label, score, isWinner, onTeamClick }) {
  const t = TEAMS[code]
  return (
    <div
      className={`bts-team${isWinner ? ' bts-team--win' : ''}${!t ? ' bts-team--tbd' : ''}`}
      onClick={() => t && onTeamClick?.(code)}
    >
      <span className="bts-flag">{t ? <FlagImg code={code} size={16} /> : null}</span>
      <span className="bts-code">{code || (label && label.length <= 8 ? label : 'TBD')}</span>
      {score != null && <span className="bts-score">{score}</span>}
    </div>
  )
}

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

  const showScore = isLive || isFinished
  let homeWin   = showScore && hs != null && as_ != null && hs > as_
  let awayWin   = showScore && hs != null && as_ != null && as_ > hs
  if (showScore && !homeWin && !awayWin && isFinished && live?.winnerCode) {
    if (live.winnerCode === homeCode) homeWin = true
    if (live.winnerCode === awayCode) awayWin = true
  }

  let penH = null, penA = null
  if (live?.penaltiesByCode && homeCode && awayCode) {
    penH = live.penaltiesByCode[homeCode]
    penA = live.penaltiesByCode[awayCode]
  } else if (live?.penalties) {
    penH = live.penalties.home
    penA = live.penalties.away
  }
  const hasPens = penH != null && penA != null

  const ftLabel = live?.duration === 'PENALTY_SHOOTOUT' ? 'pens'
                : live?.duration === 'EXTRA_TIME' ? 'AET' : 'FT'

  const conv  = convertTime(m.date, m.time, tz, timeFormat)
  const venue = VENUES[m.venue]

  return (
    <div className={`bts-card bts-card--${variant || 'r32'}${isLive ? ' bts-card--live' : ''}${isFinished ? ' bts-card--done' : ''}`}>
      <div className="bts-meta">
        {isLive
          ? <span className="bts-live-badge"><span className="live-dot" style={{ marginRight: 3 }} />LIVE {live.displayClock || ''}</span>
          : isFinished
            ? <span className="bts-ft">{ftLabel}</span>
            : <span className="bts-date">{venue?.city ? `${venue.city} · ` : ''}{conv.dateShort}</span>
        }
      </div>
      <TeamSlot code={homeCode} label={m.homeLabel} score={showScore ? hs : undefined} isWinner={homeWin} onTeamClick={onTeamClick} />
      <TeamSlot code={awayCode} label={m.awayLabel} score={showScore ? as_ : undefined} isWinner={awayWin} onTeamClick={onTeamClick} />
      {hasPens && isFinished && (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-3)', padding: '1px 0', letterSpacing: '0.03em' }}>
          pen {penH}–{penA}
        </div>
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function BracketTree({ liveMap, resolvedTeams, tz, timeFormat, onTeamClick }) {
  const cardProps = { liveMap, resolvedTeams, tz, timeFormat, onTeamClick }

  return (
    <div className="bts-root">
      <div className="bts-scroll">
        <div className="bts-canvas" style={{ width: TOTAL_W, height: H }}>

          {/* ── SVG connector lines ─────────────────────────────────────── */}
          <svg className="bts-svg" width={TOTAL_W} height={H}>
            <BracketConnectors conns={L_CONN} side="left" />
            <BracketConnectors conns={R_CONN} side="right" />
            {/* SF-1 → Final (simple horizontal) */}
            <line
              x1={X.SF_L + COL_W} y1={SF_Y}
              x2={X.FINAL}         y2={SF_Y}
              stroke="var(--border-2)" strokeWidth={1.5} strokeLinecap="round"
            />
            {/* SF-2 → Final */}
            <line
              x1={X.FINAL + COL_W} y1={SF_Y}
              x2={X.SF_R}           y2={SF_Y}
              stroke="var(--border-2)" strokeWidth={1.5} strokeLinecap="round"
            />
          </svg>

          {/* ── Match cards (absolutely positioned at their y-centers) ──── */}
          {POSITIONS.map(([matchId, x, yCenter, variant]) => (
            <div
              key={matchId}
              className="bts-card-wrap"
              style={{
                position: 'absolute',
                left: x,
                top: yCenter,
                transform: 'translateY(-50%)',
                width: COL_W,
              }}
            >
              <MatchCard matchId={matchId} variant={variant} {...cardProps} />
            </div>
          ))}

        </div>
      </div>

      {/* 3rd place match */}
      <div className="bts-third">
        <span className="bts-third-label">3rd Place Match</span>
        <div style={{ width: COL_W }}>
          <MatchCard matchId={103} variant="r16" {...cardProps} />
        </div>
      </div>
    </div>
  )
}
