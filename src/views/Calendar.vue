<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../services/db'
import { auth } from '../store/auth'
import { buildMatchDay, upcomingSundays } from '../services/scheduler'

const players = ref([])
const matchDays = ref([])
const loading = ref(true)
const error = ref('')
const busy = ref(false)

const form = ref({
  date: upcomingSundays(new Date(), 1)[0],
  rounds: 2,
  podSize: 4
})

const isAdmin = computed(() => auth.user?.isAdmin)
const playerMap = computed(() => {
  const m = {}
  for (const p of players.value) m[p.id] = p
  return m
})

// Attendance: which players actually showed up. Defaults to everyone present.
const present = ref({}) // { [playerId]: true|false }
const presentCount = computed(() => players.value.filter((p) => present.value[p.id]).length)

function setAllPresent(value) {
  const next = {}
  for (const p of players.value) next[p.id] = value
  present.value = next
}

function name(id) { return playerMap.value[id]?.displayName || 'Desconocido' }
function color(id) { return playerMap.value[id]?.color || '#8b5cf6' }

const fmtDate = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
  })

async function load() {
  ;[players.value, matchDays.value] = await Promise.all([db.listPlayers(), db.listMatchDays()])
  // Mark anyone newly loaded as present by default, keep existing choices.
  const next = { ...present.value }
  for (const p of players.value) if (!(p.id in next)) next[p.id] = true
  present.value = next
  loading.value = false
}
onMounted(load)

