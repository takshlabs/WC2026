import React, { useState } from 'react'
import { MATCHES, TEAMS, VENUES } from '../data'
import { convertTime, groupColor } from '../utils'
import { useApp } from '../App'
import FlagImg from '../components/FlagImg'

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const KO_ROUNDS = [
  { label: 'Round of 32',    ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { label: 'Round of 16',    ids: [89,90,91,92,93,94,95,96] },
  { label: 'Quarter-Finals', ids: [97,98,99,100] },
  { label: 'Semi-Finals',    ids: [101,102] },
  { label: '3rd Place',      ids: [103] },
  { label: 'Final',          ids: [104] },
]

const SECTION_META = {
  all:      { title: 'Complete Wall Chart',   subtitle: 'Groups · Schedule · Knockout' },
  groups:   { title: 'Group Stage Standings', subtitle: 'Fill in results as matches play' },
  schedule: { title: 'Match Schedule',        subtitle: 'Group stage - all 72 matches' },
  bracket:  { title: 'Knockout Stage',        subtitle: 'Round of 32 through Final' },
}

export default function Print() {
  const { tz, timeFormat, liveMap } = useApp()
  const [section, setSection] = useState('all')

  const showGroups   = section === 'all' || section === 'groups'
  const showSchedule = section === 'all' || section === 'schedule'
  const showBracket  = section === 'all' || section === 'bracket'
  const showCover    = section === 'all'
  const meta         = SECTION_META[section]

  function handlePrint() {
    document.body.dataset.printSection = section
    window.print()
  }

  return (
    <div>
      {/* ── Screen-only controls ───────────────────────────────────────── */}
      <div className="print-controls no-print">
        <div className="container">
          <div className="print-controls-inner">
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                Print / Wall Chart
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                Pick a section → hit Print. Optimised for A4 / US Letter.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {[['all','All sections'],['groups','Groups'],['schedule','Schedule'],['bracket','Knockout']].map(([v, l]) => (
                <button
                  key={v}
                  className={`btn${section === v ? ' btn-gold' : ' btn-ghost'}`}
                  style={{ height: 30, fontSize: '0.73rem', padding: '0 12px' }}
                  onClick={() => setSection(v)}
                >
                  {l}
                </button>
              ))}
              <button
                className="btn btn-gold"
                style={{ height: 30, fontSize: '0.73rem', padding: '0 14px' }}
                onClick={handlePrint}
              >
                🖨 Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Printable document ─────────────────────────────────────────── */}
      <div className={`print-doc print-doc--${section}`}>

        {showCover ? (
          <div className="print-cover">
            <div className="print-cover-title">FIFA World Cup 2026™</div>
            <div className="print-cover-sub">USA · Canada · Mexico &nbsp;|&nbsp; 11 June – 19 July 2026</div>
            <div className="print-cover-meta">48 teams &nbsp;·&nbsp; 104 matches &nbsp;·&nbsp; 16 venues &nbsp;·&nbsp; 3 host countries</div>
            <div className="print-cover-brand">Made by Taksh✦Labs</div>
          </div>
        ) : (
          <div className="print-sheet-header">
            <div className="print-sheet-kicker">FIFA World Cup 2026™</div>
            <div className="print-sheet-title">{meta.title}</div>
            <div className="print-sheet-meta">
              {meta.subtitle}
              {(section === 'schedule' || section === 'bracket') && ` · ${timeFormat === '12' ? '12-hour' : '24-hour'} · ${tz.abbr}`}
              {' · '}11 June – 19 July 2026
            </div>
            <div className="print-sheet-brand">Taksh✦Labs</div>
          </div>
        )}

        {/* ── Group Standings ──────────────────────────────────────────── */}
        {showGroups && (
          <div className="print-section print-section--groups">
            {showCover && <div className="print-section-title">Group Stage - Standings</div>}
            <div className="print-groups-grid">
              {ALL_GROUPS.map(g => (
                <PrintGroup key={g} group={g} />
              ))}
            </div>
          </div>
        )}

        {/* ── Match Schedule ───────────────────────────────────────────── */}
        {showSchedule && (
          <div className="print-section print-section--schedule">
            {showCover && <div className="print-section-title">Match Schedule ({tz.abbr})</div>}
            <PrintSchedule tz={tz} timeFormat={timeFormat} liveMap={liveMap} />
          </div>
        )}

        {/* ── Knockout Bracket ─────────────────────────────────────────── */}
        {showBracket && (
          <div className="print-section print-section--bracket">
            {showCover && <div className="print-section-title">Knockout Stage</div>}
            <PrintBracket tz={tz} timeFormat={timeFormat} liveMap={liveMap} />
          </div>
        )}

        <div className="print-footer no-print-footer">
          {meta.title} &nbsp;·&nbsp; Taksh✦Labs &nbsp;·&nbsp; Printed {new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
        </div>
      </div>
    </div>
  )
}

/* ── Group standings table - DIY fill-it-yourself for print ─────────────── */
function PrintGroup({ group }) {
  // Use initial seeding order (alphabetical by name within group), not live standings
  const teams = Object.entries(TEAMS)
    .filter(([, t]) => t.group === group)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
  const color = groupColor(group)
  return (
    <div className="print-group">
      <div className="print-group-hdr" style={{ borderTopColor: color }}>
        Group {group}
      </div>
      <table className="print-tbl">
        <thead>
          <tr>
            <th className="print-tbl-pos">#</th>
            <th className="print-tbl-team">Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(([code, t], i) => (
            <tr key={code} className={i < 2 ? 'print-q' : i === 2 ? 'print-q3' : ''}>
              <td className="print-tbl-pos">
                <span className={`print-pos-badge${i < 2 ? ' print-pos-adv' : i === 2 ? ' print-pos-3rd' : ''}`}>{i + 1}</span>
              </td>
              <td className="print-tbl-team">
                <PrintTeamLine code={code} name={t.name} side="list" />
              </td>
              {/* Blank fill-in boxes for all stat columns */}
              {['','','','','','','',''].map((_, ci) => (
                <td key={ci} className={ci === 7 ? 'print-pts' : ''}>
                  <span className="print-diy-box" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="print-group-adv">
        <span className="print-adv-dot print-adv-green" /> advance &nbsp;
        <span className="print-adv-dot print-adv-gold" /> best 3rd
      </div>
    </div>
  )
}

/* ── Match schedule ─────────────────────────────────────────────────────── */
function PrintSchedule({ tz, timeFormat, liveMap }) {
  const matches = MATCHES
    .filter(m => m.round === 'gs')
    .sort((a, b) => new Date(`${a.date}T${a.time}:00Z`) - new Date(`${b.date}T${b.time}:00Z`))

  const byDate = new Map()
  matches.forEach(m => {
    const conv = convertTime(m.date, m.time, tz, timeFormat)
    if (!byDate.has(conv.date)) byDate.set(conv.date, [])
    byDate.get(conv.date).push({ ...m, conv, live: liveMap.get(m.id) })
  })

  return (
    <table className="print-schedule-tbl">
      <thead>
        <tr>
          <th className="print-sch-time">Time</th>
          <th className="print-sch-home">Home</th>
          <th className="print-sch-score">Sc</th>
          <th className="print-sch-away">Away</th>
          <th className="print-sch-venue">Venue</th>
        </tr>
      </thead>
      <tbody>
        {[...byDate.entries()].map(([date, ms]) => (
          <React.Fragment key={date}>
            <tr className="print-sch-date-row">
              <td colSpan={5}>{date}</td>
            </tr>
            {ms.map(m => {
              const ht  = TEAMS[m.home]
              const at  = TEAMS[m.away]
              const hs  = m.live?.homeScore ?? m.homeScore
              const as_ = m.live?.awayScore ?? m.awayScore
              const v   = VENUES[m.venue]
              return (
                <tr key={m.id} className="print-sch-row">
                  <td className="print-sch-time">{m.conv.time}</td>
                  <td className="print-sch-home">
                    <PrintTeamLine code={m.home} name={ht?.name} side="home" />
                  </td>
                  <td className="print-sch-score">{hs !== undefined ? `${hs}–${as_}` : 'v'}</td>
                  <td className="print-sch-away">
                    <PrintTeamLine code={m.away} name={at?.name} side="away" />
                  </td>
                  <td className="print-sch-venue">{v?.city}</td>
                </tr>
              )
            })}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}

/* ── Knockout bracket ───────────────────────────────────────────────────── */
function PrintBracket({ tz, timeFormat, liveMap }) {
  const matchById = Object.fromEntries(MATCHES.map(m => [m.id, m]))

  return (
    <div className="print-bracket">
      {KO_ROUNDS.map(round => (
        <div key={round.label} className="print-ko-round">
          <div className="print-ko-label">{round.label}</div>
          <div className="print-ko-matches">
            {round.ids.map(id => {
              const m = matchById[id]
              if (!m) return null
              const conv = convertTime(m.date, m.time, tz, timeFormat)
              const ht   = TEAMS[m.home]
              const at   = TEAMS[m.away]
              const live = liveMap.get(id)
              const hs   = live?.homeScore ?? m.homeScore
              const as_  = live?.awayScore ?? m.awayScore
              return (
                <div key={id} className="print-ko-match">
                  <span className="print-ko-date">{conv.dateShort}</span>
                  <span className="print-ko-team print-ko-team--home">
                    <PrintTeamLine code={m.home} name={ht?.name || m.homeLabel} side="home" />
                    {hs !== undefined && <b className="print-ko-score">{hs}</b>}
                  </span>
                  <span className="print-ko-sep">–</span>
                  <span className="print-ko-team print-ko-team--away">
                    {as_ !== undefined && <b className="print-ko-score">{as_}</b>}
                    <PrintTeamLine code={m.away} name={at?.name || m.awayLabel} side="away" />
                  </span>
                  <span className="print-ko-venue">{VENUES[m.venue]?.city}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* Flag + name kept together - home aligns right, away aligns left */
function PrintTeamLine({ code, name, side }) {
  const label = name || 'TBD'
  const flagBefore = side === 'home' || side === 'list'
  const flagAfter  = side === 'away'
  return (
    <span className={`print-team-line print-team-line--${side}`}>
      {flagBefore && code && <FlagImg code={code} size={10} className="print-inline-flag" />}
      <span className="print-team-line-name">{label}</span>
      {flagAfter && code && <FlagImg code={code} size={10} className="print-inline-flag" />}
    </span>
  )
}
