import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY
const DB_URL  = import.meta.env.VITE_FIREBASE_DB_URL
const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID

let _db = null

export function getDb() {
  if (!API_KEY || !DB_URL) return null
  if (_db) return _db
  try {
    const app = getApps().length ? getApps()[0] : initializeApp({ apiKey: API_KEY, projectId: PROJECT, databaseURL: DB_URL })
    _db = getDatabase(app)
    return _db
  } catch { return null }
}
