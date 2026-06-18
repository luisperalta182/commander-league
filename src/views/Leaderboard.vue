<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../services/db'
import { buildLeaderboard, POINTS_WIN, POINTS_PLAYED } from '../services/scoring'
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
  <p class="muted">{{ POINTS_WIN }} puntos por victoria · {{ POINTS_PLAYED }} punto por partida jugada.</p>

  <div v-if="loading" class="empty">Cargando…</div>
  <div v-else-if="ranked.length === 0" class="empty">Aún no hay partidas registradas. La tabla aparece cuando lleguen los resultados.</div>

  <div v-else class="card" style="padding: 6px 8px">
    <table>
      <thead>
        <tr>
          <th style="width:48px">#</th>
          <th>Jugador</th>
          <th class="num">Pts</th>
          <th class="num">V</th>
          <th class="num">PJ</th>
          <th class="num">% Vict.</th>
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
          <td class="num">{{ r.games }}</td>
          <td class="num">{{ Math.round(r.winRate * 100) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
