import { useState } from 'react'
import { MATCHES, TEAMS } from '../data'

const BASE = import.meta.env.BASE_URL || '/'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function _show(title, opts) {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) { reg.showNotification(title, opts); return }
  } catch {}
  try { new Notification(title, opts) } catch {}
}

export async function showGoalNotif(m, homeScore, awayScore) {
  const homeT = TEAMS[m.home]; const awayT = TEAMS[m.away]
  const title = `⚽ GOAL! ${homeT?.name} ${homeScore}–${awayScore} ${awayT?.name}`
  await _show(title, {
    body: `Group ${m.group} · tap to open`,
    icon: `${BASE}favicon.ico`,
    tag: `goal-${m.id}-${homeScore}-${awayScore}`,
    data: { url: BASE },
  })
}

function scheduleUpcomingNotifs(myTeams) {
  if (typeof window === 'undefined') return
  if (window._notifTids) window._notifTids.forEach(clearTimeout)
  window._notifTids = []

  const now = Date.now()
  MATCHES.forEach(m => {
    if (!m.home || (!myTeams.includes(m.home) && !myTeams.includes(m.away))) return
    const ts = new Date(`${m.date}T${m.time}:00Z`).getTime()
    const homeT = TEAMS[m.home]; const awayT = TEAMS[m.away]
    const matchup = `${homeT?.name || 'TBD'} vs ${awayT?.name || 'TBD'}`

    ;[60, 15].forEach(mins => {
      const delay = ts - mins * 60000 - now
      if (delay > 0 && delay < 86400000) { // only within next 24 h
        const id = setTimeout(() => {
          const label = mins === 60 ? '⏰ Kickoff in 1 hour!' : '🔔 Kickoff in 15 min!'
          _show(label, {
            body: matchup,
            icon: `${BASE}favicon.ico`,
            tag: `ko-${m.id}-${mins}`,
            data: { url: BASE },
          })
        }, delay)
        window._notifTids.push(id)
      }
    })
  })
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [permission, setPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  })

  async function requestPermission() {
    if (typeof Notification === 'undefined') return 'unsupported'
    const p = await Notification.requestPermission()
    setPermission(p)
    return p
  }

  function scheduleNotifications(myTeams) {
    if (permission !== 'granted' || !myTeams?.length) return
    scheduleUpcomingNotifs(myTeams)
  }

  return { permission, requestPermission, scheduleNotifications }
}
