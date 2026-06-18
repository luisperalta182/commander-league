<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../services/db'
import { auth } from '../store/auth'
import Avatar from '../components/Avatar.vue'

const players = ref([])
const loading = ref(true)
const error = ref('')
const busyId = ref(null)

const isAdmin = computed(() => auth.user?.isAdmin)

async function load() {
  players.value = await db.listPlayers()
  loading.value = false
}
onMounted(load)

async function toggleAdmin(p) {
  error.value = ''
  const makeAdmin = !p.isAdmin
  if (!makeAdmin && !confirm(`¿Quitar el rol de organizador a ${p.displayName}?`)) return
  busyId.value = p.id
  try {
    await db.setAdmin(p.id, makeAdmin)
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    busyId.value = null
  }
}

async function removePlayer(p) {
  error.value = ''
  if (!confirm(`¿Eliminar a ${p.displayName} de la liga? Sus partidas pasadas quedarán como "Desconocido".`)) return
  busyId.value = p.id
  try {
    await db.deletePlayer(p.id)
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <h1>Jugadores</h1>
  <p class="muted">Todos los que se han unido a la liga.</p>
  <div v-if="isAdmin" class="alert info">👑 Como organizador puedes nombrar a otros organizadores o eliminar participantes.</div>
  <div v-if="error" class="alert err">{{ error }}</div>

  <div v-if="loading" class="empty">Cargando…</div>
  <div v-else-if="players.length === 0" class="empty">Aún no hay jugadores. ¡Sé el primero en unirte!</div>

  <div v-else class="grid cols-2">
    <div v-for="p in players" :key="p.id" class="card player">
      <Avatar :name="p.displayName" :color="p.color" :size="52" />
      <div class="info">
        <div class="row" style="gap:8px">
          <strong>{{ p.displayName }}</strong>
          <span v-if="p.isAdmin" class="badge">👑 Organizador</span>
          <span v-if="p.id === auth.user?.id" class="badge">tú</span>
        </div>
        <div class="muted">{{ p.commander || 'Sin comandante definido' }}</div>
        <p v-if="p.bio" class="bio muted">{{ p.bio }}</p>

        <div v-if="isAdmin && p.id !== auth.user?.id" class="actions">
          <button class="btn ghost sm" :disabled="busyId === p.id" @click="toggleAdmin(p)">
            {{ p.isAdmin ? 'Quitar organizador' : 'Hacer organizador' }}
          </button>
          <button class="btn danger sm" :disabled="busyId === p.id" @click="removePlayer(p)">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player { display: flex; gap: 14px; align-items: flex-start; }
.info { min-width: 0; flex: 1; }
.bio { margin: 6px 0 0; font-size: .88rem; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
</style>
