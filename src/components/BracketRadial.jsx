import React, { useState } from 'react'
import { MATCHES, TEAMS } from '../data'

// ── Layout constants ──────────────────────────────────────────────────────────
const SIZE = 760
const CX = SIZE / 2       // 380
const CY = SIZE / 2       // 380
const START = -Math.PI / 2  // 12 o'clock = top of circle

// Rings: [innerRadius, outerRadius] — R32 outermost, Final innermost
const RINGS = {
  r32: [284, 368],  // 84px thick
  r16: [222, 282],  // 60px thick
  qf:  [164, 220],  // 56px thick
  sf:  [108, 162],  // 54px thick
  fin: [55,  106],  // 51px thick
}
const CENTER_R = 52

// ── Team slot definitions ─────────────────────────────────────────────────────
// Clockwise from top; each adjacent pair in R32 = one R32 match.
// Inner rings are the home/away participants of each subsequent-round match.
// resolvedTeams hook fills in winner codes for all inner slots.
const R32_SLOTS = [
  [73,'home'],[73,'away'], [74,'home'],[74,'away'],
  [75,'home'],[75,'away'], [76,'home'],[76,'away'],
  [77,'home'],[77,'away'], [78,'home'],[78,'away'],
  [79,'home'],[79,'away'], [80,'home'],[80,'away'],
  [81,'home'],[81,'away'], [82,'home'],[82,'away'],
  [83,'home'],[83,'away'], [84,'home'],[84,'away'],
  [85,'home'],[85,'away'], [86,'home'],[86,'away'],
  [87,'home'],[87,'away'], [88,'home'],[88,'away'],
]
const R16_SLOTS = [
  [89,'home'],[89,'away'], [90,'home'],[90,'away'],
  [91,'home'],[91,'away'], [92,'home'],[92,'away'],
  [93,'home'],[93,'away'], [94,'home'],[94,'away'],
  [95,'home'],[95,'away'], [96,'home'],[96,'away'],
]
const QF_SLOTS = [
  [97,'home'],[97,'away'], [98,'home'],[98,'away'],
  [99,'home'],[99,'away'], [100,'home'],[100,'away'],
]
const SF_SLOTS = [
  [101,'home'],[101,'away'], [102,'home'],[102,'away'],
]
const FIN_SLOTS = [
  [104,'home'],[104,'away'],
]

const M = Object.fromEntries(MATCHES.map(m => [m.id, m]))

// ── SVG helpers ───────────────────────────────────────────────────────────────

// Build an SVG donut-arc path with a small angular gap on each side.
function arcPath(ri, ro, sa, ea) {
  const g   = 0.013      // angular gap (radians) — visual separation between arcs
  const ri2 = ri + 1.5   // radial inset
  const ro2 = ro - 1.5
  const s = sa + g, e = ea - g
  const c = Math.cos, s_ = Math.sin
  const large = (e - s) > Math.PI ? 1 : 0
  return [
    `M${CX + ro2*c(s)},${CY + ro2*s_(s)}`,
    `A${ro2},${ro2},0,${large},1,${CX + ro2*c(e)},${CY + ro2*s_(e)}`,
    `L${CX + ri2*c(e)},${CY + ri2*s_(e)}`,
    `A${ri2},${ri2},0,${large},0,${CX + ri2*c(s)},${CY + ri2*s_(s)}`,
    'Z',
  ].join(' ')
}

// Center point of an arc at ring midpoint radius.
function arcMid(ri, ro, sa, ea) {
  const mid = (sa + ea) / 2
  const r   = (ri + ro) / 2
  return { x: CX + r * Math.cos(mid), y: CY + r * Math.sin(mid), mid }
}

