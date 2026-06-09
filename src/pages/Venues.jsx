import React, { useState } from 'react'
import { VENUES, MATCHES } from '../data'
import { groupColor } from '../utils'
import { useApp } from '../App'

// Approximate SVG positions (equirectangular, viewBox 0 0 700 420)
// Lat 55→15, Lon -130→-65
const toSvg = (lat, lon) => ({
  x: Math.round((lon + 130) / 65 * 700),
  y: Math.round((55 - lat) / 40 * 420),
})

const VENUE_GEO = {
  LUMEN:       { lat: 47.60, lon: -122.33 },
  BCPLACE:     { lat: 49.28, lon: -123.11 },
  LEVIS:       { lat: 37.40, lon: -121.97 },
  SOFI:        { lat: 33.95, lon: -118.34 },
  AZTECA:      { lat: 19.30, lon: -99.15 },
  AKRON:       { lat: 20.68, lon: -103.47 },
  BBVA:        { lat: 25.67, lon: -100.37 },
  ATT:         { lat: 32.75, lon: -97.09 },
  NRG:         { lat: 29.68, lon: -95.41 },
  ARROWHEAD:   { lat: 39.05, lon: -94.48 },
  MERCEDESBENZ:{ lat: 33.76, lon: -84.40 },
  HARDROCK:    { lat: 25.96, lon: -80.24 },
  LINC:        { lat: 39.90, lon: -75.17 },
  BMO:         { lat: 43.63, lon: -79.42 },
  METLIFE:     { lat: 40.81, lon: -74.07 },
  GILLETTE:    { lat: 42.09, lon: -71.26 },
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
    // Filter fixtures by venue — we'll use team search as proxy for now
    navigate('fixtures')
    setFixtureFilter(f => ({ ...f, group: '', round: '', team: VENUES[venueKey]?.city || '' }))
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

      {/* ── SVG dot map ─────────────────────────────────────────────────────── */}
      <div className="venue-map-wrap">
        <svg viewBox="0 0 700 420" className="venue-map-svg" xmlns="http://www.w3.org/2000/svg">
          {/* Background */}
          <rect width="700" height="420" fill="var(--surface)" rx="8" />

          {/* Faint grid lines */}
          {[0,1,2,3,4,5].map(i => (
            <line key={`h${i}`} x1="0" y1={i*70} x2="700" y2={i*70} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <line key={`v${i}`} x1={i*70} y1="0" x2={i*70} y2="420" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Country labels */}
          <text x="540" y="180" fill="rgba(30,95,196,0.25)" fontSize="42" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">USA</text>
          <text x="530" y="110" fill="rgba(200,16,46,0.2)" fontSize="22" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">CANADA</text>
          <text x="310" y="380" fill="rgba(0,166,81,0.25)" fontSize="28" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">MEXICO</text>

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
                {isSelected && <circle cx={x} cy={y} r="18" fill="none" stroke={c} strokeWidth="1.5" opacity="0.4" />}
                <circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={c} opacity={isSelected ? 1 : 0.75} />
                <text x={x} y={y - 13} fill="var(--text)" fontSize="9" textAnchor="middle" fontFamily="sans-serif" opacity="0.85">{v.city}</text>
                {cnt > 0 && <text x={x} y={y + 3} fill="white" fontSize="6.5" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">{cnt}</text>}
              </g>
            )
          })}
        </svg>

        {/* Tooltip card */}
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

      {/* ── Venue cards by country ───────────────────────────────────────────── */}
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
