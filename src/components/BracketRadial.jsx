import React, { useState } from 'react'
import { MATCHES, TEAMS } from '../data'

// ── Layout constants ──────────────────────────────────────────────────────────
const SIZE = 900
const CX = SIZE / 2       // 450
const CY = SIZE / 2       // 450
const START = -Math.PI / 2  // 12 o'clock = top of circle

// Rings: [innerRadius, outerRadius] — R32 outermost, Final innermost
const RINGS = {
  r32: [336, 434],  // 98px thick — outermost
  r16: [264, 334],  // 70px thick
  qf:  [196, 262],  // 66px thick
  sf:  [130, 194],  // 64px thick
  fin: [65,  128],  // 63px thick
}
const CENTER_R = 62

// Font sizes [TLA, flag] per ring
const FONTS = {
  r32: { tla: 9,   flag: 20 },
  r16: { tla: 11,  flag: 22 },
  qf:  { tla: 13,  flag: 26 },
  sf:  { tla: 15,  flag: 30 },
  fin: { tla: 17,  flag: 34 },
}

// ── Team slot definitions ─────────────────────────────────────────────────────
// Ordered to match the FIFA bracket cross-pairings.
// Left half: {73,76}→89  {75,78}→90  {84,83}→93  {82,81}→94
// Right half: {74,77}→91  {79,80}→92  {87,86}→95  {85,88}→96
const R32_SLOTS = [
  [73,'home'],[73,'away'], [76,'home'],[76,'away'],
  [75,'home'],[75,'away'], [78,'home'],[78,'away'],
  [84,'home'],[84,'away'], [83,'home'],[83,'away'],
  [82,'home'],[82,'away'], [81,'home'],[81,'away'],
  [74,'home'],[74,'away'], [77,'home'],[77,'away'],
  [79,'home'],[79,'away'], [80,'home'],[80,'away'],
  [87,'home'],[87,'away'], [86,'home'],[86,'away'],
  [85,'home'],[85,'away'], [88,'home'],[88,'away'],
]
const R16_SLOTS = [
  [89,'home'],[89,'away'], [90,'home'],[90,'away'],
  [93,'home'],[93,'away'], [94,'home'],[94,'away'],
  [91,'home'],[91,'away'], [92,'home'],[92,'away'],
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

function arcPath(ri, ro, sa, ea) {
  const g   = 0.011
  const ri2 = ri + 1.5
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

function arcMidPt(ri, ro, sa, ea) {
  const mid = (sa + ea) / 2
  const r   = (ri + ro) / 2
  return { x: CX + r * Math.cos(mid), y: CY + r * Math.sin(mid), mid }
}

// Rotation for tangential text, always readable from OUTSIDE the circle.
//
// Base formula: deg = mid*(180/π) + 90  makes text flow clockwise (top→right→bottom).
// This is comfortable to read on the upper/right arcs but the "bottom semicircle"
// (3 o'clock → 9 o'clock via 6 o'clock, where sin(mid) > 0) ends up with rotation
// in [90°, 270°] — awkward or upside-down. Adding 180° there swings it back into
// the comfortable zone (≤ ±90° from horizontal). The condition sin(mid) > 0 is
// precise: it covers exactly the arcs where the base angle is in [90°, 270°].
function textRot(mid) {
  const deg = mid * (180 / Math.PI) + 90
  return Math.sin(mid) > 0 ? deg + 180 : deg
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BracketRadial({ liveMap, resolvedTeams, onTeamClick }) {
  const [hoverId, setHoverId] = useState(null)

  function slotCode(matchId, side) {
    const m = M[matchId]
    if (!m) return null
    return m[side] ?? resolvedTeams?.get(matchId)?.[side] ?? null
  }

  function isAdvanced(code, slotIdx, parentSlots) {
    if (!code || !parentSlots) return false
    const p = parentSlots[Math.floor(slotIdx / 2)]
    return !!p && code === (resolvedTeams?.get(p[0])?.[p[1]] ?? null)
  }

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
  function Slot({ slotIdx, nTotal, ringKey, matchId, side, parentSlots }) {
    const [ri, ro] = RINGS[ringKey]
    const { tla: tlaSize, flag: flagSize } = FONTS[ringKey]
    const sliceAngle = (2 * Math.PI) / nTotal
    const sa = START + slotIdx * sliceAngle
    const ea = sa + sliceAngle

    const code = slotCode(matchId, side)
    const t    = code ? TEAMS[code] : null
    const live = liveMap?.get(matchId)
    const won  = isAdvanced(code, slotIdx, parentSlots)
    const isFin = ringKey === 'fin'
    const isLv  = live?.status === 'live'

    let fill   = code ? 'var(--surface)' : 'var(--surface-2)'
    let stroke = 'var(--border)'
    let tFill  = 'var(--text-3)'
    if (code)         { tFill  = 'var(--text-2)' }
    if (won)          { fill = 'rgba(212,168,67,0.2)'; stroke = 'rgba(212,168,67,0.6)'; tFill = 'var(--gold)' }
    if (isFin && code){ fill = 'rgba(212,168,67,0.15)'; stroke = 'rgba(212,168,67,0.5)'; tFill = 'var(--gold)' }
    if (isLv)         { fill = 'rgba(34,197,94,0.12)'; stroke = 'rgba(34,197,94,0.5)'; tFill = 'var(--green)' }
    if (hoverId === code && code) {
      fill = fill.replace('0.2)', '0.35)').replace('0.15)', '0.28)').replace('var(--surface)', 'var(--surface-2)')
    }

    // Radial positions: flag in outer 70% of ring, TLA near inner edge
    const { mid } = arcMidPt(ri, ro, sa, ea)
    const thick = ro - ri
    const rMid  = (ri + ro) / 2  // midpoint radius for arc length calc
    const rFlag = ri + thick * 0.70   // flag sits at 70% from inner edge
    const rTLA  = ri + thick * 0.22   // TLA sits near inner edge
    const xFlag = CX + rFlag * Math.cos(mid)
    const yFlag = CY + rFlag * Math.sin(mid)
    const xTLA  = CX + rTLA  * Math.cos(mid)
    const yTLA  = CY + rTLA  * Math.sin(mid)
    const rot   = textRot(mid)

    // Only label if the arc is wide enough to fit text
    const arcLen = rMid * sliceAngle
    const show   = arcLen > 20

    return (
      <g
        onClick={() => t && onTeamClick?.(code)}
        onMouseEnter={() => setHoverId(code)}
        onMouseLeave={() => setHoverId(null)}
        style={{ cursor: t ? 'pointer' : 'default' }}
      >
        <path d={arcPath(ri, ro, sa, ea)} fill={fill} stroke={stroke} strokeWidth={0.8} />
        {show && code && (
          <>
            {t?.flag && (
              <text
                x={xFlag} y={yFlag}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={flagSize}
                transform={`rotate(${rot},${xFlag},${yFlag})`}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {t.flag}
              </text>
            )}
            <text
              x={xTLA} y={yTLA}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={tlaSize}
              fontFamily="monospace" fontWeight="700"
              fill={tFill} letterSpacing="0.06em"
              transform={`rotate(${rot},${xTLA},${yTLA})`}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {code}
            </text>
          </>
        )}
      </g>
    )
  }

  // ── Match-boundary dividers: full-radius bold radial lines ───────────────────
  const matchDividers = Array.from({ length: 16 }, (_, i) => {
    const angle = START + i * (2 * Math.PI / 16)
    const ro = RINGS.r32[1] - 2
    const ri = CENTER_R + 3
    const c = Math.cos, s = Math.sin
    return (
      <line key={i}
        x1={CX + ro * c(angle)} y1={CY + ro * s(angle)}
        x2={CX + ri * c(angle)} y2={CY + ri * s(angle)}
        stroke="var(--border-2)" strokeWidth={2} opacity={0.75}
        strokeLinecap="round"
      />
    )
  })

  // ── Ring separator circles ───────────────────────────────────────────────────
  const ringCircles = Object.values(RINGS).map(([ri], i) => (
    <circle key={i} cx={CX} cy={CY} r={ri} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.35} />
  ))

  // ── Round labels ─────────────────────────────────────────────────────────────
  const roundLabels = [
    { key: 'r32', label: 'R32' },
    { key: 'r16', label: 'R16' },
    { key: 'qf',  label: 'QF'  },
    { key: 'sf',  label: 'SF'  },
    { key: 'fin', label: 'F'   },
  ].map(({ key, label }) => {
    const [ri, ro] = RINGS[key]
    const r = (ri + ro) / 2
    const a = START - 0.10
    return (
      <text key={key}
        x={CX + r * Math.cos(a)} y={CY + r * Math.sin(a)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={6.5} fontFamily="monospace" fontWeight={700}
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
          <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={13} fontFamily="monospace" fontWeight={700} fill="var(--gold)"
            style={{ userSelect: 'none' }}>{champ}</text>
          <text x={CX} y={CY + 10} textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fontFamily="monospace" fill="var(--gold)" opacity={0.7}
            style={{ userSelect: 'none' }}>CHAMPION</text>
        </>
      ) : (
        <>
          <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontFamily="monospace" fontWeight={700} fill="var(--text-3)"
            style={{ userSelect: 'none' }}>WORLD CUP</text>
          <text x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontFamily="monospace" fontWeight={700} fill="var(--gold)"
            style={{ userSelect: 'none' }}>2026</text>
        </>
      )}
    </g>
  )

  // ── Hover tooltip ─────────────────────────────────────────────────────────────
  const tooltip = hoverId && TEAMS[hoverId] ? (
    <g>
      <rect x={CX - 38} y={CY - CENTER_R - 26} width={76} height={18} rx={4}
        fill="var(--surface)" stroke="var(--border-2)" strokeWidth={1} />
      <text x={CX} y={CY - CENTER_R - 17} textAnchor="middle" dominantBaseline="middle"
        fontSize={8} fontFamily="monospace" fontWeight={700} fill="var(--text)"
        style={{ pointerEvents: 'none' }}>
        {TEAMS[hoverId].name}
      </text>
    </g>
  ) : null

  const commonProps = { liveMap, resolvedTeams }

  return (
    <div style={{ overflowX: 'auto', textAlign: 'center', paddingBottom: '0.5rem' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE} height={SIZE}
        style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
      >
        <circle cx={CX} cy={CY} r={437} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
        {ringCircles}
        {matchDividers}

        {R32_SLOTS.map(([mid, side], i) => (
          <Slot key={`r32-${i}`} slotIdx={i} nTotal={32} ringKey="r32"
            matchId={mid} side={side} parentSlots={R16_SLOTS} />
        ))}
        {R16_SLOTS.map(([mid, side], i) => (
          <Slot key={`r16-${i}`} slotIdx={i} nTotal={16} ringKey="r16"
            matchId={mid} side={side} parentSlots={QF_SLOTS} />
        ))}
        {QF_SLOTS.map(([mid, side], i) => (
          <Slot key={`qf-${i}`} slotIdx={i} nTotal={8} ringKey="qf"
            matchId={mid} side={side} parentSlots={SF_SLOTS} />
        ))}
        {SF_SLOTS.map(([mid, side], i) => (
          <Slot key={`sf-${i}`} slotIdx={i} nTotal={4} ringKey="sf"
            matchId={mid} side={side} parentSlots={FIN_SLOTS} />
        ))}
        {FIN_SLOTS.map(([mid, side], i) => (
          <Slot key={`fin-${i}`} slotIdx={i} nTotal={2} ringKey="fin"
            matchId={mid} side={side} parentSlots={null} />
        ))}

        {roundLabels}
        {centerCircle}
        {tooltip}
      </svg>
    </div>
  )
}
