// Data layer with two interchangeable backends:
//   - "local":    everything in localStorage (no setup, single-device demo)
//   - "supabase": real auth + a shared cloud database (free tier)
// The rest of the app only talks to the exported functions below, so it never
// needs to know which backend is active.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const USING_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY)
export const MODE = USING_SUPABASE ? 'supabase' : 'local'

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  's' + Math.random().toString(36).slice(2) + Date.now().toString(36)

/* ------------------------------------------------------------------ */
/*  LOCAL BACKEND                                                      */
/* ------------------------------------------------------------------ */
const K_USERS = 'cl.users'
const K_MATCHDAYS = 'cl.matchdays'
const K_SESSION = 'cl.session'

const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback }
}
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

function publicProfile(u) {
  if (!u) return null
  const { password, ...rest } = u
  return rest
}

const localBackend = {
  async getSession() {
    const id = read(K_SESSION, null)
    if (!id) return null
    const users = read(K_USERS, [])
    return publicProfile(users.find((u) => u.id === id)) || null
  },

  async signUp({ email, password, displayName }) {
    email = (email || '').trim().toLowerCase()
    const users = read(K_USERS, [])
    if (users.some((u) => u.email === email)) throw new Error('An account with that email already exists.')
    const user = {
      id: uid(),
      email,
      password, // demo only — not secure; replace with Supabase for real auth.
      displayName: displayName?.trim() || email.split('@')[0],
      commander: '',
      color: '#8b5cf6',
      bio: '',
      isAdmin: users.length === 0, // first player to join runs the league
      createdAt: new Date().toISOString()
    }
    users.push(user)
    write(K_USERS, users)
    write(K_SESSION, user.id)
    return publicProfile(user)
  },

  async signIn({ email, password }) {
    email = (email || '').trim().toLowerCase()
    const users = read(K_USERS, [])
    const user = users.find((u) => u.email === email)
    if (!user || user.password !== password) throw new Error('Wrong email or password.')
    write(K_SESSION, user.id)
    return publicProfile(user)
  },

  async signOut() {
    localStorage.removeItem(K_SESSION)
  },

  async updateProfile(id, patch) {
    const users = read(K_USERS, [])
    const i = users.findIndex((u) => u.id === id)
    if (i === -1) throw new Error('Profile not found.')
    const { isAdmin, email, id: _i, password, ...safe } = patch
    users[i] = { ...users[i], ...safe }
    write(K_USERS, users)
    return publicProfile(users[i])
  },

  async listPlayers() {
    return read(K_USERS, []).map(publicProfile)
  },

  async setAdmin(userId, isAdmin) {
    const users = read(K_USERS, [])
    const u = users.find((x) => x.id === userId)
    if (!u) throw new Error('Jugador no encontrado.')
    u.isAdmin = isAdmin
    write(K_USERS, users)
    return publicProfile(u)
  },

  async deletePlayer(userId) {
    write(K_USERS, read(K_USERS, []).filter((u) => u.id !== userId))
    if (read(K_SESSION, null) === userId) localStorage.removeItem(K_SESSION)
  },

  async listMatchDays() {
    return read(K_MATCHDAYS, []).slice().sort((a, b) => a.date.localeCompare(b.date))
  },

  async createMatchDay(matchDay) {
    const days = read(K_MATCHDAYS, [])
    days.push(matchDay)
    write(K_MATCHDAYS, days)
    return matchDay
  },

  async deleteMatchDay(id) {
    write(K_MATCHDAYS, read(K_MATCHDAYS, []).filter((d) => d.id !== id))
  },

  async setMatchDayFinished(id, finished) {
    const days = read(K_MATCHDAYS, [])
    const day = days.find((d) => d.id === id)
    if (!day) throw new Error('Match day not found.')
    day.finished = finished
    write(K_MATCHDAYS, days)
    return day
  },

  async savePod(matchDayId, roundNo, podId, data) {
    const days = read(K_MATCHDAYS, [])
    const day = days.find((d) => d.id === matchDayId)
    if (!day) throw new Error('Match day not found.')
    const round = day.rounds.find((r) => r.roundNo === roundNo)
    const pod = round?.pods.find((p) => p.id === podId)
    if (!pod) throw new Error('Pod not found.')
    pod.winnerId = data.winnerId ?? null
    pod.secondId = data.secondId ?? null
    pod.perPlayer = data.perPlayer ?? {}
    write(K_MATCHDAYS, days)
    return day
  }
}

