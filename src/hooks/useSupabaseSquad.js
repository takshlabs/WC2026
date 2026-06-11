import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_FORMATION, DEFAULT_STAGE } from '../data/fplConfig'

export const EMPTY_SQUAD = {
  players: [],            // up to 15 player UUIDs
  startingXI: [],         // 11 ids on the pitch
  bench: [],              // up to 4 ids, ordered
  captain: null,
  vice: null,
  formation: DEFAULT_FORMATION,
  stage: DEFAULT_STAGE,   // client-side only — drives country-limit validation
  rouletteActivated: false,
}

const SETUP_HINT = 'Database not set up — run supabase/schema.sql in your Supabase project (use Run, not Explain), then reload.'

// Translate the "table missing from schema cache" class of error into actionable
// guidance; pass other errors through unchanged.
function friendlyError(err) {
  if (!err) return 'Unknown error'
  const code = err.code || ''
  const msg = err.message || String(err)
  if (code === 'PGRST205' || /schema cache|could not find the table|relation .* does not exist/i.test(msg)) {
    return SETUP_HINT
  }
  return msg
}

// Loads + persists a user's squad for a given matchday against the relational
// schema (user_squads + squad_players). Editing happens in local state; the
// caller saves explicitly via `save()`.
export function useSupabaseSquad(userId, matchday) {
  const [squad, setSquad] = useState(EMPTY_SQUAD)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)

  // Load existing squad for (user, matchday)
  useEffect(() => {
    if (!supabase || !userId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data: row, error: e1 } = await supabase
        .from('user_squads')
        .select('id, formation, roulette_activated')
        .eq('user_id', userId).eq('matchday', matchday)
        .maybeSingle()
      if (cancelled) return
      if (e1) { setError(friendlyError(e1)); setLoading(false); return }
      if (!row) { setSquad({ ...EMPTY_SQUAD }); setLoading(false); return }

      const { data: sp } = await supabase
        .from('squad_players')
        .select('player_id, is_starting, is_captain, is_vice_captain')
        .eq('squad_id', row.id)
      if (cancelled) return

      const players = (sp || []).map(r => r.player_id)
      const startingXI = (sp || []).filter(r => r.is_starting).map(r => r.player_id)
      const bench = (sp || []).filter(r => !r.is_starting).map(r => r.player_id)
      const captain = (sp || []).find(r => r.is_captain)?.player_id || null
      const vice = (sp || []).find(r => r.is_vice_captain)?.player_id || null
      setSquad({
        ...EMPTY_SQUAD,
        players, startingXI, bench, captain, vice,
        formation: row.formation || DEFAULT_FORMATION,
        rouletteActivated: !!row.roulette_activated,
      })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [userId, matchday])

  // Local edit helper (mirrors the patch|fn signature used by the builder UI)
  const updateSquad = useCallback((patch) => {
    setSquad(prev => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }))
  }, [])

  // Persist the whole squad to Supabase
  const save = useCallback(async (byId) => {
    if (!supabase || !userId) return { error: 'Not signed in' }
    setSaving(true); setError(null)
    try {
      const budgetSpent = squad.players.reduce((s, id) => s + (byId[id]?.price || 0), 0)
      // Snapshot of live FIFA points for the starting XI (captain doubled, or 3× if roulette)
      const totalPoints = Math.round(squad.startingXI.reduce((s, id) => {
        const pts = byId[id]?.totalPoints || 0
        if (squad.rouletteActivated) return s + pts // roulette pick resolved later; count base here
        if (id === squad.captain) return s + pts * 2
        return s + pts
      }, 0))
      const { data: row, error: e1 } = await supabase
        .from('user_squads')
        .upsert(
          { user_id: userId, matchday, formation: squad.formation,
            budget_spent: budgetSpent, total_points: totalPoints,
            roulette_activated: squad.rouletteActivated },
          { onConflict: 'user_id,matchday' },
        )
        .select('id').single()
      if (e1) throw e1

      // Replace the junction rows
      await supabase.from('squad_players').delete().eq('squad_id', row.id)
      if (squad.players.length) {
        const rows = squad.players.map(pid => ({
          squad_id: row.id,
          player_id: pid,
          is_starting: squad.startingXI.includes(pid),
          is_captain: squad.captain === pid && !squad.rouletteActivated,
          is_vice_captain: squad.vice === pid && !squad.rouletteActivated,
        }))
        const { error: e2 } = await supabase.from('squad_players').insert(rows)
        if (e2) throw e2
      }
      setSavedAt(Date.now())
      return { error: null }
    } catch (err) {
      const message = friendlyError(err)
      setError(message)
      return { error: message }
    } finally {
      setSaving(false)
    }
  }, [squad, userId, matchday])

  return { squad, updateSquad, setSquad, save, loading, saving, savedAt, error }
}
