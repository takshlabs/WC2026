// WC 2026 Service Worker — handles notification clicks + push events

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      return self.clients.openWindow(target)
    })
  )
})

self.addEventListener('push', event => {
  if (!event.data) return
  const { title, body, icon, tag, data } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, { body, icon, tag, data })
  )
})
