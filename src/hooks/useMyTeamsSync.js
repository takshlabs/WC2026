import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, get } from 'firebase/database'
import { getDb } from '../lib/firebase'

function getSyncId() {
  try {
    let id = localStorage.getItem('wc2026-syncid')
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase()
      localStorage.setItem('wc2026-syncid', id)
    }
    return id
  } catch { return null }
}

export function useMyTeamsSync() {
  const [myTeams, setMyTeams] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wc2026-myteams') || '[]') } catch { return [] }
  })
  const [syncId]  = useState(getSyncId)
  const [syncing, setSyncing] = useState(false)

  // Live listener: any device writing to this syncId's path updates everyone
  useEffect(() => {
    const db = getDb()
    if (!db || !syncId) return
    const teamsRef = ref(db, `wc2026/users/${syncId}/myTeams`)
    const unsub = onValue(teamsRef, snap => {
      const val = snap.val()
      if (Array.isArray(val)) {
        setMyTeams(val)
        try { localStorage.setItem('wc2026-myteams', JSON.stringify(val)) } catch {}
      }
    }, () => {})
    return unsub
  }, [syncId])

  const toggleMyTeam = useCallback((code) => {
    setMyTeams(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
      try { localStorage.setItem('wc2026-myteams', JSON.stringify(next)) } catch {}
      const db = getDb()
      if (db && syncId) {
        set(ref(db, `wc2026/users/${syncId}/myTeams`), next).catch(() => {})
      }
      return next
    })
  }, [syncId])

  // Import teams from another device's sync code
  const importFromSyncId = useCallback(async (code) => {
    const clean = code.trim().toUpperCase().slice(0, 8)
    if (!clean || clean === syncId) return 'same'
    const db = getDb()
    if (!db) return 'no-db'
    setSyncing(true)
    try {
      const snap = await get(ref(db, `wc2026/users/${clean}/myTeams`))
      const val = snap.val()
      if (Array.isArray(val) && val.length > 0) {
        // Adopt the imported code as our new syncId so future changes stay linked
        try { localStorage.setItem('wc2026-syncid', clean) } catch {}
        try { localStorage.setItem('wc2026-myteams', JSON.stringify(val)) } catch {}
        window.location.reload()
        return 'ok'
      }
      return 'empty'
    } catch { return 'error' }
    finally { setSyncing(false) }
  }, [syncId])

  return { myTeams, toggleMyTeam, syncId, importFromSyncId, syncing }
}
