import React, { useState, lazy, Suspense } from 'react'
import { TEAMS, WC_HISTORY, VENUES } from '../data'
import { groupColor, calcStandings } from '../utils'
import { useApp } from '../App'

// Lazy load ECharts - only bundle it if Stats tab is visited
const ReactECharts = lazy(() => import('echarts-for-react'))

const TABS = [
  { id: 'players',     label: 'Players'      },
  { id: 'rankings',    label: 'Team Rankings'},
  { id: 'history',     label: 'WC History'   },
  { id: 'groups',      label: 'Groups'       },
  { id: 'venues',      label: 'Venues'       },
  { id: 'continental', label: 'Continental'  },
]

// Notable players at WC 2026 — career WC stats + tournament tracker
const PLAYERS = [
  { name: 'Lionel Messi',      team: 'ARG', pos: 'FW', age: 38, wcApps: 26, wcGoals: 13, wcAssists: 8,  caps: 188, goals: 109 },
  { name: 'Kylian Mbappé',     team: 'FRA', pos: 'FW', age: 26, wcApps: 14, wcGoals: 12, wcAssists: 4,  caps: 84,  goals: 48  },
  { name: 'Cristiano Ronaldo', team: 'POR', pos: 'FW', age: 41, wcApps: 22, wcGoals: 8,  wcAssists: 2,  caps: 212, goals: 135 },
  { name: 'Erling Haaland',    team: 'NOR', pos: 'FW', age: 25, wcApps: 0,  wcGoals: 0,  wcAssists: 0,  caps: 42,  goals: 32  },
  { name: 'Vinicius Jr',       team: 'BRA', pos: 'FW', age: 24, wcApps: 4,  wcGoals: 0,  wcAssists: 1,  caps: 38,  goals: 6   },
  { name: 'Jude Bellingham',   team: 'ENG', pos: 'MF', age: 21, wcApps: 5,  wcGoals: 3,  wcAssists: 1,  caps: 37,  goals: 5   },
  { name: 'Harry Kane',        team: 'ENG', pos: 'FW', age: 31, wcApps: 8,  wcGoals: 6,  wcAssists: 1,  caps: 92,  goals: 68  },
  { name: 'Pedri',             team: 'ESP', pos: 'MF', age: 22, wcApps: 3,  wcGoals: 0,  wcAssists: 1,  caps: 29,  goals: 3   },
  { name: 'Lamine Yamal',      team: 'ESP', pos: 'FW', age: 18, wcApps: 4,  wcGoals: 1,  wcAssists: 3,  caps: 21,  goals: 5   },
  { name: 'Mohamed Salah',     team: 'EGY', pos: 'FW', age: 33, wcApps: 3,  wcGoals: 2,  wcAssists: 0,  caps: 97,  goals: 57  },
  { name: 'Son Heung-min',     team: 'KOR', pos: 'FW', age: 33, wcApps: 8,  wcGoals: 2,  wcAssists: 2,  caps: 130, goals: 40  },
  { name: 'Neymar Jr',         team: 'BRA', pos: 'FW', age: 33, wcApps: 13, wcGoals: 8,  wcAssists: 6,  caps: 128, goals: 79  },
  { name: 'Antoine Griezmann', team: 'FRA', pos: 'FW', age: 35, wcApps: 17, wcGoals: 7,  wcAssists: 5,  caps: 137, goals: 44  },
  { name: 'Rodri',             team: 'ESP', pos: 'MF', age: 29, wcApps: 3,  wcGoals: 0,  wcAssists: 0,  caps: 49,  goals: 5   },
  { name: 'Phil Foden',        team: 'ENG', pos: 'MF', age: 25, wcApps: 4,  wcGoals: 1,  wcAssists: 2,  caps: 38,  goals: 7   },
  { name: 'Bukayo Saka',       team: 'ENG', pos: 'FW', age: 23, wcApps: 4,  wcGoals: 1,  wcAssists: 1,  caps: 43,  goals: 15  },
  { name: 'Robert Lewandowski',team: 'POL', pos: 'FW', age: 37, wcApps: 8,  wcGoals: 5,  wcAssists: 2,  caps: 151, goals: 82  },
  { name: 'Achraf Hakimi',     team: 'MAR', pos: 'DF', age: 26, wcApps: 7,  wcGoals: 1,  wcAssists: 2,  caps: 88,  goals: 12  },
  { name: 'Lautaro Martínez',  team: 'ARG', pos: 'FW', age: 27, wcApps: 7,  wcGoals: 3,  wcAssists: 1,  caps: 62,  goals: 31  },
  { name: 'Virgil van Dijk',   team: 'NED', pos: 'DF', age: 34, wcApps: 3,  wcGoals: 0,  wcAssists: 0,  caps: 74,  goals: 7   },
  { name: 'Trent A-Arnold',    team: 'ENG', pos: 'MF', age: 26, wcApps: 3,  wcGoals: 0,  wcAssists: 1,  caps: 33,  goals: 4   },
  { name: 'Gavi',              team: 'ESP', pos: 'MF', age: 20, wcApps: 3,  wcGoals: 0,  wcAssists: 0,  caps: 38,  goals: 4   },
  { name: 'Romelu Lukaku',     team: 'BEL', pos: 'FW', age: 31, wcApps: 9,  wcGoals: 3,  wcAssists: 2,  caps: 121, goals: 78  },
  { name: 'Sofyan Amrabat',    team: 'MAR', pos: 'MF', age: 28, wcApps: 7,  wcGoals: 0,  wcAssists: 1,  caps: 60,  goals: 3   },
  { name: 'Florian Wirtz',     team: 'GER', pos: 'MF', age: 21, wcApps: 0,  wcGoals: 0,  wcAssists: 0,  caps: 22,  goals: 7   },
]

