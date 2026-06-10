import { useEffect, useState } from 'react'
import { getAnonToken } from '../lib/firebase'

const DB_BASE     = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '')
const VISITS_PATH = 'wc2026/visits'

export function useVisitorCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!DB_BASE) return

    async function init() {
      try {
        const token = await getAnonToken()
        const auth  = token ? `?auth=${token}` : ''
        const url   = `${DB_BASE}/${VISITS_PATH}.json${auth}`

        // Read current count (with optional auth if rules require it)
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const val = await res.json()
        const current = typeof val === 'number' ? val : 0
        setCount(current)

        // Increment once per browser session
        if (!sessionStorage.getItem('wc2026-counted')) {
          sessionStorage.setItem('wc2026-counted', '1')
          const next = current + 1
          await fetch(url, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(next),
          })
          setCount(next)
        }
      } catch {
        // Counter is cosmetic — ignore errors silently
      }
    }

    init()
  }, [])

  return count
}
