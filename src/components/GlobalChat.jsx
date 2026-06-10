import React, { useState, useEffect, useRef } from 'react'
import { useGlobalChat } from '../hooks/useGlobalChat'

// Deterministic color per username
const PALETTE = ['#e74c3c','#e67e22','#27ae60','#3498db','#9b59b6','#1abc9c','#e91e8c','#f39c12','#45b7d1','#96ceb4']
function nameColor(n) {
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function relTime(ts) {
  const s = (Date.now() - ts) / 1000
  if (s < 60)     return 'just now'
  if (s < 3600)   return `${Math.floor(s / 60)}m`
  if (s < 86400)  return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function GlobalChat() {
  const { messages, name, setName, sendMessage, connected, readError } = useGlobalChat()
  const [open,       setOpen]      = useState(false)
  const [input,      setInput]     = useState('')
  const [nameInput,  setNameInput] = useState('')
  const [needName,   setNeedName]  = useState(!name)
  const [unread,     setUnread]    = useState(0)
  const [sendErr,    setSendErr]   = useState('')
  const [sending,    setSending]   = useState(false)
  const listRef      = useRef(null)
  const panelRef     = useRef(null)
  const prevLenRef   = useRef(0)
  const atBottomRef  = useRef(true)

  // Count unread when panel is closed
  useEffect(() => {
    const added = messages.length - prevLenRef.current
    if (!open && added > 0) setUnread(u => u + added)
    prevLenRef.current = messages.length
  }, [messages.length, open])

  // Scroll to bottom only when at bottom or just opened
  useEffect(() => {
    if (open && listRef.current && atBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages])

  // Clear unread on open + scroll to bottom
  useEffect(() => {
    if (open) {
      setUnread(0)
      atBottomRef.current = true
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open])

  // Push panel above virtual keyboard on mobile (visualViewport API)
  useEffect(() => {
    if (!open || !window.visualViewport) return
    const vv = window.visualViewport
    function adjust() {
      const el = panelRef.current
      if (!el) return
      const keyboardH = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
      if (keyboardH > 0) {
        el.style.bottom = `calc(4.5rem + ${keyboardH}px)`
        el.style.maxHeight = `${Math.max(200, vv.height - 80)}px`
      } else {
        el.style.bottom = ''
        el.style.maxHeight = ''
      }
    }
    vv.addEventListener('resize', adjust)
    vv.addEventListener('scroll', adjust)
    adjust()
    return () => {
      vv.removeEventListener('resize', adjust)
      vv.removeEventListener('scroll', adjust)
      if (panelRef.current) { panelRef.current.style.bottom = ''; panelRef.current.style.maxHeight = '' }
    }
  }, [open])

  function handleScroll() {
    const el = listRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    const promise = sendMessage(text)
    if (!promise) {
      setSendErr(connected ? 'Please wait 3s between messages' : 'Firebase not connected — check repo secrets')
      setTimeout(() => setSendErr(''), 4000)
      return
    }
    setSending(true)
    setInput('')
    atBottomRef.current = true
    try {
      await promise
    } catch {
      setInput(text)  // restore message so user can retry
      setSendErr('Failed to send — check connection')
      setTimeout(() => setSendErr(''), 3000)
    } finally {
      setSending(false)
    }
  }

  function handleSetName(e) {
    e?.preventDefault()
    if (!nameInput.trim()) return
    setName(nameInput.trim())
    setNeedName(false)
  }

  // Group consecutive messages by same sender
  const grouped = messages.map((msg, i) => ({
    ...msg,
    showName: i === 0 || messages[i - 1].name !== msg.name,
  }))

  const canSend = !!input.trim() && !sending

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="gchat-panel" ref={panelRef}>
          <div className="gchat-header">
            <span>🌍 Fan Chat</span>
            <span className="gchat-msgcount">{messages.length} messages</span>
            <button className="gchat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {needName ? (
            <form className="gchat-nameset" onSubmit={handleSetName}>
              <p className="gchat-nameset-hint">Pick a display name to join the global WC chat</p>
              <input
                className="gchat-nameinput"
                placeholder="Your name…"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <button className="btn btn-gold gchat-joinbtn" type="submit">Join Chat →</button>
            </form>
          ) : (
            <>
              <div className="gchat-messages" ref={listRef} onScroll={handleScroll}>
                {readError && (
                  <p className="gchat-empty" style={{color:'#e74c3c'}}>Chat error: {readError}</p>
                )}
                {!readError && messages.length === 0 && (
                  <p className="gchat-empty">No messages yet — be the first! ⚽</p>
                )}
                {grouped.map(msg => (
                  <div key={msg.id} className="gchat-msg">
                    {msg.showName && (
                      <span className="gchat-name" style={{ color: nameColor(msg.name) }}>
                        {msg.name}
                      </span>
                    )}
                    <div className="gchat-bubble-row">
                      <span className="gchat-text">{msg.text}</span>
                      <span className="gchat-time">{relTime(msg.ts)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="gchat-form">
                {sendErr && <div className="gchat-send-err">{sendErr}</div>}
                <div className="gchat-form-row">
                  <input
                    className="gchat-input"
                    placeholder="Say something…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    maxLength={300}
                    disabled={sending}
                  />
                  <button
                    className={`gchat-send${canSend ? '' : ' gchat-send--dim'}`}
                    type="button"
                    onPointerDown={e => { e.preventDefault(); handleSend() }}
                    aria-label="Send message"
                  >{sending ? '…' : '↑'}</button>
                </div>
              </div>

              <div className="gchat-footer">
                <span className={`gchat-conn${connected ? ' gchat-conn--on' : ''}`} title={connected ? 'Connected' : 'Connecting…'}>●</span>
                Chatting as&nbsp;
                <span style={{ color: nameColor(name), fontWeight: 600 }}>{name}</span>
                <button className="gchat-rename" onClick={() => { setNeedName(true); setNameInput('') }}>
                  change
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className={`gchat-fab${open ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Fan Chat"
        aria-label={open ? 'Close fan chat' : 'Open fan chat'}
      >
        {open
          ? '✕'
          : <><span className="gchat-fab-icon">💬</span><span className="gchat-fab-text">Fan Chat</span></>
        }
        {!open && unread > 0 && (
          <span className="gchat-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
    </>
  )
}
