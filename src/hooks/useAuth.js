import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Auth state + helpers backed by Supabase Auth.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)   // row from public.users
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load the public profile whenever the session user changes.
  useEffect(() => {
    const uid = session?.user?.id
    if (!supabase || !uid) { setProfile(null); return }
    let cancelled = false
    supabase.from('users').select('id, username, email').eq('id', uid).maybeSingle()
      .then(({ data }) => { if (!cancelled) setProfile(data) })
    return () => { cancelled = true }
  }, [session?.user?.id])

  const signUp = useCallback(async (email, password) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message || null }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: 'Supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [])

  return {
    session, user: session?.user || null, profile,
    loading, signUp, signIn, signOut,
    configured: isSupabaseConfigured,
  }
}
