<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../services/db'
import { auth } from '../store/auth'

const COLORS = ['#8b5cf6', '#ef4444', '#22c55e', '#3b82f6', '#e3b341', '#ec4899', '#14b8a6', '#f97316', '#a78bfa', '#f472b6']
const CX = 150, CY = 150, R = 145

const participants = ref([])
const loading = ref(true)
const rotation = ref(0)
const spinning = ref(false)
const announce = ref(null)
const error = ref('')

const isAdmin = computed(() => auth.user?.isAdmin)
const remaining = computed(() => participants.value.filter((p) => !p.ganador))
const winners = computed(() => participants.value.filter((p) => p.ganador))

async function load() {
  participants.value = await db.listFestParticipants()
  loading.value = false
}
onMounted(load)

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
      name: p.name,
      color: COLORS[i % COLORS.length],
      path: `M ${CX} ${CY} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`,
      lx: lp.x, ly: lp.y, rot, font,
      // Recorta nombres largos para que quepan.
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
      await db.setFestWinner(chosen.id)
      await load()
      announce.value = chosen.name
    } catch (e) {
      error.value = e.message
    } finally {
      spinning.value = false
    }
  }, 4700)
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
    <div v-if="remaining.length === 0" class="empty">
      🎊 ¡Ya no quedan participantes en la rueda! Todos han sido premiados.
    </div>

    <template v-else>
      <div class="wheel-box">
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
        <p class="muted">{{ remaining.length }} participante{{ remaining.length === 1 ? '' : 's' }} en la rueda</p>
        <button v-if="isAdmin" class="btn gold spin-btn" :disabled="spinning" @click="spin">
          {{ spinning ? 'Girando…' : '🎯 ¡Girar la rueda!' }}
        </button>
        <p v-else class="muted" style="font-size:.85rem">Solo el organizador puede girar la rueda.</p>
      </div>
    </template>
  </div>

  <div class="card" style="margin-top:16px">
    <h2 style="margin:0 0 10px">🏆 {{ winners.length }} Ganador{{ winners.length === 1 ? '' : 'es' }}</h2>
    <div v-if="winners.length === 0" class="empty">Aún no hay ganadores. ¡Gira la rueda!</div>
    <div v-else class="tablewrap">
      <table>
        <thead><tr><th style="width:44px">#</th><th>Ganador</th><th>Premio</th></tr></thead>
        <tbody>
          <tr v-for="(w, i) in winners" :key="w.id">
            <td class="tag-rank">{{ ['🥇','🥈','🥉'][i] || (i + 1) }}</td>
            <td><strong>{{ w.name }}</strong></td>
            <td class="muted">Premio #{{ i + 1 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.wheel-wrap { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 24px; }
.wheel-box { position: relative; width: 100%; max-width: 360px; }
.wheel { width: 100%; height: auto; display: block; filter: drop-shadow(0 8px 24px rgba(0,0,0,.5)); }
.wheel-rot { transform-box: fill-box; transform-origin: center; transition: transform 4.6s cubic-bezier(.16,.84,.3,1); }
.pointer {
  position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
  font-size: 2rem; color: var(--gold); z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,.6); line-height: 1;
}
.wheel-actions { text-align: center; }
.spin-btn { font-size: 1.05rem; padding: 14px 28px; }
.winner-banner { font-size: 1.05rem; text-align: center; }
.tablewrap { overflow-x: auto; }
</style>
