import { useEffect, useState, useCallback } from 'react'
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

  function setName(n) {
    const clean = n.trim().slice(0, 20)
    setNameState(clean)
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

  const sendMessage = useCallback((text) => {
    const db = getDb()
    if (!db || !text.trim() || !name.trim()) return false
    const coolKey = 'wc2026-chat-last'
    const last = parseInt(sessionStorage.getItem(coolKey) || '0')
    if (Date.now() - last < COOLDOWN_MS) return false
    sessionStorage.setItem(coolKey, String(Date.now()))
    push(ref(db, CHAT_PATH), {
      name: name.trim().slice(0, 20),
      text: text.trim().slice(0, 300),
      ts:   Date.now(),
    }).catch(() => {})
    return true
  }, [name])

  return { messages, name, setName, sendMessage }
}
