<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { auth } from '../store/auth'
import { db } from '../services/db'
import { buildLeaderboard } from '../services/scoring'

const loading = ref(true)
const stats = ref({ players: 0, matchDays: 0, gamesPlayed: 0 })
const leader = ref(null)

onMounted(async () => {
  try {
    const [players, days] = await Promise.all([db.listPlayers(), db.listMatchDays()])
    let games = 0
    for (const d of days) for (const r of d.rounds) games += r.pods.length
    stats.value = { players: players.length, matchDays: days.length, gamesPlayed: games }
    const board = buildLeaderboard(players, days)
    leader.value = board.find((r) => r.games > 0) || null
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="hero card">
    <div class="badge" style="margin-bottom:12px">Organiza · Masatepe The Gathering</div>
    <h1>⚔️ Liga de Commander</h1>
    <p class="muted lead">
      Únete a la mesa, arma tu perfil y juega cada domingo. Dos partidas por semana,
      mesas aleatorias y una clasificación en vivo para coronar al campeón de la liga.
    </p>
    <div class="row">
      <RouterLink v-if="!auth.user" to="/register" class="btn">Unirse a la liga</RouterLink>
      <RouterLink v-else to="/calendar" class="btn">Ver jornadas</RouterLink>
      <RouterLink to="/leaderboard" class="btn ghost">Ver clasificación</RouterLink>
    </div>
  </section>

  <div class="grid cols-3" style="margin-top: 16px">
    <div class="card stat"><div class="big">{{ stats.players }}</div><div class="muted">Jugadores</div></div>
    <div class="card stat"><div class="big">{{ stats.matchDays }}</div><div class="muted">Jornadas</div></div>
    <div class="card stat"><div class="big">{{ stats.gamesPlayed }}</div><div class="muted">Partidas jugadas</div></div>
  </div>

  <div v-if="leader" class="card" style="margin-top: 16px">
    <div class="row spread">
      <div>
        <div class="muted" style="font-size:.8rem; text-transform:uppercase; letter-spacing:.5px">Líder actual</div>
        <h2 style="margin:.2em 0 0">🏆 {{ leader.player.displayName }}</h2>
        <div class="muted">{{ leader.points }} pts · {{ leader.wins }} victorias</div>
      </div>
      <RouterLink to="/leaderboard" class="btn ghost sm">Clasificación completa →</RouterLink>
    </div>
  </div>

  <div class="card" style="margin-top: 16px">
    <h3>Cómo funciona</h3>
    <ol class="how">
      <li><strong>Crea tu perfil</strong> — nombre, comandante favorito y colores.</li>
      <li><strong>Cada domingo es una jornada</strong> — el organizador genera mesas aleatorias de ~4.</li>
      <li><strong>Juega 2 partidas</strong> y reporta quién ganó cada mesa.</li>
      <li><strong>Sube en la clasificación</strong> — {{ 3 }} puntos por victoria, más un punto por participar.</li>
    </ol>
  </div>
</template>

<style scoped>
.hero { padding: 34px 26px; }
.lead { max-width: 60ch; font-size: 1.05rem; margin-bottom: 22px; }
.stat { text-align: center; }
.stat .big { font-size: 2.4rem; font-weight: 800; color: var(--primary-2); }
.how { margin: 8px 0 0; padding-left: 20px; }
.how li { margin: 8px 0; }
</style>
