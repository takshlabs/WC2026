import { useEffect, useState, useCallback, useRef } from 'react'
import { ref, push, onValue, query, limitToLast } from 'firebase/database'
import { getDb } from '../lib/firebase'

const CHAT_PATH  = 'wc2026/chat/messages'
const MAX_VISIBLE = 150
const COOLDOWN_MS = 3000

export function useGlobalChat() {
  const [messages, setMessages] = useState([])
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
    const q = query(ref(db, CHAT_PATH), limitToLast(MAX_VISIBLE))
    const unsub = onValue(q, snap => {
      const msgs = []
      snap.forEach(child => msgs.push({ id: child.key, ...child.val() }))
      setMessages(msgs)
    }, () => {})
    return unsub
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
    const promise = push(ref(db, CHAT_PATH), {
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

  return { messages, name, setName, sendMessage }
}
