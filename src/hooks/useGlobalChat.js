import { useEffect, useState, useCallback, useRef } from 'react'

const CHAT_PATH   = 'wc2026/chat/messages'
const MAX_VISIBLE = 150
const COOLDOWN_MS = 3000
const POLL_MS     = 3000

// Firebase REST base — same var the SDK uses, but we bypass the SDK entirely
const DB_BASE = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '')

export function useGlobalChat() {
  const [messages, setMessages]   = useState([])
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
    if (!DB_BASE) { setReadError('DB URL not configured'); return }

    let cancelled = false
    let pollTimer = null

    async function fetchMessages() {
      if (cancelled) return
      try {
        const res = await fetch(`${DB_BASE}/${CHAT_PATH}.json`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const msgs = data
          ? Object.entries(data).map(([id, val]) => ({ id, ...val }))
          : []
        msgs.sort((a, b) => (a.ts || 0) - (b.ts || 0))
        setMessages(msgs.slice(-MAX_VISIBLE))
        setReadError('')
        setConnected(true)
      } catch (err) {
        if (cancelled) return
        const code = err?.message || 'fetch failed'
        console.error('[chat] REST fetch error', code)
        setReadError(code)
        setConnected(false)
      }
    }

    fetchMessages()
    pollTimer = setInterval(fetchMessages, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(pollTimer)
    }
  }, [])

  const sendMessage = useCallback((text) => {
    if (!DB_BASE) return null
    const currentName = nameRef.current
    if (!text.trim() || !currentName.trim()) return null

    const coolKey = 'wc2026-chat-last'
    try {
      const last = parseInt(sessionStorage.getItem(coolKey) || '0')
      if (Date.now() - last < COOLDOWN_MS) return null
      sessionStorage.setItem(coolKey, String(Date.now()))
    } catch { /* proceed anyway */ }

    const promise = fetch(`${DB_BASE}/${CHAT_PATH}.json`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name: currentName.trim().slice(0, 20),
        text: text.trim().slice(0, 300),
        ts:   Date.now(),
      }),
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    })

    promise.catch(() => {
      try { sessionStorage.removeItem(coolKey) } catch {}
    })

    return promise
  }, [])

  return { messages, name, setName, sendMessage, connected, readError }
}
