<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../services/db'
import { buildLeaderboard } from '../services/scoring'
import Avatar from '../components/Avatar.vue'

const loading = ref(true)
const rows = ref([])

onMounted(async () => {
  const [players, days] = await Promise.all([db.listPlayers(), db.listMatchDays()])
  rows.value = buildLeaderboard(players, days)
  loading.value = false
})

const ranked = computed(() => rows.value.filter((r) => r.games > 0))
const medal = (i) => ['🥇', '🥈', '🥉'][i] || ''
</script>

<template>
  <h1>Clasificación</h1>
  <p class="muted">
    Total = 1 por participar (siempre) + 1.º +5 / 2.º +2 + 💀 eliminaciones + 🏅 logros + 🎴 misión.
    Desempate: más logros legendarios, luego más victorias. Ver <RouterLink to="/rules">reglas</RouterLink>.
  </p>

  <div v-if="loading" class="empty">Cargando…</div>
  <div v-else-if="ranked.length === 0" class="empty">Aún no hay partidas registradas. La tabla aparece cuando lleguen los resultados.</div>

  <div v-else class="card tablewrap" style="padding: 6px 8px">
    <table>
      <thead>
        <tr>
          <th style="width:44px">#</th>
          <th>Jugador</th>
          <th class="num">Pts</th>
          <th class="num" title="Victorias (1.º lugar)">🥇</th>
          <th class="num" title="Logros (legendarios)">🏅</th>
          <th class="num" title="Eliminaciones">💀</th>
          <th class="num" title="Partidas jugadas">PJ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in ranked" :key="r.player.id">
          <td class="tag-rank">{{ medal(i) || i + 1 }}</td>
          <td>
            <div class="row" style="gap:10px">
              <Avatar :name="r.player.displayName" :color="r.player.color" :size="34" />
              <div>
                <strong>{{ r.player.displayName }}</strong>
                <div class="muted" style="font-size:.8rem">{{ r.player.commander || '—' }}</div>
              </div>
            </div>
          </td>
          <td class="num"><strong>{{ r.points }}</strong></td>
          <td class="num">{{ r.wins }}</td>
          <td class="num">{{ r.achievements }}<span v-if="r.legendary" class="leg"> ({{ r.legendary }}🟠)</span></td>
          <td class="num">{{ r.eliminations }}</td>
          <td class="num">{{ r.games }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.tablewrap { overflow-x: auto; }
.leg { color: #f59e0b; font-size: .8rem; }
</style>
