<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../services/db'
import { auth } from '../store/auth'

const COLORS = ['#8b5cf6', '#ef4444', '#22c55e', '#3b82f6', '#e3b341', '#ec4899', '#14b8a6', '#f97316', '#a78bfa', '#f472b6']
const CX = 150, CY = 150, R = 145

const participants = ref([])
const winners = ref([])
const currentRound = ref(1)
const loading = ref(true)
const rotation = ref(0)
const spinning = ref(false)
const announce = ref(null)
const error = ref('')

const isAdmin = computed(() => auth.user?.isAdmin)

async function load() {
  const [parts, wins, state] = await Promise.all([
    db.listFestParticipants(),
    db.listFestWinners(),
    db.getFestState()
  ])
  participants.value = parts
  winners.value = wins
  currentRound.value = state.currentRound
  loading.value = false
}
onMounted(load)

// Ya ganaron EN ESTA ronda (salen de la rueda hasta que se abra una nueva).
const wonThisRound = computed(() => new Set(winners.value.filter((w) => w.round === currentRound.value).map((w) => w.participantId)))
const remaining = computed(() => participants.value.filter((p) => !wonThisRound.value.has(p.id)))

// Ganadores agrupados por ronda (Ronda 1, Ronda 2, …).
const winnersByRound = computed(() => {
  const map = new Map()
  for (const w of winners.value) {
    if (!map.has(w.round)) map.set(w.round, [])
    map.get(w.round).push(w)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([round, list]) => ({ round, list }))
})

function polar(radius, angleDeg) {
  const a = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.sin(a), y: CY - radius * Math.cos(a) }
}

const segments = computed(() => {
  const list = remaining.value
  const n = list.length
  if (n === 0) return []
  const seg = 360 / n
  return list.map((p, i) => {
    const a0 = i * seg
    const a1 = (i + 1) * seg
    const p0 = polar(R, a0)
    const p1 = polar(R, a1)
    const large = seg > 180 ? 1 : 0
    const mid = a0 + seg / 2
    const lp = polar(R * 0.62, mid)
    let rot = mid
    if (mid > 90 && mid < 270) rot += 180
    const font = Math.max(7, Math.min(13, 300 / n))
    return {
      id: p.id,
      color: COLORS[i % COLORS.length],
      path: `M ${CX} ${CY} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`,
      lx: lp.x, ly: lp.y, rot, font,
      label: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name
    }
  })
})

async function spin() {
  if (spinning.value || !isAdmin.value) return
  const n = remaining.value.length
  if (n < 1) return
  spinning.value = true
  announce.value = null
  error.value = ''

  const idx = Math.floor(Math.random() * n)
  const chosen = remaining.value[idx]
  const seg = 360 / n
  const center = idx * seg + seg / 2
  const base = Math.ceil((rotation.value + 1) / 360) * 360
  rotation.value = base + 360 * 6 + (360 - center)

  setTimeout(async () => {
    try {
      await db.addFestWinner(chosen, currentRound.value)
      await load()
      announce.value = chosen.name
    } catch (e) {
      error.value = e.message
    } finally {
      spinning.value = false
    }
  }, 4700)
}

