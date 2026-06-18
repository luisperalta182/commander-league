<script setup>
import { ref, watch } from 'vue'
import Avatar from './Avatar.vue'
import {
  ACHIEVEMENTS_BY_RARITY, ACHIEVEMENT_BY_ID, RARITIES,
  MAX_ACHIEVEMENTS_PER_GAME, SECRET_MISSIONS, MISSION_BY_ID
} from '../services/achievements'
import { podPointsForPlayer } from '../services/scoring'

const props = defineProps({
  pod: { type: Object, required: true },
  players: { type: Array, required: true }, // resolved player objects, in pod order
  canEdit: { type: Boolean, default: false },
  onSubmit: { type: Function, default: null } // async (data) => void
})

function freshPerPlayer() {
  const m = {}
  for (const p of props.players) {
    const ex = (props.pod.perPlayer && props.pod.perPlayer[p.id]) || {}
    m[p.id] = {
      eliminations: ex.eliminations || 0,
      achievements: [...(ex.achievements || [])],
      secretMissionId: ex.secretMissionId || '',
      secretDone: !!ex.secretDone
    }
  }
  return m
}

const editing = ref(false)
const winnerId = ref(props.pod.winnerId || '')
const secondId = ref(props.pod.secondId || '')
const perPlayer = ref(freshPerPlayer())
const saving = ref(false)
const error = ref('')

watch(winnerId, (v) => { if (v && secondId.value === v) secondId.value = '' })

function resetFromPod() {
  winnerId.value = props.pod.winnerId || ''
  secondId.value = props.pod.secondId || ''
  perPlayer.value = freshPerPlayer()
  error.value = ''
}
watch(() => props.pod, resetFromPod)

function startEdit() { resetFromPod(); editing.value = true }
function cancel() { resetFromPod(); editing.value = false }

function toggleAch(pid, achId) {
  const list = perPlayer.value[pid].achievements
  const i = list.indexOf(achId)
  if (i >= 0) list.splice(i, 1)
  else if (list.length < MAX_ACHIEVEMENTS_PER_GAME) list.push(achId)
}
function incElim(pid, d) {
  const max = props.players.length - 1
  perPlayer.value[pid].eliminations = Math.max(0, Math.min(perPlayer.value[pid].eliminations + d, max))
}

// Live preview using current (unsaved) edits.
function livePts(pid) {
  return podPointsForPlayer(
    { winnerId: winnerId.value || null, secondId: secondId.value || null, perPlayer: perPlayer.value },
    pid
  ).total
}
// Saved points (read-only view).
function savedBreakdown(pid) { return podPointsForPlayer(props.pod, pid) }

function name(p) { return p.displayName }
const hasResults = () =>
  !!props.pod.winnerId ||
  Object.values(props.pod.perPlayer || {}).some(
    (r) => (r.achievements || []).length || r.eliminations || r.secretDone
  )

