import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured, GLOBAL_LEAGUE_ID } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useFifaPlayers } from '../hooks/useFifaPlayers'
import { useSupabaseSquad } from '../hooks/useSupabaseSquad'
import { TEAMS } from '../data'
import {
  BUDGET, SQUAD, SQUAD_SIZE, POSITIONS, POS_LABEL, POS_SHORT,
  STAGES, FORMATIONS, BOOSTERS, SCORING, SUPER_SUB_NOTE,
} from '../data/fplConfig'

// ── Helpers ──────────────────────────────────────────────────────────────────
const flag     = code => TEAMS[code]?.flag || '🏳'
const teamName = code => TEAMS[code]?.name || code
const cost     = (ids, byId) => ids.reduce((s, id) => s + (byId[id]?.price || 0), 0)
const byPos    = (ids, byId) => POSITIONS.reduce((a, p) => (a[p] = ids.filter(id => byId[id]?.pos === p).length, a), {})

function blockReason(player, squad, byId, countryLimit) {
  const { players } = squad
  if (players.includes(player.id)) return null
  if (players.length >= SQUAD_SIZE) return 'Squad full (15)'
  if (players.filter(id => byId[id]?.pos === player.pos).length >= SQUAD[player.pos]) return `${POS_LABEL[player.pos]} full (${SQUAD[player.pos]})`
  if (cost(players, byId) + player.price > BUDGET) return 'Over budget'
  // United-Clubs only applies when real-club data is present (FIFA API omits it).
  if (player.club && players.some(id => byId[id]?.club && byId[id].club === player.club)) return `Club taken: ${player.club}`
  if (players.filter(id => byId[id]?.country === player.country).length >= countryLimit) return `Country limit (${countryLimit}) reached`
  return null
}

function autoXI(players, formation, byId) {
  const f = { GK: 1, ...FORMATIONS[formation] }
  const xi = []
  POSITIONS.forEach(pos => {
    const pool = players.filter(id => byId[id]?.pos === pos).sort((a, b) => byId[b].price - byId[a].price)
    xi.push(...pool.slice(0, f[pos]))
  })
  return xi
}

// Bench order: outfield (priority 1–3, priciest first) then the reserve GK last.
function sortBench(bench, byId) {
  return [...bench].sort((a, b) => {
    const ga = byId[a]?.pos === 'GK', gb = byId[b]?.pos === 'GK'
    if (ga !== gb) return ga ? 1 : -1
    return (byId[b]?.price || 0) - (byId[a]?.price || 0)
  })
}

// Decide whether a newly-added player starts or goes to the bench, based on
// whether the current formation still has an open slot for their position.
// (For 2-5-5-3, any valid formation leaves exactly 4 on the bench.)
function placeAdded(prev, id, byId) {
  const pos = byId[id]?.pos
  const f = { GK: 1, ...FORMATIONS[prev.formation] }
  const startersOfPos = prev.startingXI.filter(x => byId[x]?.pos === pos).length
  if (startersOfPos < f[pos]) return { startingXI: [...prev.startingXI, id], bench: prev.bench }
  return { startingXI: prev.startingXI, bench: sortBench([...prev.bench, id], byId) }
}

const MATCHDAYS = [1, 2, 3, 4, 5, 6, 7, 8]

// ── Root ─────────────────────────────────────────────────────────────────────
export default function FPL() {
  const auth = useAuth()

  if (!isSupabaseConfigured) return <SetupNotice />
  if (auth.loading) return <div className="fpl-page"><p className="fpl-muted">Loading…</p></div>
  if (!auth.user) return <AuthScreen auth={auth} />
  return <Dashboard auth={auth} />
}

