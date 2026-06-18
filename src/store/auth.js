import { reactive, readonly } from 'vue'
import { db } from '../services/db'

const state = reactive({
  user: null, // current profile, or null
  ready: false
})

export async function initAuth() {
  try {
    state.user = await db.getSession()
  } catch {
    state.user = null
  } finally {
    state.ready = true
  }
}

export async function signUp(payload) {
  state.user = await db.signUp(payload)
  return state.user
}

export async function signIn(payload) {
  state.user = await db.signIn(payload)
  return state.user
}

export async function signOut() {
  await db.signOut()
  state.user = null
}

export async function saveProfile(patch) {
  if (!state.user) throw new Error('Not signed in.')
  state.user = await db.updateProfile(state.user.id, patch)
  return state.user
}

export const auth = readonly(state)
