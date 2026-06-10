import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY
const DB_URL  = import.meta.env.VITE_FIREBASE_DB_URL
const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID

let _db = null
let _tokenPromise = null

export function getDb() {
  if (!API_KEY || !DB_URL) return null
  if (_db) return _db
  try {
    const app = getApps().length ? getApps()[0] : initializeApp({ apiKey: API_KEY, projectId: PROJECT, databaseURL: DB_URL })
    _db = getDatabase(app)
    return _db
  } catch { return null }
}

// Get an anonymous Firebase ID token via Auth REST API (no SDK auth module needed).
// Token is cached in sessionStorage to avoid a round-trip on every page interaction.
export async function getAnonToken() {
  if (!API_KEY) return null
  const CACHE_KEY = 'wc2026-fb-token'
  const EXPIRY_KEY = 'wc2026-fb-token-exp'
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    const expiry = parseInt(sessionStorage.getItem(EXPIRY_KEY) || '0')
    if (cached && Date.now() < expiry) return cached
  } catch {}

  if (_tokenPromise) return _tokenPromise
  _tokenPromise = fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) }
  )
    .then(r => r.json())
    .then(d => {
      const token = d.idToken || null
      if (token) {
        try {
          sessionStorage.setItem('wc2026-fb-token', token)
          sessionStorage.setItem('wc2026-fb-token-exp', String(Date.now() + 55 * 60 * 1000))
        } catch {}
      }
      _tokenPromise = null
      return token
    })
    .catch(() => { _tokenPromise = null; return null })

  return _tokenPromise
}