// Rotation for tangential text (readable from outside the circle).
function textRot(mid) {
  const deg = mid * (180 / Math.PI) + 90
  // Flip arcs in the left/bottom half so text faces outward
  return Math.cos(mid) < 0 ? deg + 180 : deg
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BracketRadial({ liveMap, resolvedTeams, onTeamClick }) {
  const [hoverId, setHoverId] = useState(null)  // code of hovered team

  // Get team code for a slot (static or resolved)
  function slotCode(matchId, side) {
    const m = M[matchId]
    if (!m) return null
    return m[side] ?? resolvedTeams?.get(matchId)?.[side] ?? null
  }

  // A team advanced if it appears in the corresponding slot of the next inner ring.
  // slot i in ring N → parent slot floor(i/2) in ring N-1.
  function isAdvanced(code, slotIdx, parentSlots) {
    if (!code || !parentSlots) return false
    const p = parentSlots[Math.floor(slotIdx / 2)]
    return !!p && code === (resolvedTeams?.get(p[0])?.[p[1]] ?? null)
  }

  // Determine tournament champion (if Final is finished)
  function champion() {
    const live = liveMap?.get(104)
    if (live?.status !== 'finished') return null
    const fin = resolvedTeams?.get(104)
    if (!fin) return null
    const hs  = live.scoreByCode?.[fin.home] ?? live.homeScore ?? 0
    const as_ = live.scoreByCode?.[fin.away] ?? live.awayScore ?? 0
    if (hs > as_) return fin.home
    if (as_ > hs) return fin.away
    if (live.winner === 'HOME_TEAM') return fin.home
    if (live.winner === 'AWAY_TEAM') return fin.away
    return null
  }

  const champ = champion()

  // ── Arc slot renderer ────────────────────────────────────────────────────────
  function Slot({ slotIdx, nTotal, ringKey, matchId, side, parentSlots, fontSize }) {
    const [ri, ro] = RINGS[ringKey]
    const angle    = (2 * Math.PI) / nTotal
    const sa = START + slotIdx * angle
    const ea = sa + angle

    const code = slotCode(matchId, side)
    const t    = code ? TEAMS[code] : null
    const live = liveMap?.get(matchId)
    const won  = isAdvanced(code, slotIdx, parentSlots)
    const isFinalSlot = ringKey === 'fin'
    const isLv = live?.status === 'live'
    const isHovered = hoverId === code && !!code

    // Fill / stroke based on state
    let fill   = code ? 'var(--surface)' : 'var(--surface-2)'
    let stroke = 'var(--border)'
    let tFill  = 'var(--text-3)'
    if (code)        { tFill  = 'var(--text-2)' }
    if (won)         { fill = 'rgba(212,168,67,0.2)'; stroke = 'rgba(212,168,67,0.6)'; tFill = 'var(--gold)' }
    if (isFinalSlot && code) { fill = 'rgba(212,168,67,0.15)'; stroke = 'rgba(212,168,67,0.5)'; tFill = 'var(--gold)' }
    if (isLv)        { fill = 'rgba(34,197,94,0.12)'; stroke = 'rgba(34,197,94,0.5)'; tFill = 'var(--green)' }
    if (isHovered)   { fill = fill.replace('0.2','0.35').replace('0.15','0.28').replace('var(--surface)','var(--surface-2)') }

    // Arc label: only if arc is wide enough
    const arcLen = ((ri + ro) / 2) * (2 * Math.PI / nTotal)
    const { x, y, mid } = arcMid(ri, ro, sa, ea)
    const rot = textRot(mid)

    return (
      <g
        onClick={() => t && onTeamClick?.(code)}
        onMouseEnter={() => setHoverId(code)}
        onMouseLeave={() => setHoverId(null)}
        style={{ cursor: t ? 'pointer' : 'default' }}
      >
        <path d={arcPath(ri, ro, sa, ea)} fill={fill} stroke={stroke} strokeWidth={0.7} />
        {arcLen > 16 && code && (
          <text
            x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fontSize}
            fontFamily="monospace" fontWeight="700"
            fill={tFill} letterSpacing="0.05em"
            transform={`rotate(${rot},${x},${y})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {code}
          </text>
        )}
      </g>
    )
  }

  // ── Match-boundary dividers in the R32 ring ──────────────────────────────────
  // A thin radial line between each pair of team slots = between matches.
  const matchDividers = Array.from({ length: 16 }, (_, i) => {
    const angle = START + i * 2 * (2 * Math.PI / 32)
    const [ri, ro] = RINGS.r32
    const c = Math.cos, s = Math.sin
    return (
      <line key={i}
        x1={CX + (ri + 2) * c(angle)} y1={CY + (ri + 2) * s(angle)}
        x2={CX + (ro - 2) * c(angle)} y2={CY + (ro - 2) * s(angle)}
        stroke="var(--border-2)" strokeWidth={1} opacity={0.5}
      />
    )
  })

  // ── Ring separator circles ───────────────────────────────────────────────────
  const ringCircles = Object.values(RINGS).map(([ri], i) => (
    <circle key={i} cx={CX} cy={CY} r={ri} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.35} />
  ))

  // ── Round labels (placed just inside outer ring boundary, at top) ─────────────
  const roundLabels = [
    { key: 'r32', label: 'R32' },
    { key: 'r16', label: 'R16' },
    { key: 'qf',  label: 'QF'  },
    { key: 'sf',  label: 'SF'  },
    { key: 'fin', label: 'F'   },
  ].map(({ key, label }) => {
    const [ri, ro] = RINGS[key]
    const r = (ri + ro) / 2
    // Place just before 12 o'clock
    const a = START - 0.10
    return (
      <text key={key}
        x={CX + r * Math.cos(a)} y={CY + r * Math.sin(a)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={5.5} fontFamily="monospace" fontWeight={700}
        fill="var(--text-3)" opacity={0.7}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    )
  })

  // ── Center circle ─────────────────────────────────────────────────────────────
  const centerCircle = (
    <g>
      <circle cx={CX} cy={CY} r={CENTER_R}
        fill={champ ? 'rgba(212,168,67,0.2)' : 'var(--surface)'}
        stroke={champ ? 'var(--gold)' : 'var(--border-2)'}
        strokeWidth={champ ? 2 : 1}
      />
      {champ ? (
        <>
          <text x={CX} y={CY - 8} textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontFamily="monospace" fontWeight={700} fill="var(--gold)"
            style={{ userSelect: 'none' }}>{champ}</text>
          <text x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={5.5} fontFamily="monospace" fill="var(--gold)" opacity={0.7}
            style={{ userSelect: 'none' }}>CHAMPION</text>
        </>
      ) : (
        <>
          <text x={CX} y={CY - 7} textAnchor="middle" dominantBaseline="middle"
            fontSize={6.5} fontFamily="monospace" fontWeight={700} fill="var(--text-3)"
            style={{ userSelect: 'none' }}>WORLD CUP</text>
          <text x={CX} y={CY + 7} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fontFamily="monospace" fontWeight={700} fill="var(--gold)"
            style={{ userSelect: 'none' }}>2026</text>
        </>
      )}
    </g>
  )

  // ── Hover tooltip ─────────────────────────────────────────────────────────────
  // Show full team name near where mouse is — computed from hovered code.
  const tooltip = hoverId && TEAMS[hoverId] ? (
    <g>
      <rect x={CX - 36} y={CY - CENTER_R - 24} width={72} height={16} rx={4}
        fill="var(--surface)" stroke="var(--border-2)" strokeWidth={1} />
      <text x={CX} y={CY - CENTER_R - 16} textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fontFamily="monospace" fontWeight={700} fill="var(--text)"
        style={{ pointerEvents: 'none' }}>
        {TEAMS[hoverId].name}
      </text>
    </g>
  ) : null

  return (
    <div style={{ overflowX: 'auto', textAlign: 'center', paddingBottom: '0.5rem' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE} height={SIZE}
        style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
      >
        {/* Outer background disc */}
        <circle cx={CX} cy={CY} r={372} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />

        {/* Ring separators */}
        {ringCircles}

        {/* Match boundary dividers */}
        {matchDividers}

        {/* R32 ring — 32 team slots */}
        {R32_SLOTS.map(([mid, side], i) => (
          <Slot key={`r32-${i}`} slotIdx={i} nTotal={32} ringKey="r32"
            matchId={mid} side={side} parentSlots={R16_SLOTS} fontSize={6.5} />
        ))}

        {/* R16 ring — 16 slots */}
        {R16_SLOTS.map(([mid, side], i) => (
          <Slot key={`r16-${i}`} slotIdx={i} nTotal={16} ringKey="r16"
            matchId={mid} side={side} parentSlots={QF_SLOTS} fontSize={7.5} />
        ))}

        {/* QF ring — 8 slots */}
        {QF_SLOTS.map(([mid, side], i) => (
          <Slot key={`qf-${i}`} slotIdx={i} nTotal={8} ringKey="qf"
            matchId={mid} side={side} parentSlots={SF_SLOTS} fontSize={9} />
        ))}

        {/* SF ring — 4 slots */}
        {SF_SLOTS.map(([mid, side], i) => (
          <Slot key={`sf-${i}`} slotIdx={i} nTotal={4} ringKey="sf"
            matchId={mid} side={side} parentSlots={FIN_SLOTS} fontSize={11} />
        ))}

        {/* Final ring — 2 slots (the two finalists) */}
        {FIN_SLOTS.map(([mid, side], i) => (
          <Slot key={`fin-${i}`} slotIdx={i} nTotal={2} ringKey="fin"
            matchId={mid} side={side} parentSlots={null} fontSize={13} />
        ))}

        {/* Round labels */}
        {roundLabels}

        {/* Center: World Cup 2026 / Champion */}
        {centerCircle}

        {/* Tooltip */}
        {tooltip}
      </svg>
    </div>
  )
}
