import React, { useState } from 'react'
import { VENUES, MATCHES } from '../data'
import { useApp } from '../App'

// Equirectangular projection: viewBox 0 0 700 420, lon -130→-65, lat 55→15
const toSvg = (lat, lon) => ({
  x: (lon + 130) / 65 * 700,
  y: (55 - lat) / 40 * 420,
})
const polyPoints = coords =>
  coords.map(([lat, lon]) => {
    const { x, y } = toSvg(lat, lon)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

// ── Simplified country outlines [lat, lon] ────────────────────────────────────
const USA = [
  [49,-124.7],[47.5,-124.1],[46.2,-124.2],[42,-124.4],
  [37.9,-122.5],[34.4,-120.5],[32.5,-117.1],
  [32.5,-114.8],[31.3,-111.1],[31.8,-106.6],
  [29.7,-104.5],[29.4,-100.5],[26,-97.3],
  [27.8,-97],[29.5,-94.8],[29,-90.1],[29,-89.1],
  [30.2,-88],[30.3,-86.5],[29.9,-84.5],[30.3,-81.4],
  [25.1,-80.1],
  [26.7,-80.2],[30.4,-81.4],[32.1,-80.9],[34,-77.9],
  [35.2,-75.5],[37,-76],[38.9,-74.9],
  [40.7,-74],[41.3,-70.1],[43.1,-70.7],[44.8,-67],
  [47.4,-67.8],[45,-71.5],[43.1,-79.2],[42,-82.7],
  [42.8,-82.4],[46.5,-84.3],[46.8,-88],[47.5,-90],
  [47.3,-92],[49,-97.2],[49,-110],[49,-124.7],
]

const CANADA = [
  [55,-130],[55,-65],
  [47.4,-67.8],
  [45,-71.5],[43.1,-79.2],[42,-82.7],
  [42.8,-82.4],[46.5,-84.3],[46.8,-88],[47.5,-90],
  [47.3,-92],[49,-97.2],[49,-110],[49,-124.7],
  [50,-126.5],[52,-128.5],[54,-130],
]

const MEXICO = [
  [32.5,-117.1],[32.5,-114.8],[31.3,-111.1],
  [31.8,-106.6],[29.7,-104.5],[29.4,-100.5],[26,-97.3],
  [23.8,-97.8],[21.6,-97.6],[20,-96.2],[19.2,-95.9],
  [18.5,-92.9],[18.5,-88.3],[21.3,-87.5],[21.4,-86.9],
  [17.9,-88.5],[15.9,-88.9],[15.9,-92.2],
  [15.7,-96.4],[16.2,-98.8],[18.1,-103.7],
  [19.3,-105],[20.7,-105.4],[22.5,-106],[23.5,-106.4],
  [22.9,-109.9],
  [25.5,-111.8],[27.5,-115],[30,-116],[32.5,-117.1],
]

// Simplified Great Lakes (SVG ellipses)
const GREAT_LAKES = [
  { cx: 455, cy: 82,  rx: 48, ry: 18, id: 'sup' },
  { cx: 466, cy: 120, rx: 12, ry: 27, id: 'mic' },
  { cx: 514, cy: 109, rx: 25, ry: 20, id: 'hur' },
  { cx: 527, cy: 135, rx: 24, ry:  9, id: 'eri' },
  { cx: 566, cy: 119, rx: 22, ry:  9, id: 'ont' },
]

const VENUE_GEO = {
  LUMEN:       { lat: 47.60, lon: -122.33 },
  BCPLACE:     { lat: 49.28, lon: -123.11 },
  LEVIS:       { lat: 37.40, lon: -121.97 },
  SOFI:        { lat: 33.95, lon: -118.34 },
  AZTECA:      { lat: 19.30, lon:  -99.15 },
  AKRON:       { lat: 20.68, lon: -103.47 },
  BBVA:        { lat: 25.67, lon: -100.37 },
  ATT:         { lat: 32.75, lon:  -97.09 },
  NRG:         { lat: 29.68, lon:  -95.41 },
  ARROWHEAD:   { lat: 39.05, lon:  -94.48 },
  MERCEDESBENZ:{ lat: 33.76, lon:  -84.40 },
  HARDROCK:    { lat: 25.96, lon:  -80.24 },
  LINC:        { lat: 39.90, lon:  -75.17 },
  BMO:         { lat: 43.63, lon:  -79.42 },
  METLIFE:     { lat: 40.81, lon:  -74.07 },
  GILLETTE:    { lat: 42.09, lon:  -71.26 },
}

const COUNTRY_COLOR = { USA: 'var(--blue)', Canada: '#E8002D', Mexico: 'var(--green)' }

export default function Venues() {
  const { navigate, setFixtureFilter } = useApp()
  const [selected, setSelected] = useState(null)

  const matchCounts = {}
  MATCHES.forEach(m => {
    if (m.venue) matchCounts[m.venue] = (matchCounts[m.venue] || 0) + 1
  })

  function goVenueFixtures(venueKey) {
    navigate('fixtures')
    setFixtureFilter(f => ({ ...f, group: '', round: '', team: '', focus: null, venue: venueKey }))
  }

  const countries = ['USA', 'Canada', 'Mexico']
  const venuesByCountry = countries.map(c => ({
    country: c,
    venues: Object.entries(VENUES).filter(([, v]) => v.country === c),
  }))

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header">
        <h1>Venues</h1>
        <p>16 stadiums across 3 countries · Click a venue to explore its fixtures</p>
      </div>

      {/* ── Real map ─────────────────────────────────────────────────────────── */}
      <div className="venue-map-wrap">
        <svg viewBox="0 0 700 420" className="venue-map-svg" xmlns="http://www.w3.org/2000/svg">

          {/* Ocean/water */}
          <rect width="700" height="420" className="vm-water" rx="8" />

          {/* Faint grid */}
          {[1,2,3,4,5].map(i => (
            <line key={`h${i}`} x1="0" y1={i*70} x2="700" y2={i*70} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <line key={`v${i}`} x1={i*70} y1="0" x2={i*70} y2="420" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          ))}

          {/* Country fills */}
          <polygon points={polyPoints(CANADA)} className="vm-canada" />
          <polygon points={polyPoints(USA)}    className="vm-usa"    />
          <polygon points={polyPoints(MEXICO)} className="vm-mexico" />

          {/* Great Lakes (water on top of USA fill) */}
          {GREAT_LAKES.map(l => (
            <ellipse key={l.id} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} className="vm-lake" />
          ))}

          {/* Country labels */}
          <text x="540" y="185" fill="currentColor" className="vm-label vm-label-usa"  fontSize="38" textAnchor="middle">USA</text>
          <text x="510" y="46"  fill="currentColor" className="vm-label vm-label-can"  fontSize="20" textAnchor="middle">CANADA</text>
          <text x="295" y="370" fill="currentColor" className="vm-label vm-label-mex"  fontSize="24" textAnchor="middle">MEXICO</text>

          {/* Venue dots */}
          {Object.entries(VENUES).map(([key, v]) => {
            const geo = VENUE_GEO[key]
            if (!geo) return null
            const { x, y } = toSvg(geo.lat, geo.lon)
            const isSelected = selected === key
            const c = COUNTRY_COLOR[v.country] || 'var(--gold)'
            const cnt = matchCounts[key] || 0
            return (
              <g key={key} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === key ? null : key)}>
                {isSelected && <circle cx={x} cy={y} r="18" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5" />}
                <circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={c} opacity={isSelected ? 1 : 0.85} />
                <text x={x} y={y - 12} fill="var(--text)" fontSize="8.5" textAnchor="middle" fontFamily="sans-serif" fontWeight="600" opacity="0.9">{v.city}</text>
                {cnt > 0 && (
                  <text x={x} y={y + 3.5} fill="white" fontSize="6" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">{cnt}</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {selected && VENUES[selected] && (
          <div className="venue-map-tooltip">
            <div className="venue-tooltip-name">{VENUES[selected].name}</div>
            <div className="venue-tooltip-meta">{VENUES[selected].city} · {VENUES[selected].country}</div>
            <div className="venue-tooltip-cap">🏟 {VENUES[selected].capacity?.toLocaleString()} capacity</div>
            <div className="venue-tooltip-matches">{matchCounts[selected] || 0} matches</div>
            <button className="btn btn-ghost" style={{ marginTop: 8, height: 28, fontSize: '0.65rem', padding: '0 12px' }}
              onClick={() => goVenueFixtures(selected)}>
              View Fixtures →
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '0.75rem 0 1.5rem', flexWrap: 'wrap' }}>
        {['USA', 'Canada', 'Mexico'].map(c => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: COUNTRY_COLOR[c], display: 'inline-block' }} />{c}
          </span>
        ))}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>· Number inside dot = match count</span>
      </div>

      {/* ── Venue cards ───────────────────────────────────────────────────────── */}
      {venuesByCountry.map(({ country, venues: vlist }) => (
        <div key={country} style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: COUNTRY_COLOR[country],
            borderBottom: `2px solid ${COUNTRY_COLOR[country]}`,
            paddingBottom: 8, marginBottom: 12, opacity: 0.85,
          }}>
            {country === 'USA' ? '🇺🇸' : country === 'Canada' ? '🇨🇦' : '🇲🇽'} {country}
            <span style={{ color: 'var(--text-3)', fontSize: '0.65rem', fontWeight: 400, marginLeft: 'auto' }}>
              {vlist.length} venue{vlist.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="venue-cards-grid">
            {vlist.map(([key, v]) => {
              const cnt = matchCounts[key] || 0
              const isSelected = selected === key
              return (
                <div
                  key={key}
                  className={`venue-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelected(isSelected ? null : key)}
                  style={{ borderTopColor: COUNTRY_COLOR[v.country] }}
                >
                  <div className="venue-card-name">{v.name}</div>
                  <div className="venue-card-city">{v.city}</div>
                  <div className="venue-card-stats">
                    <span>🏟 {v.capacity?.toLocaleString()}</span>
                    <span className="venue-card-matches">{cnt} match{cnt !== 1 ? 'es' : ''}</span>
                  </div>
                  <button className="venue-card-link" onClick={e => { e.stopPropagation(); goVenueFixtures(key) }}>
                    Fixtures →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
