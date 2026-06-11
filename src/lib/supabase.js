import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fixed id of the Global League (matches schema.sql)
export const GLOBAL_LEAGUE_ID = '00000000-0000-0000-0000-000000000000'

export const isSupabaseConfigured = Boolean(URL && ANON)

// Single shared client; null when env vars are missing so the UI can show setup help.
export const supabase = isSupabaseConfigured
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
