import { useEffect, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, ref, onValue, runTransaction } from 'firebase/database'

const API_KEY  = import.meta.env.VITE_FIREBASE_API_KEY
const DB_URL   = import.meta.env.VITE_FIREBASE_DB_URL
const PROJECT  = import.meta.env.VITE_FIREBASE_PROJECT_ID

let _db = null

function getDb() {
  if (!API_KEY || !DB_URL) return null
  if (_db) return _db
  try {
    const app = getApps().length ? getApps()[0] : initializeApp({ apiKey: API_KEY, projectId: PROJECT, databaseURL: DB_URL })
    _db = getDatabase(app)
    return _db
  } catch { return null }
}

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
