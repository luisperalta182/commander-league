<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../services/db'
import Avatar from '../components/Avatar.vue'

const players = ref([])
const loading = ref(true)

onMounted(async () => {
  players.value = await db.listPlayers()
  loading.value = false
})
</script>

<template>
  <h1>Jugadores</h1>
  <p class="muted">Todos los que se han unido a la liga.</p>

  <div v-if="loading" class="empty">Cargando…</div>
  <div v-else-if="players.length === 0" class="empty">Aún no hay jugadores. ¡Sé el primero en unirte!</div>

  <div v-else class="grid cols-2">
    <div v-for="p in players" :key="p.id" class="card player">
      <Avatar :name="p.displayName" :color="p.color" :size="52" />
      <div class="info">
        <div class="row" style="gap:8px">
          <strong>{{ p.displayName }}</strong>
          <span v-if="p.isAdmin" class="badge">👑 Organizador</span>
        </div>
        <div class="muted">{{ p.commander || 'Sin comandante definido' }}</div>
        <p v-if="p.bio" class="bio muted">{{ p.bio }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player { display: flex; gap: 14px; align-items: flex-start; }
.info { min-width: 0; }
.bio { margin: 6px 0 0; font-size: .88rem; }
</style>
