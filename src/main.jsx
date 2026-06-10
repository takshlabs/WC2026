import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

// Silently reload when a new build is deployed (fixes stale browser cache)
async function checkForNewBuild() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}index.html`, { cache: 'no-store' })
    const html = await res.text()
    const newFile = (html.match(/assets\/(index-[^"]+\.js)/) || [])[1]
    if (newFile && ![...document.scripts].some(s => s.src.endsWith(newFile))) {
      window.location.reload()
    }
  } catch {}
}
window.addEventListener('load', () => {
  setTimeout(checkForNewBuild, 10_000)
  setInterval(checkForNewBuild, 5 * 60_000)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
