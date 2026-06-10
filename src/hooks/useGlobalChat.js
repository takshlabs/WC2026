import { useEffect, useState, useCallback, useRef } from 'react'
import { ref, push, set, onValue } from 'firebase/database'
import { getDb } from '../lib/firebase'

const CHAT_PATH  = 'wc2026/chat/messages'
const MAX_VISIBLE = 150
const COOLDOWN_MS = 3000

export function useGlobalChat() {
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)
  const [readError, setReadError] = useState('')
  const [name, setNameState] = useState(() => {
    try { return localStorage.getItem('wc2026-chatname') || '' } catch { return '' }
  })
  const nameRef = useRef(name)

  function setName(n) {
    const clean = n.trim().slice(0, 20)
    setNameState(clean)
    nameRef.current = clean
    try { localStorage.setItem('wc2026-chatname', clean) } catch {}
  }

  useEffect(() => {
    const db = getDb()
    if (!db) return

    // Monitor Firebase connection state
    const connRef = ref(db, '.info/connected')
    const unsubConn = onValue(connRef, snap => setConnected(snap.val() === true))

    // Plain ref — no query constraints (sorts client-side, avoids SDK query errors)
    let unsubMsgs = null
    let retryTimer = null
    let cancelled = false

    function subscribe() {
      if (cancelled) return
      if (unsubMsgs) { try { unsubMsgs() } catch {} }
      unsubMsgs = onValue(ref(db, CHAT_PATH), snap => {
        setReadError('')
        const msgs = []
        snap.forEach(child => msgs.push({ id: child.key, ...child.val() }))
        setMessages(msgs.slice(-MAX_VISIBLE))
      }, (err) => {
        const code = err?.code || err?.message || 'unknown'
        console.error('[chat] onValue error', code)
        setReadError(code)
        if (!cancelled) retryTimer = setTimeout(subscribe, 5000)
      })
    }

    subscribe()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      unsubConn()
      if (unsubMsgs) unsubMsgs()
    }
  }, [])

  // Returns a Promise on success, or null if validation/cooldown blocks
  const sendMessage = useCallback((text) => {
    const db = getDb()
    const currentName = nameRef.current
    if (!db || !text.trim() || !currentName.trim()) return null
    const coolKey = 'wc2026-chat-last'
    try {
      const last = parseInt(sessionStorage.getItem(coolKey) || '0')
      if (Date.now() - last < COOLDOWN_MS) return null
      sessionStorage.setItem(coolKey, String(Date.now()))
    } catch { /* sessionStorage unavailable — proceed anyway */ }
    const newRef = push(ref(db, CHAT_PATH))
    const promise = set(newRef, {
      name: currentName.trim().slice(0, 20),
      text: text.trim().slice(0, 300),
      ts:   Date.now(),
    })
    // On Firebase rejection, lift the cooldown so user can retry
    promise.catch(() => {
      try { sessionStorage.removeItem(coolKey) } catch {}
    })
    return promise
  }, [])

  return { messages, name, setName, sendMessage, connected, readError }
}