async function generate() {
  error.value = ''
  const attending = players.value.filter((p) => present.value[p.id]).map((p) => p.id)
  if (attending.length < 2) {
    error.value = 'Marca al menos 2 jugadores presentes para crear una jornada.'
    return
  }
  if (matchDays.value.some((d) => d.date === form.value.date)) {
    error.value = 'Ya existe una jornada para esa fecha.'
    return
  }
  busy.value = true
  try {
    const md = buildMatchDay({
      date: form.value.date,
      playerIds: attending,
      rounds: Number(form.value.rounds),
      podSize: Number(form.value.podSize)
    })
    await db.createMatchDay(md)
    await load()
    // jump the date suggestion to the following Sunday
    form.value.date = upcomingSundays(new Date(form.value.date + 'T12:00:00'), 2)[1]
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function remove(day) {
  if (!confirm('¿Eliminar esta jornada y sus resultados?')) return
  await db.deleteMatchDay(day.id)
  await load()
}

async function pickWinner(day, round, pod, playerId) {
  if (!isAdmin.value) return
  await db.setWinner(day.id, round.roundNo, pod.id, playerId)
  await load()
}
</script>

<template>
  <div class="row spread">
    <div>
      <h1>Calendario de jornadas</h1>
      <p class="muted">Dos partidas cada domingo. Las mesas se sortean al azar.</p>
    </div>
  </div>

  <div v-if="isAdmin" class="card admin">
    <h3>Generar una jornada del domingo 👑</h3>
    <div v-if="error" class="alert err">{{ error }}</div>
    <div class="controls">
      <div>
        <label>Fecha</label>
        <input v-model="form.date" type="date" />
      </div>
      <div>
        <label>Partidas (rondas)</label>
        <input v-model.number="form.rounds" type="number" min="1" max="6" />
      </div>
      <div>
        <label>Tamaño de mesa</label>
        <input v-model.number="form.podSize" type="number" min="2" max="6" />
      </div>
      <button class="btn" style="align-self:end" :disabled="busy" @click="generate">
        {{ busy ? 'Sorteando mesas…' : 'Generar' }}
      </button>
    </div>

    <div class="attendance">
      <div class="row spread" style="margin-bottom:10px">
        <strong>¿Quiénes asistieron?</strong>
        <div class="row" style="gap:8px">
          <button type="button" class="btn ghost sm" @click="setAllPresent(true)">Todos</button>
          <button type="button" class="btn ghost sm" @click="setAllPresent(false)">Ninguno</button>
        </div>
      </div>
      <div v-if="players.length === 0" class="muted">Aún no hay jugadores registrados.</div>
      <div v-else class="att-grid">
        <label v-for="p in players" :key="p.id" class="att-item" :class="{ off: !present[p.id] }">
          <input type="checkbox" v-model="present[p.id]" />
          <span class="dot" :style="{ background: p.color }"></span>
          <span class="att-name">{{ p.displayName }}</span>
        </label>
      </div>
    </div>

    <p class="muted" style="font-size:.82rem; margin-bottom:0">
      Se repartirán <strong>{{ presentCount }}</strong> jugador{{ presentCount === 1 ? '' : 'es' }} presente{{ presentCount === 1 ? '' : 's' }} en mesas aleatorias. Quienes no marques quedan fuera de esta jornada.
    </p>
  </div>
  <div v-else-if="auth.user" class="alert info">Solo el organizador de la liga puede generar jornadas y registrar resultados.</div>
  <div v-else class="alert info">
    <RouterLink to="/login">Inicia sesión</RouterLink> para participar. El calendario de abajo es visible para todos.
  </div>

  <div v-if="loading" class="empty">Cargando…</div>
  <div v-else-if="matchDays.length === 0" class="empty">Aún no hay jornadas programadas.</div>

  <div v-else class="days">
    <div v-for="day in matchDays" :key="day.id" class="card day">
      <div class="row spread">
        <h2 style="margin:0">📅 {{ fmtDate(day.date) }}</h2>
        <button v-if="isAdmin" class="btn danger sm" @click="remove(day)">Eliminar</button>
      </div>

      <div v-for="round in day.rounds" :key="round.roundNo" class="round">
        <div class="round-title">Partida {{ round.roundNo }}</div>
        <div class="pods">
          <div v-for="(pod, pi) in round.pods" :key="pod.id" class="pod">
            <div class="pod-head">Mesa {{ pi + 1 }}</div>
            <ul class="seats">
              <li
                v-for="pid in pod.players" :key="pid"
                class="seat"
                :class="{ winner: pod.winnerId === pid, clickable: isAdmin }"
                @click="pickWinner(day, round, pod, pid)"
              >
                <span class="dot" :style="{ background: color(pid) }"></span>
                <span class="seat-name">{{ name(pid) }}</span>
                <span v-if="pod.winnerId === pid" class="badge win">🏆 Ganó</span>
              </li>
            </ul>
            <div v-if="isAdmin && !pod.winnerId" class="hint muted">Toca a un jugador para marcar al ganador</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin { margin-bottom: 18px; }
.controls {
  display: grid;
  grid-template-columns: 1.4fr .8fr .8fr auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 8px;
}
.controls label { margin-top: 0; }
@media (max-width: 640px) { .controls { grid-template-columns: 1fr 1fr; } }

.attendance {
  margin: 16px 0;
  padding: 14px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.att-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
.att-item {
  display: flex; align-items: center; gap: 9px;
  margin: 0; padding: 8px 10px;
  background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; user-select: none; font-size: .9rem;
}
.att-item input { width: auto; margin: 0; cursor: pointer; accent-color: var(--primary); }
.att-item.off { opacity: .5; }
.att-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.days { display: grid; gap: 16px; }
.round { margin-top: 16px; }
.round-title {
  font-size: .8rem; text-transform: uppercase; letter-spacing: .5px;
  color: var(--muted); margin-bottom: 8px;
}
.pods { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.pod { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.pod-head { font-weight: 700; margin-bottom: 8px; }
.seats { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.seat {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 9px; border-radius: 8px;
  border: 1px solid transparent;
}
.seat.clickable { cursor: pointer; }
.seat.clickable:hover { background: var(--panel-2); }
.seat.winner { background: rgba(74, 222, 128, .12); border-color: rgba(74,222,128,.4); }
.dot { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.seat-name { flex: 1; min-width: 0; }
.hint { font-size: .76rem; margin-top: 8px; }
</style>