async function save() {
  if (!props.onSubmit) return
  saving.value = true
  error.value = ''
  try {
    await props.onSubmit({
      winnerId: winnerId.value || null,
      secondId: secondId.value || null,
      perPlayer: JSON.parse(JSON.stringify(perPlayer.value))
    })
    editing.value = false
  } catch (e) {
    error.value = e.message || 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- ===== Modo edición (organizador) ===== -->
  <div v-if="editing" class="pr-edit">
    <div v-if="error" class="alert err">{{ error }}</div>

    <div class="pr-positions">
      <div>
        <label>🥇 1.º lugar</label>
        <select v-model="winnerId">
          <option value="">—</option>
          <option v-for="p in players" :key="p.id" :value="p.id">{{ name(p) }}</option>
        </select>
      </div>
      <div>
        <label>🥈 2.º lugar</label>
        <select v-model="secondId">
          <option value="">—</option>
          <option v-for="p in players" :key="p.id" :value="p.id" :disabled="p.id === winnerId">{{ name(p) }}</option>
        </select>
      </div>
    </div>

    <div class="pr-rows">
      <div v-for="p in players" :key="p.id" class="pr-row">
        <div class="pr-row-head">
          <Avatar :name="p.displayName" :color="p.color" :size="34" />
          <div class="pr-name">
            <strong>{{ name(p) }}</strong>
            <span v-if="winnerId === p.id" class="badge win">🥇 1.º</span>
            <span v-else-if="secondId === p.id" class="badge">🥈 2.º</span>
          </div>
          <div class="pr-total">{{ livePts(p.id) }} pts</div>
        </div>

        <div class="pr-controls">
          <div class="pr-elim">
            <span class="muted">💀 Eliminaciones</span>
            <button type="button" class="step" @click="incElim(p.id, -1)">−</button>
            <span class="elim-n">{{ perPlayer[p.id].eliminations }}</span>
            <button type="button" class="step" @click="incElim(p.id, 1)">+</button>
          </div>
          <label class="pr-mission">
            <input type="checkbox" v-model="perPlayer[p.id].secretDone" />
            <span>🎴 Misión secreta cumplida (+2)</span>
          </label>
          <select v-if="perPlayer[p.id].secretDone" v-model="perPlayer[p.id].secretMissionId" class="mission-sel">
            <option value="">(¿cuál misión? — opcional)</option>
            <option v-for="m in SECRET_MISSIONS" :key="m.id" :value="m.id">{{ m.emoji }} {{ m.name }}</option>
          </select>
        </div>

        <details class="pr-ach">
          <summary>🏅 Logros — {{ perPlayer[p.id].achievements.length }}/{{ MAX_ACHIEVEMENTS_PER_GAME }}</summary>
          <div v-for="group in ACHIEVEMENTS_BY_RARITY" :key="group.rarity" class="ach-group">
            <div class="ach-group-title" :style="{ color: group.color }">{{ group.emoji }} {{ group.label }} · {{ group.points }} pt</div>
            <div class="chips">
              <button
                v-for="a in group.items" :key="a.id" type="button"
                class="chip" :class="{ on: perPlayer[p.id].achievements.includes(a.id) }"
                :style="perPlayer[p.id].achievements.includes(a.id) ? { borderColor: group.color, background: group.color + '22' } : {}"
                :disabled="!perPlayer[p.id].achievements.includes(a.id) && perPlayer[p.id].achievements.length >= MAX_ACHIEVEMENTS_PER_GAME"
                :title="a.desc"
                @click="toggleAch(p.id, a.id)"
              >{{ a.name }}</button>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div class="row" style="margin-top:12px; gap:8px">
      <button class="btn" :disabled="saving" @click="save">{{ saving ? 'Guardando…' : 'Guardar resultados' }}</button>
      <button class="btn ghost" :disabled="saving" @click="cancel">Cancelar</button>
    </div>
  </div>

  <!-- ===== Modo lectura ===== -->
  <div v-else class="pr-view">
    <ul class="seats">
      <li v-for="p in players" :key="p.id" class="seat" :class="{ winner: pod.winnerId === p.id }">
        <span class="dot" :style="{ background: p.color }"></span>
        <span class="seat-name">{{ name(p) }}</span>
        <span v-if="pod.winnerId === p.id" class="badge win">🥇 1.º</span>
        <span v-else-if="pod.secondId === p.id" class="badge">🥈 2.º</span>
        <span v-if="(pod.perPlayer && pod.perPlayer[p.id] && pod.perPlayer[p.id].eliminations) " class="badge">💀 {{ pod.perPlayer[p.id].eliminations }}</span>
        <span
          v-for="achId in (pod.perPlayer && pod.perPlayer[p.id] ? pod.perPlayer[p.id].achievements : [])" :key="achId"
          class="badge ach-badge"
          :style="{ borderColor: RARITIES[ACHIEVEMENT_BY_ID[achId].rarity].color, color: RARITIES[ACHIEVEMENT_BY_ID[achId].rarity].color }"
          :title="ACHIEVEMENT_BY_ID[achId].desc"
        >{{ RARITIES[ACHIEVEMENT_BY_ID[achId].rarity].emoji }} {{ ACHIEVEMENT_BY_ID[achId].name }}</span>
        <span v-if="pod.perPlayer && pod.perPlayer[p.id] && pod.perPlayer[p.id].secretDone" class="badge" title="Misión secreta cumplida">🎴 Misión</span>
        <span class="seat-pts">{{ savedBreakdown(p.id).total }} pts</span>
      </li>
    </ul>
    <div v-if="canEdit" class="row" style="margin-top:10px">
      <button class="btn sm" @click="startEdit">{{ hasResults() ? '✏️ Editar resultados' : '➕ Registrar resultados' }}</button>
    </div>
    <div v-else-if="!hasResults()" class="hint muted" style="margin-top:8px">Sin resultados registrados todavía.</div>
  </div>
</template>

<style scoped>
.pr-positions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.pr-positions label { margin-top: 0; }
.pr-rows { display: grid; gap: 12px; }
.pr-row { background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.pr-row-head { display: flex; align-items: center; gap: 10px; }
.pr-name { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.pr-total { font-weight: 800; color: var(--primary-2); white-space: nowrap; }
.pr-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 10px; }
.pr-elim { display: flex; align-items: center; gap: 8px; font-size: .88rem; }
.step { width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg-soft); color: var(--text); cursor: pointer; font-size: 1rem; line-height: 1; }
.step:hover { background: var(--panel); }
.elim-n { min-width: 16px; text-align: center; font-variant-numeric: tabular-nums; }
.pr-mission { display: flex; align-items: center; gap: 7px; margin: 0; font-size: .88rem; color: var(--text); cursor: pointer; }
.pr-mission input { width: auto; margin: 0; accent-color: var(--primary); }
.mission-sel { max-width: 280px; }
.pr-ach { margin-top: 10px; }
.pr-ach summary { cursor: pointer; font-size: .9rem; font-weight: 600; }
.ach-group { margin-top: 8px; }
.ach-group-title { font-size: .76rem; font-weight: 700; margin-bottom: 5px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: .78rem; padding: 5px 9px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg-soft); color: var(--text); cursor: pointer; }
.chip:hover:not(:disabled) { border-color: var(--primary); }
.chip:disabled { opacity: .35; cursor: not-allowed; }
.chip.on { font-weight: 700; }

.seats { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.seat { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 8px; border: 1px solid transparent; flex-wrap: wrap; }
.seat.winner { background: rgba(245, 158, 11, .10); border-color: rgba(245,158,11,.4); }
.dot { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.seat-name { font-weight: 600; }
.seat-pts { margin-left: auto; font-weight: 700; color: var(--primary-2); white-space: nowrap; }
.ach-badge { background: transparent; }
.hint { font-size: .8rem; }
</style>
