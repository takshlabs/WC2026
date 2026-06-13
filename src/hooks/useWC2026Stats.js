import { useState, useEffect } from 'react'

// Stats are written to gh-pages every 12 hours by .github/workflows/stats-scraper.yml
// Source: fbref.com — scraped server-side to avoid CORS and rate-limit issues in the browser.
const STATS_URL = `${import.meta.env.BASE_URL}wc2026-stats.json`

export function useWC2026Stats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${STATS_URL}?_=${Date.now()}`)
        if (res.status === 404) {
          // Cron hasn't run yet — silent no-op
          if (!cancelled) setLoading(false)
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) { setStats(data); setLoading(false) }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false) }
      }
    }

    load()
    // Refresh every 6 hours in the browser (data only updates every 12h anyway)
    const id = setInterval(load, 6 * 60 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return { stats, loading, error }
}
