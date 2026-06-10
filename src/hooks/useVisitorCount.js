import { useEffect, useState } from 'react'

const DB_BASE     = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '')
const VISITS_PATH = 'wc2026/visits'

export function useVisitorCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!DB_BASE) return

    async function init() {
      try {
        // 1. Read current count
        const res = await fetch(`${DB_BASE}/${VISITS_PATH}.json`, { cache: 'no-store' })
        const val = await res.json()
        const current = typeof val === 'number' ? val : 0
        setCount(current)

        // 2. Increment once per session (avoid double-counting refreshes + StrictMode)
        if (!sessionStorage.getItem('wc2026-counted')) {
          sessionStorage.setItem('wc2026-counted', '1')
          const next = current + 1
          await fetch(`${DB_BASE}/${VISITS_PATH}.json`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(next),
          })
          setCount(next)
        }
      } catch {
        // Counter is cosmetic — silently ignore errors
      }
    }

    init()
  }, [])

  return count
}