/* ------------------------------------------------------------------ */
/*  SUPABASE BACKEND                                                   */
/* ------------------------------------------------------------------ */
let supabase = null
if (USING_SUPABASE) supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function rowToProfile(r) {
  if (!r) return null
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    commander: r.commander || '',
    color: r.color || '#8b5cf6',
    bio: r.bio || '',
    isAdmin: !!r.is_admin,
    createdAt: r.created_at
  }
}

async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return rowToProfile(data)
}

const supabaseBackend = {
  async getSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    return fetchProfile(data.session.user.id)
  },

  async signUp({ email, password, displayName }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    const user = data.user
    if (!user) throw new Error('Check your email to confirm your account, then sign in.')

    // First registered player becomes the league admin.
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const isAdmin = (count || 0) === 0

    const { error: pErr } = await supabase.from('profiles').insert({
      id: user.id,
      email,
      display_name: displayName?.trim() || email.split('@')[0],
      color: '#8b5cf6',
      is_admin: isAdmin
    })
    if (pErr) throw new Error(pErr.message)
    return fetchProfile(user.id)
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return fetchProfile(data.user.id)
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async updateProfile(id, patch) {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: patch.displayName,
        commander: patch.commander,
        color: patch.color,
        bio: patch.bio
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return fetchProfile(id)
  },

  async listPlayers() {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) throw new Error(error.message)
    return data.map(rowToProfile)
  },

  async setAdmin(userId, isAdmin) {
    const { error } = await supabase.rpc('set_admin', { target: userId, value: isAdmin })
    if (error) throw new Error(error.message)
    return fetchProfile(userId)
  },

  async deletePlayer(userId) {
    const { error } = await supabase.rpc('delete_player', { target: userId })
    if (error) throw new Error(error.message)
  },

  async listMatchDays() {
    const { data, error } = await supabase.from('match_days').select('*').order('date')
    if (error) throw new Error(error.message)
    return data.map((d) => ({ id: d.id, date: d.date, createdAt: d.created_at, finished: !!d.finished, rounds: d.rounds }))
  },

  async setMatchDayFinished(id, finished) {
    const { error } = await supabase.from('match_days').update({ finished }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async createMatchDay(matchDay) {
    const { error } = await supabase.from('match_days').insert({
      id: matchDay.id,
      date: matchDay.date,
      rounds: matchDay.rounds
    })
    if (error) throw new Error(error.message)
    return matchDay
  },

  async deleteMatchDay(id) {
    const { error } = await supabase.from('match_days').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async savePod(matchDayId, roundNo, podId, data) {
    const { data: row, error } = await supabase.from('match_days').select('*').eq('id', matchDayId).single()
    if (error) throw new Error(error.message)
    const rounds = row.rounds
    const pod = rounds.find((r) => r.roundNo === roundNo)?.pods.find((p) => p.id === podId)
    if (!pod) throw new Error('Pod not found.')
    pod.winnerId = data.winnerId ?? null
    pod.secondId = data.secondId ?? null
    pod.perPlayer = data.perPlayer ?? {}
    const { error: uErr } = await supabase.from('match_days').update({ rounds }).eq('id', matchDayId)
    if (uErr) throw new Error(uErr.message)
    return { ...row, rounds }
  }
}

const backend = USING_SUPABASE ? supabaseBackend : localBackend

export const db = backend
export default backend