// ── Setup notice (env vars missing) ──────────────────────────────────────────
function SetupNotice() {
  return (
    <div className="fpl-page fpl-setup">
      <h1 className="fpl-title">Fantasy World Cup <span>2026</span></h1>
      <div className="fpl-setup-card">
        <h2>⚙️ Supabase not connected</h2>
        <p>Add your Supabase project credentials to <code>.env</code> and restart the dev server:</p>
        <pre>{`VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}</pre>
        <p className="fpl-muted">Then run <code>supabase/schema.sql</code> and <code>supabase/seed_players.sql</code> in the Supabase SQL editor.</p>
      </div>
    </div>
  )
}

// ── Auth screen ──────────────────────────────────────────────────────────────
function AuthScreen({ auth }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const fn = mode === 'signin' ? auth.signIn : auth.signUp
    const { error } = await fn(email.trim(), password)
    if (error) setMsg(error)
    else if (mode === 'signup') setMsg('Account created. If email confirmation is on, check your inbox — otherwise you are signed in.')
    setBusy(false)
  }

  return (
    <div className="fpl-page fpl-auth-wrap">
      <div className="fpl-auth-card">
        <h1 className="fpl-title">Fantasy World Cup <span>2026</span></h1>
        <p className="fpl-sub">Sign in to build your squad, join leagues, and climb the leaderboard.</p>
        <div className="fpl-auth-toggle">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setMsg('') }}>Sign in</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMsg('') }}>Sign up</button>
        </div>
        <form onSubmit={submit} className="fpl-auth-form">
          <input className="fpl-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="fpl-input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          <button className="fpl-btn" disabled={busy}>{busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        {msg && <p className="fpl-auth-msg">{msg}</p>}
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ auth }) {
  const { players, byId, loading: playersLoading, error: playersError } = useFifaPlayers()
  const [matchday, setMatchday] = useState(1)
  const { squad, updateSquad, save, loading: squadLoading, saving, savedAt, error } = useSupabaseSquad(auth.user.id, matchday)
  const [tab, setTab] = useState('pick')
  const [toast, setToast] = useState(null)

  const notify = useCallback((m) => {
    setToast(m)
    setTimeout(() => setToast(t => (t === m ? null : t)), 2600)
  }, [])

  const stage = STAGES.find(s => s.id === squad.stage) || STAGES[0]
  const counts = byPos(squad.players, byId)
  const spent = cost(squad.players, byId)
  const remaining = BUDGET - spent
  const complete = squad.players.length === SQUAD_SIZE

  // Repair an inconsistent lineup (e.g. a squad saved before the XI/bench split,
  // or one where every player was flagged starting) into a valid 11 + 4 shape.
  useEffect(() => {
    if (squadLoading || playersLoading || !squad.players.length) return
    if (!squad.players.every(id => byId[id])) return // wait for FIFA data
    const f = { GK: 1, ...FORMATIONS[squad.formation] }
    const xiCounts = byPos(squad.startingXI, byId)
    const covered = new Set([...squad.startingXI, ...squad.bench])
    const coverageOk = covered.size === squad.players.length && squad.players.every(id => covered.has(id))
    const shapeOk = squad.startingXI.length <= 11 && POSITIONS.every(p => xiCounts[p] <= f[p])
    if (coverageOk && shapeOk) return
    const startingXI = autoXI(squad.players, squad.formation, byId)
    const bench = sortBench(squad.players.filter(id => !startingXI.includes(id)), byId)
    updateSquad(prev => ({ ...prev, startingXI, bench }))
  }, [squadLoading, playersLoading, squad.players, squad.startingXI, squad.bench, squad.formation, byId]) // eslint-disable-line

  async function onSave() {
    const { error: e } = await save(byId)
    notify(e ? `Save failed: ${e}` : 'Squad saved ✓')
  }

  if (playersLoading || squadLoading) return <div className="fpl-page"><p className="fpl-muted">Loading live FIFA player data…</p></div>
  if (playersError) return <div className="fpl-page"><p className="fpl-auth-msg">Could not load FIFA player data: {playersError}</p></div>

  return (
    <div className="fpl-page">
      <header className="fpl-hero">
        <div>
          <h1 className="fpl-title">Fantasy World Cup <span>2026</span></h1>
          <p className="fpl-sub">Chaos ruleset — $100M flat cap · United-Clubs · unlimited transfers</p>
        </div>
        <div className="fpl-hero-meta">
          <span className="fpl-user">👤 {auth.profile?.username || auth.user.email}</span>
          <div className="fpl-hero-actions">
            <label className="fpl-md">
              MD
              <select className="fpl-select" value={matchday} onChange={e => setMatchday(Number(e.target.value))}>
                {MATCHDAYS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <button className="fpl-btn-ghost" onClick={auth.signOut}>Sign out</button>
          </div>
        </div>
      </header>

      <SummaryBar spent={spent} remaining={remaining} squad={squad} counts={counts} complete={complete} />

      <nav className="fpl-tabs">
        {[
          ['pick', ' Pick Squad'], ['pitch', 'My Team'], ['boosters', 'Boosters'],
          ['leagues', 'Leagues'], ['leaderboard', 'Leaderboard'], ['rules', 'Rules'],
        ].map(([id, label]) => (
          <button key={id} className={`fpl-tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {(tab === 'pick' || tab === 'pitch' || tab === 'boosters') && (
        <div className="fpl-savebar">
          <span className={`fpl-save ${saving ? 'is-saving' : ''}`}>
            {saving ? 'Saving…' : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : 'Unsaved changes'}
          </span>
          <button className="fpl-btn" onClick={onSave} disabled={saving}>Save squad (MD{matchday})</button>
        </div>
      )}
      {error && <p className="fpl-auth-msg">{error}</p>}

      {tab === 'pick'        && <PickSquad squad={squad} updateSquad={updateSquad} players={players} byId={byId} stage={stage} remaining={remaining} notify={notify} />}
      {tab === 'pitch'       && <PitchView squad={squad} updateSquad={updateSquad} byId={byId} complete={complete} notify={notify} />}
      {tab === 'boosters'    && <Boosters squad={squad} updateSquad={updateSquad} />}
      {tab === 'leagues'     && <Leagues auth={auth} notify={notify} />}
      {tab === 'leaderboard' && <Leaderboard auth={auth} />}
      {tab === 'rules'       && <RulesPanel />}

      {toast && <div className="fpl-toast">{toast}</div>}
    </div>
  )
}

// ── Summary bar ──────────────────────────────────────────────────────────────
function SummaryBar({ spent, remaining, squad, counts, complete }) {
  const pct = Math.min(100, (spent / BUDGET) * 100)
  return (
    <div className="fpl-summary">
      <div className="fpl-budget">
        <div className="fpl-budget-row"><span>Budget</span><strong className={remaining < 0 ? 'neg' : ''}>${remaining.toFixed(1)}M left</strong></div>
        <div className="fpl-budget-bar"><div className="fpl-budget-fill" style={{ width: `${pct}%` }} /></div>
        <div className="fpl-budget-row fpl-budget-foot"><span>${spent.toFixed(1)}M spent</span><span>of ${BUDGET}M</span></div>
      </div>
      <div className="fpl-pos-counts">
        {POSITIONS.map(p => (
          <div key={p} className={`fpl-pos-pill${counts[p] === SQUAD[p] ? ' done' : ''}`}>
            <span className="fpl-pos-pill-pos">{POS_SHORT[p]}</span>
            <span className="fpl-pos-pill-n">{counts[p]}/{SQUAD[p]}</span>
          </div>
        ))}
        <div className={`fpl-pos-pill total${complete ? ' done' : ''}`}>
          <span className="fpl-pos-pill-pos">SQUAD</span>
          <span className="fpl-pos-pill-n">{squad.players.length}/{SQUAD_SIZE}</span>
        </div>
      </div>
    </div>
  )
}

// ── Pick Squad: team (left) + live player pool (right) ───────────────────────
const STAT_OPTIONS = [
  { id: 'price',   label: 'Price',     get: p => p.price,           fmt: p => `$${p.price.toFixed(1)}m` },
  { id: 'points',  label: 'Total pts', get: p => p.totalPoints,     fmt: p => `${p.totalPoints} pts` },
  { id: 'last',    label: 'Last round',get: p => p.lastRoundPoints, fmt: p => `${p.lastRoundPoints} pts` },
  { id: 'sel',     label: 'Selected %',get: p => p.percentSelected, fmt: p => `${p.percentSelected}%` },
]

function PickSquad({ squad, updateSquad, players, byId, stage, remaining, notify }) {
  const [posFilter, setPosFilter] = useState('ALL')
  const [countryFilter, setCountryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [statId, setStatId] = useState('price')

  const stat = STAT_OPTIONS.find(s => s.id === statId) || STAT_OPTIONS[0]

  const countries = useMemo(
    () => [...new Set(players.map(p => p.country))].sort((a, b) => teamName(a).localeCompare(teamName(b))),
    [players],
  )

  const list = useMemo(() => {
    const l = players.filter(p =>
      (posFilter === 'ALL' || p.pos === posFilter) &&
      (!countryFilter || p.country === countryFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())))
    return [...l].sort((a, b) => stat.get(b) - stat.get(a)).slice(0, 200)
  }, [players, posFilter, countryFilter, search, stat])

  function add(player) {
    if (squad.players.includes(player.id)) return
    const reason = blockReason(player, squad, byId, stage.countryLimit)
    if (reason) { notify(reason); return }
    updateSquad(prev => {
      const { startingXI, bench } = placeAdded(prev, player.id, byId)
      return { ...prev, players: [...prev.players, player.id], startingXI, bench }
    })
  }
  function remove(id) {
    updateSquad(prev => {
      const wasStarter = prev.startingXI.includes(id)
      let startingXI = prev.startingXI.filter(x => x !== id)
      let bench = prev.bench.filter(x => x !== id)
      // Promote a same-position sub so the XI keeps its formation shape.
      if (wasStarter) {
        const idx = bench.findIndex(b => byId[b]?.pos === byId[id]?.pos)
        if (idx >= 0) { startingXI = [...startingXI, bench[idx]]; bench = bench.filter((_, i) => i !== idx) }
      }
      return {
        ...prev,
        players: prev.players.filter(x => x !== id),
        startingXI, bench,
        captain: prev.captain === id ? null : prev.captain,
        vice: prev.vice === id ? null : prev.vice,
      }
    })
  }
  function changeFormation(formation) {
    updateSquad(prev => {
      const startingXI = autoXI(prev.players, formation, byId)
      const bench = sortBench(prev.players.filter(id => !startingXI.includes(id)), byId)
      return {
        ...prev, formation, startingXI, bench,
        captain: prev.captain && startingXI.includes(prev.captain) ? prev.captain : prev.captain,
        vice: prev.vice && startingXI.includes(prev.vice) ? prev.vice : prev.vice,
      }
    })
  }

  const f = { GK: 1, ...FORMATIONS[squad.formation] }
  const xiByPos = { GK: [], DEF: [], MID: [], FWD: [] }
  squad.startingXI.forEach(id => { if (byId[id]) xiByPos[byId[id].pos].push(id) })
  const benchSlots = Array.from({ length: Math.max(4, squad.bench.length) }, (_, i) => squad.bench[i] || null)

  return (
    <div className="fpl-pick">
      {/* LEFT — the user's squad laid out by position */}
      <div className="fpl-pick-team">
        <div className="fpl-pick-bar">
          <label className="fpl-md">Formation
            <select className="fpl-select" value={squad.formation} onChange={e => changeFormation(e.target.value)}>
              {Object.keys(FORMATIONS).map(fm => <option key={fm} value={fm}>{fm}</option>)}
            </select>
          </label>
          <span className="fpl-pick-bar-stats">
            <span className="fpl-chip"><strong>${remaining.toFixed(1)}m</strong> Budget</span>
            <span className="fpl-chip"><strong>{squad.players.length}/15</strong> Selected</span>
          </span>
        </div>

        {/* Starting XI on the pitch */}
        <div className="fpl-pitch fpl-squad-grid">
          {POSITIONS.map(pos => {
            const slots = Array.from({ length: f[pos] }, (_, i) => xiByPos[pos][i] || null)
            return (
              <div key={pos} className="fpl-pitch-line">
                {slots.map((id, i) => id ? (
                  <SquadSlot key={id} p={byId[id]} cap={squad.captain === id} vice={squad.vice === id} onClick={() => remove(id)} />
                ) : (
                  <EmptySlot key={`${pos}-${i}`} pos={pos} onClick={() => setPosFilter(pos)} />
                ))}
              </div>
            )
          })}
        </div>

        {/* Substitutes bench (4) */}
        <div className="fpl-subs">
          <h3 className="fpl-subs-title">Substitutes <span>· bench goal/assist scores 3×</span></h3>
          <div className="fpl-subs-row">
            {benchSlots.map((id, i) => id ? (
              <SquadSlot key={id} p={byId[id]} sub onClick={() => remove(id)} />
            ) : (
              <EmptySlot key={`sub-${i}`} pos="SUB" onClick={() => {}} />
            ))}
          </div>
        </div>

        <div className="fpl-key">
          <span className="fpl-key-title">Key</span>
          <span><span className="fpl-dot ok" /> Available</span>
          <span><span className="fpl-dot warn" /> Injured / Suspended</span>
          <span><span className="fpl-dot out" /> Eliminated</span>
          <span className="fpl-key-note">Tap a player to remove · captain (C) / vice (V) set in My Team</span>
        </div>
      </div>

      {/* RIGHT — live FIFA player pool */}
      <div className="fpl-pool">
        <div className="fpl-pool-head">
          <h2>Player Pool</h2>
          <span className="fpl-pool-live">● LIVE FIFA</span>
        </div>
        <input className="fpl-input" placeholder="Search player…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="fpl-pool-filters">
          <select className="fpl-select" value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
            <option value="">Team: All</option>
            {countries.map(c => <option key={c} value={c}>{teamName(c)}</option>)}
          </select>
          <select className="fpl-select" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
            <option value="ALL">Position: All</option>
            {POSITIONS.map(p => <option key={p} value={p}>{POS_LABEL[p]}</option>)}
          </select>
          <select className="fpl-select" value={statId} onChange={e => setStatId(e.target.value)}>
            {STAT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="fpl-pool-list">
          {list.map(p => {
            const picked = squad.players.includes(p.id)
            const reason = picked ? null : blockReason(p, squad, byId, stage.countryLimit)
            const statusCls = p.eliminated ? 'out' : !p.available ? 'warn' : 'ok'
            return (
              <div key={p.id} className={`fpl-pool-row${picked ? ' picked' : ''}`}>
                <span className={`fpl-dot ${statusCls}`} />
                <span className="fpl-pool-flag">{flag(p.country)}</span>
                <div className="fpl-pool-main">
                  <span className="fpl-pool-name">{p.name}{p.oneToWatch ? ' ⭐' : ''}</span>
                  <span className="fpl-pool-meta">{POS_SHORT[p.pos]} · {p.country}{p.club ? ` · ${p.club}` : ''}{p.eliminated ? ' · OUT' : ''}</span>
                </div>
                <span className="fpl-pool-stat">{stat.fmt(p)}</span>
                <button className={`fpl-player-btn${picked ? ' remove' : ''}`}
                  onClick={() => picked ? remove(p.id) : add(p)}
                  title={picked ? 'Remove' : reason || 'Add'}>
                  {picked ? '−' : '+'}
                </button>
              </div>
            )
          })}
          {list.length === 0 && <p className="fpl-empty">No players match those filters.</p>}
          {list.length === 200 && <p className="fpl-muted fpl-pool-more">Showing top 200 — refine with search/filters.</p>}
        </div>
      </div>
    </div>
  )
}

function SquadSlot({ p, cap, vice, sub, onClick }) {
  const statusCls = p.eliminated ? 'out' : !p.available ? 'warn' : 'ok'
  return (
    <button className={`fpl-slot filled${sub ? ' is-sub' : ''}`} onClick={onClick} title={`${p.name}${p.club ? ` · ${p.club}` : ''} — tap to remove`}>
      <span className={`fpl-dot ${statusCls} fpl-slot-status`} />
      {cap && <span className="fpl-pp-badge cap fpl-slot-badge">C</span>}
      {vice && <span className="fpl-pp-badge vice fpl-slot-badge">V</span>}
      <div className="fpl-slot-shirt" style={{ '--c': TEAMS[p.country]?.color || '#888' }}>
        <span className="fpl-slot-flag">{flag(p.country)}</span>
      </div>
      <span className="fpl-slot-name">{p.name.split(' ').slice(-1)[0]}</span>
      <span className="fpl-slot-club">{p.club || teamName(p.country)}</span>
      <span className="fpl-slot-price">${p.price.toFixed(1)}m</span>
    </button>
  )
}

function EmptySlot({ pos, onClick }) {
  return (
    <button className="fpl-slot empty" onClick={onClick} title={pos === 'SUB' ? 'Substitute' : `Add a ${POS_LABEL[pos]?.slice(0, -1) || pos}`}>
      <span className="fpl-slot-plus">＋</span>
      <span className="fpl-slot-pos">{pos === 'SUB' ? 'SUB' : POS_SHORT[pos]}</span>
    </button>
  )
}

// ── Pitch / team management ──────────────────────────────────────────────────
function PitchView({ squad, updateSquad, byId, complete, notify }) {
  const [swapSel, setSwapSel] = useState(null)
  const placed = squad.startingXI.length === 11
  const rouletteOn = squad.rouletteActivated

  function generate(formation = squad.formation) {
    const newXI = autoXI(squad.players, formation, byId)
    const newBench = squad.players.filter(id => !newXI.includes(id))
    newBench.sort((a, b) => {
      const ga = byId[a].pos === 'GK', gb = byId[b].pos === 'GK'
      if (ga !== gb) return ga ? 1 : -1
      return byId[b].price - byId[a].price
    })
    updateSquad(prev => ({
      ...prev, formation, startingXI: newXI, bench: newBench,
      captain: !rouletteOn && prev.captain && newXI.includes(prev.captain) ? prev.captain : (rouletteOn ? null : newXI[0] || null),
      vice: !rouletteOn && prev.vice && newXI.includes(prev.vice) ? prev.vice : (rouletteOn ? null : newXI[1] || null),
    }))
  }

  function setRole(id, role) {
    if (rouletteOn) { notify("Captain's Roulette is active — captain is chosen randomly"); return }
    updateSquad(prev => role === 'captain'
      ? { ...prev, captain: id, vice: prev.vice === id ? prev.captain : prev.vice }
      : { ...prev, vice: id, captain: prev.captain === id ? prev.vice : prev.captain })
  }

  function clickStarter(id) {
    if (!swapSel) return
    if (byId[swapSel].pos !== byId[id].pos) { setSwapSel(null); return }
    updateSquad(prev => ({
      ...prev,
      startingXI: prev.startingXI.map(x => x === id ? swapSel : x),
      bench: prev.bench.map(b => b === swapSel ? id : b),
      captain: prev.captain === id ? swapSel : prev.captain,
      vice: prev.vice === id ? swapSel : prev.vice,
    }))
    setSwapSel(null)
  }

  if (!complete) return (
    <div className="fpl-pitch-empty">
      <p>Pick all 15 players in the <strong>Squad</strong> tab to manage your team.</p>
      <p className="fpl-muted">{squad.players.length}/15 selected.</p>
    </div>
  )

  const lines = { GK: [], DEF: [], MID: [], FWD: [] }
  squad.startingXI.forEach(id => lines[byId[id].pos].push(id))

  return (
    <div className="fpl-team">
      <div className="fpl-team-controls">
        <label className="fpl-field"><span>Formation</span>
          <select className="fpl-select" value={squad.formation} onChange={e => generate(e.target.value)}>
            {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <button className="fpl-btn" onClick={() => generate()}>{placed ? 'Auto-pick XI' : 'Generate Starting XI'}</button>
        {rouletteOn && <span className="fpl-swap-hint">🎲 Roulette active — no manual captain.</span>}
        {swapSel && <span className="fpl-swap-hint">Tap a {POS_SHORT[byId[swapSel].pos]} to swap in {byId[swapSel].name}. <button className="fpl-link" onClick={() => setSwapSel(null)}>cancel</button></span>}
      </div>

      {placed ? (
        <>
          <div className="fpl-pitch">
            {POSITIONS.map(pos => (
              <div key={pos} className="fpl-pitch-line">
                {lines[pos].map(id => (
                  <PitchPlayer key={id} id={id} squad={squad} byId={byId} rouletteOn={rouletteOn} onSetRole={setRole}
                    swappable={!!swapSel && byId[swapSel].pos === pos} onSwapClick={() => clickStarter(id)} />
                ))}
              </div>
            ))}
          </div>
          <div className="fpl-bench">
            <h3 className="fpl-bench-title">Bench <span>(Super-Sub: bench goal/assist scores 3×)</span></h3>
            <div className="fpl-bench-row">
              {squad.bench.map((id, i) => {
                const p = byId[id]
                return (
                  <button key={id} className={`fpl-bench-card${swapSel === id ? ' sel' : ''}`} onClick={() => setSwapSel(swapSel === id ? null : id)}>
                    <span className="fpl-bench-num">{p.pos === 'GK' ? 'GK' : i + 1}</span>
                    <span className="fpl-bench-flag">{flag(p.country)}</span>
                    <span className="fpl-bench-name">{p.name}</span>
                    <span className={`fpl-player-pos pos-${p.pos}`}>{POS_SHORT[p.pos]}</span>
                  </button>
                )
              })}
            </div>
            <p className="fpl-muted fpl-bench-hint">Tap a bench player, then a same-position starter to swap.</p>
          </div>
        </>
      ) : <p className="fpl-muted" style={{ textAlign: 'center', padding: '2rem' }}>Generate your starting XI to view the pitch.</p>}
    </div>
  )
}

function PitchPlayer({ id, squad, byId, rouletteOn, onSetRole, swappable, onSwapClick }) {
  const p = byId[id]
  const isC = squad.captain === id, isV = squad.vice === id
  return (
    <div className={`fpl-pp${swappable ? ' swappable' : ''}`} onClick={swappable ? onSwapClick : undefined}>
      <div className="fpl-pp-shirt" style={{ '--c': TEAMS[p.country]?.color || '#888' }}>
        {isC && <span className="fpl-pp-badge cap">C</span>}
        {isV && <span className="fpl-pp-badge vice">V</span>}
        <span className="fpl-pp-flag">{flag(p.country)}</span>
      </div>
      <span className="fpl-pp-name">{p.name.split(' ').slice(-1)[0]}</span>
      <span className="fpl-pp-price">${p.price.toFixed(1)}M</span>
      {!swappable && !rouletteOn && (
        <div className="fpl-pp-roles">
          <button className={`fpl-role${isC ? ' on' : ''}`} onClick={() => onSetRole(id, 'captain')} title="Captain (2×)">C</button>
          <button className={`fpl-role${isV ? ' on' : ''}`} onClick={() => onSetRole(id, 'vice')} title="Vice-captain">V</button>
        </div>
      )}
    </div>
  )
}

// ── Boosters ─────────────────────────────────────────────────────────────────
function Boosters({ squad, updateSquad }) {
  return (
    <div className="fpl-boosters">
      <div className="fpl-boost-head">
        <h2>Booster Inventory</h2>
        <p className="fpl-muted">Captain's Roulette is saved with your squad. Other boosters are informational in this build.</p>
      </div>
      <div className="fpl-boost-grid">
        {BOOSTERS.map(b => {
          const isRoulette = b.id === 'captainRoulette'
          const active = isRoulette && squad.rouletteActivated
          return (
            <div key={b.id} className={`fpl-boost-card${active ? ' active' : ''}${!isRoulette ? ' locked' : ''}`}>
              <div className="fpl-boost-top"><span className="fpl-boost-icon">{b.icon}</span><span className="fpl-boost-mult">{b.multiplier}</span></div>
              <h3 className="fpl-boost-name">{b.name}</h3>
              {b.limit && <span className="fpl-boost-limit">{b.limit}</span>}
              <p className="fpl-boost-desc">{b.desc}</p>
              {isRoulette ? (
                <button className={`fpl-btn fpl-boost-btn${active ? ' on' : ''}`}
                  onClick={() => updateSquad(prev => ({ ...prev, rouletteActivated: !prev.rouletteActivated, captain: !prev.rouletteActivated ? null : prev.captain, vice: !prev.rouletteActivated ? null : prev.vice }))}>
                  {active ? '✓ Activated' : 'Activate this round'}
                </button>
              ) : <button className="fpl-btn fpl-boost-btn" disabled>Informational</button>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Mini-leagues ─────────────────────────────────────────────────────────────
function Leagues({ auth, notify }) {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('league_members')
      .select('role, leagues ( id, name, invite_code, is_global, creator_id )')
      .eq('user_id', auth.user.id)
    setLeagues((data || []).map(r => ({ ...r.leagues, role: r.role })).filter(Boolean))
    setLoading(false)
  }, [auth.user.id])

  React.useEffect(() => { load() }, [load])

  async function create() {
    if (!name.trim()) return
    setBusy(true)
    const { data: lg, error } = await supabase.rpc('create_league', { p_name: name.trim() })
    if (error) { notify(`Create failed: ${error.message}`); setBusy(false); return }
    setName(''); notify(`League created — invite code ${lg.invite_code}`); await load(); setBusy(false)
  }

  async function join() {
    const clean = code.trim().toUpperCase()
    if (clean.length !== 7) { notify('Enter a 7-character code'); return }
    setBusy(true)
    const { data: lg, error } = await supabase.rpc('join_league', { p_code: clean })
    if (error) notify(/no league/i.test(error.message) ? 'No league found for that code' : `Join failed: ${error.message}`)
    else { notify(`Joined ${lg.name}`); setCode('') }
    await load(); setBusy(false)
  }

  return (
    <div className="fpl-leagues">
      <div className="fpl-league-panels">
        <div className="fpl-league-panel">
          <h3>Create a mini-league</h3>
          <input className="fpl-input" placeholder="League name" value={name} onChange={e => setName(e.target.value)} />
          <button className="fpl-btn" onClick={create} disabled={busy || !name.trim()}>Create</button>
        </div>
        <div className="fpl-league-panel">
          <h3>Join with a code</h3>
          <input className="fpl-input" placeholder="7-char code" maxLength={7} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
          <button className="fpl-btn" onClick={join} disabled={busy || code.length !== 7}>Join</button>
        </div>
      </div>

      <h3 className="fpl-league-list-title">Your leagues</h3>
      {loading ? <p className="fpl-muted">Loading…</p> : (
        <div className="fpl-league-list">
          {leagues.map(l => (
            <div key={l.id} className="fpl-league-row">
              <span className="fpl-league-name">{l.is_global ? '🌍 ' : '🏆 '}{l.name}</span>
              {!l.is_global && l.invite_code && <code className="fpl-league-code">{l.invite_code}</code>}
              <span className={`fpl-league-role role-${l.role}`}>{l.role}</span>
            </div>
          ))}
          {leagues.length === 0 && <p className="fpl-muted">You're not in any leagues yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ auth }) {
  const [scope, setScope] = useState('global')
  const [leagues, setLeagues] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    supabase.from('league_members').select('leagues ( id, name, is_global )').eq('user_id', auth.user.id)
      .then(({ data }) => setLeagues((data || []).map(r => r.leagues).filter(l => l && !l.is_global)))
  }, [auth.user.id])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data: board } = await supabase.from('leaderboard').select('user_id, username, total_points').order('total_points', { ascending: false })
      let result = board || []
      if (scope !== 'global') {
        const { data: members } = await supabase.from('league_members').select('user_id').eq('league_id', scope)
        const set = new Set((members || []).map(m => m.user_id))
        result = result.filter(r => set.has(r.user_id))
      }
      if (!cancelled) { setRows(result.slice(0, 100)); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [scope, auth.user.id])

  return (
    <div className="fpl-leaderboard">
      <div className="fpl-lb-scope">
        <button className={`fpl-pos-tab${scope === 'global' ? ' active' : ''}`} onClick={() => setScope('global')}>🌍 Global</button>
        {leagues.map(l => (
          <button key={l.id} className={`fpl-pos-tab${scope === l.id ? ' active' : ''}`} onClick={() => setScope(l.id)}>🏆 {l.name}</button>
        ))}
      </div>
      {loading ? <p className="fpl-muted">Loading…</p> : (
        <table className="fpl-lb-table">
          <thead><tr><th>#</th><th>Manager</th><th>Points</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user_id} className={r.user_id === auth.user.id ? 'me' : ''}>
                <td>{i + 1}</td><td>{r.username}{r.user_id === auth.user.id ? ' (you)' : ''}</td><td className="fpl-lb-pts">{r.total_points}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="fpl-muted" style={{ padding: '1rem' }}>No managers yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Rules ────────────────────────────────────────────────────────────────────
function RulesPanel() {
  return (
    <div className="fpl-rules">
      <section className="fpl-rule-block">
        <h2>Squad & core constraints</h2>
        <ul>
          <li><strong>15-man squad:</strong> {SQUAD.GK} GK · {SQUAD.DEF} DEF · {SQUAD.MID} MID · {SQUAD.FWD} FWD.</li>
          <li><strong>Flat-cap budget:</strong> ${BUDGET}M, locked all tournament — no knockout bump.</li>
          <li><strong>United Clubs:</strong> no two squad players from the same real-life club — enforced wherever club data is known (shown on each player; the FIFA feed itself has no club field, so it's supplemented from our database).</li>
          <li><strong>Transfers:</strong> unlimited & free before every round (each matchday is its own squad).</li>
          <li><strong>Live data:</strong> players, prices &amp; points come straight from FIFA and refresh after every match.</li>
        </ul>
        <h3>Country limits per stage</h3>
        <div className="fpl-stage-grid">
          {STAGES.map(s => <div key={s.id} className="fpl-stage-chip"><strong>{s.countryLimit}</strong><span>{s.label}</span></div>)}
        </div>
      </section>
      <section className="fpl-rule-block">
        <h2>Matchday & Super-Sub</h2>
        <p>11 starters + 4 bench. Auto-subs replace DNP starters while keeping a valid formation.</p>
        <p className="fpl-supersub">{SUPER_SUB_NOTE}</p>
      </section>
      <section className="fpl-rule-block">
        <h2>Boosters</h2>
        <ul>{BOOSTERS.map(b => <li key={b.id}><strong>{b.icon} {b.name}</strong> ({b.multiplier}{b.limit ? ` · ${b.limit}` : ''}) — {b.desc}</li>)}</ul>
      </section>
      <section className="fpl-rule-block">
        <h2>Scoring matrix</h2>
        <div className="fpl-score-grid">
          <ScoreTable title="All players" rows={SCORING.all} />
          <ScoreTable title="Goalkeepers" rows={SCORING.GK} />
          <ScoreTable title="Defenders" rows={SCORING.DEF} />
          <ScoreTable title="Midfielders" rows={SCORING.MID} />
          <ScoreTable title="Forwards" rows={SCORING.FWD} />
          <ScoreTable title="Bonuses" rows={SCORING.bonus} />
        </div>
      </section>
    </div>
  )
}

function ScoreTable({ title, rows }) {
  return (
    <div className="fpl-score-table">
      <h3>{title}</h3>
      <table><tbody>
        {rows.map((r, i) => <tr key={i}><td>{r.label}</td><td className={r.pts.startsWith('-') ? 'neg' : 'pos'}>{r.pts}</td></tr>)}
      </tbody></table>
    </div>
  )
}
