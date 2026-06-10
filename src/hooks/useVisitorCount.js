import { useEffect, useState } from 'react'
import { ref, onValue, runTransaction } from 'firebase/database'
import { getDb } from '../lib/firebase'

export function useVisitorCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const db = getDb()
    if (!db) return

    const counterRef = ref(db, 'wc2026/visits')

    // Only count once per browser session (avoids double-counting refreshes + StrictMode)
    if (!sessionStorage.getItem('wc2026-counted')) {
      sessionStorage.setItem('wc2026-counted', '1')
      runTransaction(counterRef, n => (n || 0) + 1).catch(() => {})
    }

    const unsub = onValue(counterRef, snap => {
      const v = snap.val()
      setCount(typeof v === 'number' ? v : null)
    }, () => setCount(null))

    return unsub
  }, [])

  return count
}