async function newRound() {
  if (!isAdmin.value || spinning.value) return
  if (!confirm(`¿Abrir la Ronda ${currentRound.value + 1}? Todos los inscritos vuelven a la tómbola para nuevos premios.`)) return
  error.value = ''
  try {
    await db.newFestRound()
    announce.value = null
    await load()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="row spread">
    <div>
      <h1>🎡 Rifa del Mondongo Fest</h1>
      <p class="muted">¡Muchos premios por sortear! Gira la rueda y que la suerte pinolera decida.</p>
    </div>
    <RouterLink to="/fest" class="btn ghost sm">← Volver al Fest</RouterLink>
  </div>

  <div v-if="error" class="alert err">{{ error }}</div>
  <div v-if="announce" class="alert ok winner-banner">🎉 ¡Felicidades <strong>{{ announce }}</strong>! Pasa a reclamar tu premio 🏆</div>

  <div v-if="loading" class="empty">Cargando…</div>

  <div v-else class="wheel-wrap card">
    <div class="round-tag">🎯 Ronda actual: <strong>{{ currentRound }}</strong></div>

    <div v-if="participants.length === 0" class="empty">
      Aún no hay inscritos. Comparte el <RouterLink to="/fest">Mondongo Fest</RouterLink> para que se apunten.
    </div>

    <template v-else>
      <div v-if="remaining.length === 0" class="empty allwon">
        🎊 ¡Todos los inscritos ya ganaron un premio en la Ronda {{ currentRound }}!
        <span v-if="isAdmin">Abre una nueva ronda para seguir rifando.</span>
      </div>

      <div v-else class="wheel-box">
        <div class="pointer">▼</div>
        <svg viewBox="0 0 300 300" class="wheel">
          <g class="wheel-rot" :style="{ transform: `rotate(${rotation}deg)` }">
            <path v-for="s in segments" :key="s.id" :d="s.path" :fill="s.color" stroke="#0e0b16" stroke-width="1" />
            <text
              v-for="s in segments" :key="'t' + s.id"
              :x="s.lx" :y="s.ly"
              :transform="`rotate(${s.rot} ${s.lx} ${s.ly})`"
              :font-size="s.font"
              text-anchor="middle" dominant-baseline="central"
              fill="#1a1430" font-weight="700"
            >{{ s.label }}</text>
          </g>
          <circle :cx="CX" :cy="CY" r="16" fill="#1d1730" stroke="#e3b341" stroke-width="2" />
          <text :x="CX" :y="CY" text-anchor="middle" dominant-baseline="central" font-size="16">⭐</text>
        </svg>
      </div>

      <div class="wheel-actions">
        <p class="muted">{{ remaining.length }} en la rueda · {{ participants.length }} inscrito{{ participants.length === 1 ? '' : 's' }}</p>
        <template v-if="isAdmin">
          <button v-if="remaining.length > 0" class="btn gold spin-btn" :disabled="spinning" @click="spin">
            {{ spinning ? 'Girando…' : '🎯 ¡Girar la rueda!' }}
          </button>
          <button class="btn ghost new-round-btn" :disabled="spinning" @click="newRound">🔄 ¿Nueva Ronda?</button>
        </template>
        <p v-else class="muted" style="font-size:.85rem">Solo el organizador puede girar la rueda.</p>
      </div>
    </template>
  </div>

  <div class="card" style="margin-top:16px">
    <h2 style="margin:0 0 10px">🏆 Ganadores</h2>
    <div v-if="winners.length === 0" class="empty">Aún no hay ganadores. ¡Gira la rueda!</div>
    <div v-else class="rounds">
      <div v-for="grp in winnersByRound" :key="grp.round" class="round-block">
        <div class="round-head">🏆 Ronda {{ grp.round }} <span class="muted">· {{ grp.list.length }} premio{{ grp.list.length === 1 ? '' : 's' }}</span></div>
        <ol class="round-winners">
          <li v-for="(w, i) in grp.list" :key="w.id">
            <span class="wpos">{{ ['🥇','🥈','🥉'][i] || (i + 1) + '.' }}</span>
            <strong>{{ w.name }}</strong>
            <span class="muted">Premio #{{ i + 1 }}</span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wheel-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; }
.round-tag { font-size: 1rem; background: var(--panel-2); border: 1px solid var(--border); border-radius: 999px; padding: 6px 16px; }
.wheel-box { position: relative; width: 100%; max-width: 360px; }
.wheel { width: 100%; height: auto; display: block; filter: drop-shadow(0 8px 24px rgba(0,0,0,.5)); }
.wheel-rot { transform-box: fill-box; transform-origin: center; transition: transform 4.6s cubic-bezier(.16,.84,.3,1); }
.pointer { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); font-size: 2rem; color: var(--gold); z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,.6); line-height: 1; }
.wheel-actions { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.spin-btn { font-size: 1.05rem; padding: 14px 28px; }
.new-round-btn { font-size: .9rem; }
.allwon { line-height: 1.6; }
.winner-banner { font-size: 1.05rem; text-align: center; }

.rounds { display: grid; gap: 16px; }
.round-block { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
.round-head { font-weight: 700; margin-bottom: 8px; }
.round-winners { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.round-winners li { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; }
.round-winners li:hover { background: rgba(255,255,255,.03); }
.wpos { width: 26px; text-align: center; font-variant-numeric: tabular-nums; }
</style>
