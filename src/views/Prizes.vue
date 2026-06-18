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

// Top 3 players that have actually played, ordered 2nd · 1st · 3rd for the podium.
const top3 = computed(() => rows.value.filter((r) => r.games > 0).slice(0, 3))
const podium = computed(() => {
  const t = top3.value
  return [t[1], t[0], t[2]] // left, center, right
})

const places = [
  { medal: '🥈', place: '2.º lugar', cls: 'silver', h: 130 },
  { medal: '🥇', place: '1.er lugar', cls: 'gold', h: 165 },
  { medal: '🥉', place: '3.er lugar', cls: 'bronze', h: 105 }
]
</script>

<template>
  <h1>🏆 Premios</h1>
  <p class="muted">Reconocimientos para los tres primeros lugares de la liga.</p>

  <div class="alert info soon">
    🎁 <strong>Premios próximamente.</strong>
    Masatepe The Gathering anunciará pronto los premios para el podio. ¡Sigue jugando para asegurar tu lugar!
  </div>

  <div v-if="loading" class="empty">Cargando…</div>

  <div v-else class="card">
    <h3 class="center" style="margin-bottom:22px">Podio actual</h3>

    <div v-if="top3.length === 0" class="empty">
      Aún no hay resultados. El podio aparecerá cuando se registren las primeras partidas.
    </div>

    <div v-else class="podium">
      <div v-for="(p, i) in podium" :key="i" class="slot">
        <template v-if="p">
          <Avatar :name="p.player.displayName" :color="p.player.color" :size="i === 1 ? 64 : 52" />
          <div class="pname">{{ p.player.displayName }}</div>
          <div class="ppts muted">{{ p.points }} pts</div>
          <div class="block" :class="places[i].cls" :style="{ height: places[i].h + 'px' }">
            <div class="medal">{{ places[i].medal }}</div>
            <div class="place">{{ places[i].place }}</div>
          </div>
        </template>
        <template v-else>
          <div class="avatar empty-seat">?</div>
          <div class="pname muted">Por definir</div>
          <div class="block muted-block" :style="{ height: places[i].h + 'px' }">
            <div class="medal">{{ places[i].medal }}</div>
            <div class="place">{{ places[i].place }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <p class="center muted" style="margin-top:18px">
    Mira la tabla completa en la <RouterLink to="/leaderboard">clasificación</RouterLink>.
  </p>
</template>

<style scoped>
.soon { font-size: .95rem; }
.podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.slot { display: flex; flex-direction: column; align-items: center; width: 30%; min-width: 110px; }
.pname { font-weight: 700; margin-top: 8px; text-align: center; }
.ppts { font-size: .82rem; }
.empty-seat { background: var(--panel-2); color: var(--muted); }
.block {
  margin-top: 12px;
  width: 100%;
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 14px;
  border: 1px solid var(--border);
}
.block.gold   { background: linear-gradient(180deg, rgba(227,179,65,.35), rgba(227,179,65,.08)); }
.block.silver { background: linear-gradient(180deg, rgba(203,213,225,.30), rgba(203,213,225,.06)); }
.block.bronze { background: linear-gradient(180deg, rgba(205,127,50,.32), rgba(205,127,50,.06)); }
.muted-block  { background: linear-gradient(180deg, rgba(255,255,255,.06), transparent); }
.medal { font-size: 1.8rem; }
.place { font-size: .82rem; font-weight: 700; color: var(--muted); margin-top: 4px; }
</style>