const ECHART_THEME = {
  textStyle: { color: '#8EADD0', fontFamily: "'DM Sans', sans-serif" },
  title: { textStyle: { color: '#E6EDF8', fontSize: 13 } },
}

/* Readable axis / legend labels on dark charts */
const CHART_AXIS = {
  name:  '#8EADD0',
  label: '#8EADD0',
  line:  '#1A3868',
  split: '#1A3868',
}
const CHART_TIP = {
  backgroundColor: '#051829',
  borderColor: '#1A3868',
  textStyle: { color: '#E6EDF8' },
}

export default function Stats() {
  const { liveMap } = useApp()
  const [tab, setTab] = useState('rankings')

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <h1>Stats Dashboard</h1>
      </div>

      <div style={{ paddingTop: '1.5rem' }}>
        <div className="stats-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`stats-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Loading charts…</div>}>
          {tab === 'players'     && <PlayersTab />}
          {tab === 'rankings'    && <RankingsTab />}
          {tab === 'history'     && <HistoryTab />}
          {tab === 'groups'      && <GroupsTab liveMap={liveMap} />}
          {tab === 'venues'      && <VenuesTab />}
          {tab === 'continental' && <ContinentalTab />}
        </Suspense>
      </div>
    </div>
  )
}

// ── Players ───────────────────────────────────────────────────────────────────
function PlayersTab() {
  const [sort, setSort] = React.useState('wcGoals')
  const [posFilter, setPosFilter] = React.useState('all')

  const filtered = PLAYERS
    .filter(p => posFilter === 'all' || p.pos === posFilter)
    .sort((a, b) => b[sort] - a[sort])

  const topWcGoalOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#051829', borderColor: '#1A3868', textStyle: { color: '#E6EDF8' } },
    grid: { top: 20, bottom: 80, left: 140, right: 60 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#1A3868' } }, splitLine: { lineStyle: { color: '#1A3868' } }, axisLabel: { color: CHART_AXIS.label, fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: [...PLAYERS].sort((a,b) => b.wcGoals - a.wcGoals).slice(0, 10).map(p => p.name),
      axisLabel: { color: '#7A9CC0', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1A3868' } },
    },
    series: [{
      type: 'bar',
      data: [...PLAYERS].sort((a,b) => b.wcGoals - a.wcGoals).slice(0, 10).map(p => ({
        value: p.wcGoals,
        itemStyle: { color: '#D4A843' }
      })),
      label: { show: true, position: 'insideLeft', formatter: '{c}', color: '#010B1C', fontSize: 11, fontWeight: 700 },
      barMaxWidth: 18,
    }],
  }

  const capsVsGoalsOpt = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#051829', borderColor: '#1A3868', textStyle: { color: '#E6EDF8' },
      formatter: (p) => `<b>${p.data.name}</b><br/>Caps: ${p.data.value[0]}<br/>Int'l goals: ${p.data.value[1]}<br/>WC goals: ${p.data.value[2]}`
    },
    grid: { top: 20, bottom: 50, left: 60, right: 20 },
    xAxis: { type: 'value', name: 'Caps', nameTextStyle: { color: CHART_AXIS.name }, axisLine: { lineStyle: { color: '#1A3868' } }, splitLine: { lineStyle: { color: '#1A3868' } }, axisLabel: { color: CHART_AXIS.label } },
    yAxis: { type: 'value', name: "Int'l Goals", nameTextStyle: { color: CHART_AXIS.name }, axisLine: { lineStyle: { color: '#1A3868' } }, splitLine: { lineStyle: { color: '#1A3868' } }, axisLabel: { color: CHART_AXIS.label } },
    series: [{
      type: 'scatter',
      symbolSize: (d) => Math.max(d[2] * 3 + 8, 8),
      data: PLAYERS.map(p => ({
        value: [p.caps, p.goals, p.wcGoals],
        name: p.name,
        itemStyle: { color: p.wcGoals >= 5 ? '#D4A843' : p.wcGoals >= 1 ? '#1E5FC4' : '#354F72', opacity: 0.85 }
      })),
      emphasis: { label: { show: true, formatter: (p) => p.data.name, color: '#E6EDF8', fontSize: 10 } },
    }],
  }

  const POS_COLORS = { FW: '#C8102E', MF: '#1E5FC4', DF: '#00A651', GK: '#D4A843' }

  return (
    <div>
      {/* Chart row */}
      <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-block">
          <div className="chart-block-title">WC Career Goals — Top 10</div>
          <ReactECharts option={topWcGoalOpt} style={{ height: 340 }} theme={ECHART_THEME} />
        </div>
        <div className="chart-block">
          <div className="chart-block-title">Caps vs Int'l Goals (bubble = WC goals)</div>
          <ReactECharts option={capsVsGoalsOpt} style={{ height: 340 }} theme={ECHART_THEME} />
        </div>
      </div>

      {/* Sortable player table */}
      <div className="chart-block">
        <div className="chart-block-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Player Profiles — {filtered.length} players</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all','FW','MF','DF'].map(p => (
              <button
                key={p}
                onClick={() => setPosFilter(p)}
                style={{
                  height: 24, padding: '0 10px', fontSize: '0.62rem', borderRadius: 3,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  border: `1px solid ${posFilter === p ? 'var(--gold)' : 'var(--border-2)'}`,
                  background: posFilter === p ? 'var(--gold-dim)' : 'transparent',
                  color: posFilter === p ? 'var(--gold)' : 'var(--text-3)',
                  cursor: 'pointer',
                }}
              >{p === 'all' ? 'All' : p}</button>
            ))}
            <select
              value={sort} onChange={e => setSort(e.target.value)}
              style={{ height: 24, padding: '0 8px', fontSize: '0.62rem', background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 3, color: 'var(--text-2)', cursor: 'pointer' }}
            >
              <option value="wcGoals">Sort: WC Goals</option>
              <option value="wcAssists">Sort: WC Assists</option>
              <option value="wcApps">Sort: WC Apps</option>
              <option value="goals">Sort: Int'l Goals</option>
              <option value="caps">Sort: Caps</option>
              <option value="age">Sort: Age</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: 4 }}>
          <table className="standings-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: 10 }}>#</th>
                <th style={{ textAlign: 'left' }}>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th>Age</th>
                <th title="World Cup appearances">WC Apps</th>
                <th title="World Cup goals">WC G</th>
                <th title="World Cup assists">WC A</th>
                <th title="International caps">Caps</th>
                <th title="International goals">Int'l G</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const t = TEAMS[p.team]
                return (
                  <tr key={p.name}>
                    <td style={{ paddingLeft: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{i + 1}</td>
                    <td style={{ textAlign: 'left', fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--text)' }}>{p.name}</td>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{t?.name || p.team}</span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700,
                        padding: '1px 5px', borderRadius: 3,
                        background: `${POS_COLORS[p.pos]}22`,
                        color: POS_COLORS[p.pos],
                        border: `1px solid ${POS_COLORS[p.pos]}44`,
                      }}>{p.pos}</span>
                    </td>
                    <td>{p.age}</td>
                    <td style={{ fontWeight: p.wcApps > 0 ? 600 : 400, color: p.wcApps > 0 ? 'var(--text)' : 'var(--text-3)' }}>{p.wcApps}</td>
                    <td style={{ fontWeight: p.wcGoals > 0 ? 700 : 400, color: p.wcGoals >= 5 ? 'var(--gold)' : p.wcGoals > 0 ? 'var(--text)' : 'var(--text-3)' }}>{p.wcGoals}</td>
                    <td style={{ color: p.wcAssists > 0 ? 'var(--text)' : 'var(--text-3)' }}>{p.wcAssists}</td>
                    <td>{p.caps}</td>
                    <td style={{ fontWeight: p.goals >= 50 ? 700 : 400, color: p.goals >= 50 ? 'var(--gold)' : 'var(--text-2)' }}>{p.goals}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Rankings ──────────────────────────────────────────────────────────────────
function RankingsTab() {
  const teams = Object.entries(TEAMS).sort((a,b) => a[1].ranking - b[1].ranking).slice(0, 20)

  const rankingOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    grid: { top: 20, bottom: 80, left: 100, right: 20 },
    xAxis: { type: 'value', inverse: true, max: 120, axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label, fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: teams.map(([,t]) => t.name),
      axisLabel: { color: '#7A8BA0', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1E2738' } },
    },
    series: [{
      type: 'bar',
      data: teams.map(([,t]) => ({
        value: 121 - t.ranking,
        itemStyle: { color: groupColor(t.group) }
      })),
      label: { show: true, position: 'insideLeft', formatter: (p) => `#${121 - p.value}`, color: '#D4DCE8', fontSize: 10 },
      barMaxWidth: 18,
    }],
  }

  const appsOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    grid: { top: 20, bottom: 80, left: 100, right: 20 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label, fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: Object.entries(TEAMS).sort((a,b) => b[1].wcApps - a[1].wcApps).slice(0,15).map(([,t]) => t.name),
      axisLabel: { color: '#7A8BA0', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1E2738' } },
    },
    series: [{
      type: 'bar',
      data: Object.entries(TEAMS).sort((a,b) => b[1].wcApps - a[1].wcApps).slice(0,15).map(([,t]) => ({
        value: t.wcApps,
        itemStyle: { color: '#E8B84B' }
      })),
      label: { show: true, position: 'insideLeft', formatter: '{c}', color: '#07090E', fontSize: 11, fontWeight: 700 },
      barMaxWidth: 18,
    }],
  }

  return (
    <div className="charts-grid">
      <div className="chart-block">
        <div className="chart-block-title">FIFA Rankings — Top 20 at 2026</div>
        <ReactECharts option={rankingOpt} style={{ height: 460 }} theme={ECHART_THEME} />
      </div>
      <div className="chart-block">
        <div className="chart-block-title">Most World Cup Appearances (2026 Participants)</div>
        <ReactECharts option={appsOpt} style={{ height: 460 }} theme={ECHART_THEME} />
      </div>
    </div>
  )
}

// ── History ───────────────────────────────────────────────────────────────────
function HistoryTab() {
  const winsOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    legend: { bottom: 0, textStyle: { color: '#7A8BA0', fontSize: 11 }, itemGap: 12 },
    series: [{
      type: 'pie',
      radius: ['40%', '72%'],
      center: ['50%', '44%'],
      data: WC_HISTORY.filter(h => h.wins > 0).map(h => ({
        name: h.nation,
        value: h.wins,
        itemStyle: { color: ['#E8B84B','#7A8BA0','#00D68F','#4A90D9','#E84A5F','#9b59b6','#e67e22','#1abc9c'][WC_HISTORY.indexOf(h) % 8] }
      })),
      label: { color: '#D4DCE8', fontSize: 11 },
      labelLine: { lineStyle: { color: '#3E4E66' } },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  }

  const heatOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    grid: { top: 30, bottom: 60, left: 100, right: 30 },
    xAxis: { type: 'value', name: 'Appearances', nameTextStyle: { color: CHART_AXIS.name }, axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label } },
    yAxis: { type: 'value', name: 'WC Titles', nameTextStyle: { color: CHART_AXIS.name }, axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label } },
    series: [{
      type: 'scatter',
      symbolSize: (d) => Math.max(d[2] * 6 + 10, 10),
      data: WC_HISTORY.map(h => ({
        value: [h.apps, h.wins, h.runner_up + 1],
        name: h.nation,
        itemStyle: { color: h.wins > 0 ? '#E8B84B' : h.runner_up > 0 ? '#4A90D9' : '#3E4E66', opacity: 0.8 }
      })),
      label: { show: true, formatter: '{a}', color: '#D4DCE8', fontSize: 9, position: 'top' },
      emphasis: { label: { show: true, formatter: (p) => p.data.name } },
    }],
  }

  return (
    <div className="charts-grid">
      <div className="chart-block">
        <div className="chart-block-title">World Cup Titles Distribution</div>
        <ReactECharts option={winsOpt} style={{ height: 380 }} theme={ECHART_THEME} />
      </div>
      <div className="chart-block">
        <div className="chart-block-title">Appearances vs Titles (bubble = runner-up count)</div>
        <ReactECharts option={heatOpt} style={{ height: 380 }} theme={ECHART_THEME} />
      </div>
    </div>
  )
}

