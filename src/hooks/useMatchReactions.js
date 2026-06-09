import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, runTransaction } from 'firebase/database'
import { getDb } from '../lib/firebase'

export const REACTIONS = [
  { key: 'goal',  emoji: '⚽' },
  { key: 'fire',  emoji: '🔥' },
  { key: 'heart', emoji: '❤️' },
  { key: 'zap',   emoji: '⚡' },
]

const THROTTLE_MS = 2500

export function useMatchReactions(matchId, enabled) {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!enabled || !matchId) return
    const db = getDb()
    if (!db) return
    const reactRef = ref(db, `wc2026/reactions/${matchId}`)
    const unsub = onValue(reactRef, snap => {
      setCounts(snap.val() || {})
    }, () => {})
    return unsub
  }, [matchId, enabled])

  const react = useCallback((key) => {
    const db = getDb()
    if (!db || !enabled) return
    const tkey = `rx-${matchId}-${key}`
    const last = parseInt(sessionStorage.getItem(tkey) || '0')
    if (Date.now() - last < THROTTLE_MS) return
    sessionStorage.setItem(tkey, String(Date.now()))
    runTransaction(ref(db, `wc2026/reactions/${matchId}/${key}`), n => (n || 0) + 1).catch(() => {})
  }, [matchId, enabled])

  return { counts, react }
}