// ── Groups strength ───────────────────────────────────────────────────────────
function GroupsTab({ liveMap }) {
  const groups = 'ABCDEFGHIJKL'.split('')

  const groupData = groups.map(g => {
    const teams = Object.entries(TEAMS).filter(([,t]) => t.group === g)
    const avgRank = teams.reduce((s,[,t]) => s + t.ranking, 0) / teams.length
    const minRank = Math.min(...teams.map(([,t]) => t.ranking))
    return { group: g, avgRank: Math.round(avgRank), minRank, color: groupColor(g) }
  })

  const strengthOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' }, formatter: (p) => `Group ${p[0].name}<br/>Avg rank: #${p[0].value}<br/>Best team: #${groupData[p[0].dataIndex].minRank}` },
    grid: { top: 20, bottom: 30, left: 50, right: 20 },
    xAxis: { type: 'category', data: groups, axisLabel: { color: '#7A8BA0', fontSize: 12, fontWeight: 700 }, axisLine: { lineStyle: { color: '#1E2738' } } },
    yAxis: { type: 'value', inverse: true, min: 0, max: 120, name: 'Avg FIFA Rank (lower = stronger)', nameTextStyle: { color: CHART_AXIS.name, fontSize: 10 }, axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label, formatter: '#{value}' } },
    series: [{
      type: 'bar',
      data: groupData.map(d => ({ value: d.avgRank, itemStyle: { color: d.color } })),
      label: { show: true, position: 'top', formatter: (p) => `#${p.value}`, color: '#7A8BA0', fontSize: 10 },
      barMaxWidth: 32,
    }],
  }

  const pointsOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    legend: { bottom: 0, textStyle: { color: '#7A8BA0', fontSize: 10 } },
    grid: { top: 20, bottom: 50, left: 50, right: 20 },
    xAxis: { type: 'category', data: groups, axisLabel: { color: '#7A8BA0', fontSize: 12, fontWeight: 700 }, axisLine: { lineStyle: { color: '#1E2738' } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label } },
    series: groups.map((g, gi) => {
      const rows = calcStandings(g, liveMap)
      return null // placeholder until matches start
    }).filter(Boolean),
  }

  return (
    <div className="charts-grid">
      <div className="chart-block" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-block-title">Group Strength by Average FIFA Ranking</div>
        <ReactECharts option={strengthOpt} style={{ height: 320 }} theme={ECHART_THEME} />
      </div>

      {/* Group ranking table */}
      <div className="chart-block" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-block-title">All Teams by Group — FIFA Rankings</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="standings-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Group</th>
                {['1st','2nd','3rd','4th'].map(p => (
                  <th key={p} style={{ textAlign: 'left' }}>{p}</th>
                ))}
                <th>Avg Rank</th>
              </tr>
            </thead>
            <tbody>
              {groupData.map(({ group: g, avgRank, color }) => {
                const gTeams = Object.entries(TEAMS).filter(([,t]) => t.group === g).sort((a,b) => a[1].ranking - b[1].ranking)
                return (
                  <tr key={g}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color }}>
                      Group {g}
                    </td>
                    {gTeams.map(([code, t]) => (
                      <td key={code} style={{ textAlign: 'left', fontFamily: 'var(--font)', color: 'var(--text-2)' }}>
                        {t.flag} {t.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}>#{t.ranking}</span>
                      </td>
                    ))}
                    <td className="pts">#{avgRank}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Venues ────────────────────────────────────────────────────────────────────
function VenuesTab() {
  const venueList = Object.entries(VENUES).sort((a,b) => b[1].capacity - a[1].capacity)

  const capOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' } },
    grid: { top: 20, bottom: 20, left: 160, right: 80 },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: '#1E2738' } }, splitLine: { lineStyle: { color: '#1E2738' } }, axisLabel: { color: CHART_AXIS.label, fontSize: 10, formatter: (v) => (v/1000).toFixed(0)+'k' } },
    yAxis: {
      type: 'category',
      data: venueList.map(([,v]) => v.city),
      axisLabel: { color: '#7A8BA0', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1E2738' } },
    },
    series: [{
      type: 'bar',
      data: venueList.map(([,v]) => ({
        value: v.capacity,
        itemStyle: { color: v.country === 'USA' ? '#4A90D9' : v.country === 'Mexico' ? '#00D68F' : '#E8B84B' }
      })),
      label: { show: true, position: 'right', formatter: (p) => p.value.toLocaleString(), color: '#7A8BA0', fontSize: 10 },
      barMaxWidth: 18,
    }],
  }

  return (
    <div className="charts-grid">
      <div className="chart-block" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-block-title">Venue Capacities — Blue: USA · Green: Mexico · Gold: Canada</div>
        <ReactECharts option={capOpt} style={{ height: 460 }} theme={ECHART_THEME} />
      </div>
    </div>
  )
}

// ── Continental ───────────────────────────────────────────────────────────────
function ContinentalTab() {
  const confCounts = {}
  Object.values(TEAMS).forEach(t => { confCounts[t.conf] = (confCounts[t.conf] || 0) + 1 })

  const CONF_COLORS = { UEFA: '#4A90D9', CAF: '#00D68F', AFC: '#E8B84B', CONMEBOL: '#E84A5F', CONCACAF: '#9b59b6', OFC: '#7A8BA0' }

  const pieOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' }, formatter: '{b}: {c} teams ({d}%)' },
    legend: { bottom: 10, textStyle: { color: '#7A8BA0', fontSize: 11 }, itemGap: 16 },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '42%'],
      data: Object.entries(confCounts).map(([conf, count]) => ({
        name: conf, value: count, itemStyle: { color: CONF_COLORS[conf] || '#888' }
      })).sort((a,b) => b.value - a.value),
      label: { formatter: '{b}\n{c}', color: '#D4DCE8', fontSize: 11 },
      labelLine: { lineStyle: { color: '#3E4E66' } },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  }

  const rankScatterOpt = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#0C1018', borderColor: '#1E2738', textStyle: { color: '#D4DCE8' }, formatter: (p) => `${p.data.name}<br/>Rank: #${p.data.value[0]}<br/>WC Apps: ${p.data.value[1]}<br/>Titles: ${p.data.value[2]}` },
    legend: {
      data: Object.keys(CONF_COLORS),
      bottom: 0,
      textStyle: { color: '#7A8BA0', fontSize: 10 },
    },
    grid: { top: 28, bottom: 60, left: 68, right: 20 },
    xAxis: {
      type: 'value',
      name: 'FIFA Rank',
      nameTextStyle: { color: CHART_AXIS.name, fontSize: 11, fontWeight: 600 },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.split } },
      axisLabel: { color: CHART_AXIS.label, formatter: '#{value}' },
    },
    yAxis: {
      type: 'value',
      name: 'WC Appearances',
      nameLocation: 'middle',
      nameGap: 48,
      nameTextStyle: { color: CHART_AXIS.name, fontSize: 11, fontWeight: 600 },
      axisLine: { lineStyle: { color: CHART_AXIS.line } },
      splitLine: { lineStyle: { color: CHART_AXIS.split } },
      axisLabel: { color: CHART_AXIS.label },
    },
    series: Object.entries(CONF_COLORS).map(([conf, color]) => ({
      name: conf,
      type: 'scatter',
      symbolSize: (d) => Math.max(d[2] * 5 + 8, 8),
      data: Object.entries(TEAMS)
        .filter(([,t]) => t.conf === conf)
        .map(([code, t]) => ({
          value: [t.ranking, t.wcApps, t.wcWins],
          name: t.name,
        })),
      itemStyle: { color, opacity: 0.8 },
      emphasis: { label: { show: true, formatter: (p) => p.data.name, color: '#D4DCE8', fontSize: 10 } },
    })),
  }

  return (
    <div className="charts-grid">
      <div className="chart-block">
        <div className="chart-block-title">Teams by Confederation</div>
        <ReactECharts option={pieOpt} style={{ height: 380 }} theme={ECHART_THEME} />
      </div>
      <div className="chart-block">
        <div className="chart-block-title">FIFA Rank vs WC Appearances by Confederation</div>
        <ReactECharts option={rankScatterOpt} style={{ height: 380 }} theme={ECHART_THEME} />
      </div>
    </div>
  )
}
