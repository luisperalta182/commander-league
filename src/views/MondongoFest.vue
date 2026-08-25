<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../services/db'
import { auth } from '../store/auth'

const posterUrl = import.meta.env.BASE_URL + 'mondongo-fest.jpg'
const imgError = ref(false)

const participants = ref([])
const loading = ref(true)
const showModal = ref(false)
const newName = ref('')
const error = ref('')
const busy = ref(false)

const isAdmin = computed(() => auth.user?.isAdmin)
const count = computed(() => participants.value.length)

async function load() {
  participants.value = await db.listFestParticipants()
  loading.value = false
}
onMounted(load)

function openModal() {
  newName.value = ''
  error.value = ''
  showModal.value = true
}

async function submit() {
  const name = newName.value.trim()
  if (!name) { error.value = 'Escribe tu nombre.'; return }
  if (participants.value.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    error.value = 'Ese nombre ya está inscrito.'
    return
  }
  busy.value = true
  try {
    await db.addFestParticipant(name)
    await load()
    showModal.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function removeParticipant(p) {
  if (!confirm(`¿Eliminar a ${p.name} de la lista?`)) return
  await db.deleteFestParticipant(p.id)
  await load()
}
</script>

<template>
  <section class="hero card">
    <div class="badge" style="margin-bottom:12px">🌋 3ª Edición · Masatepe</div>
    <h1>🦌 Mondongo Fest</h1>
    <p class="lead phrase">"¡Que viva el Magic!"</p>
    <p class="date-line">📅 No te pierdas este <strong>domingo 30 de agosto</strong> el <strong>Mondongo Fest</strong>.</p>
    <p class="muted">
      El domingo más sabroso del año: mazos sobre la mesa, mondongo en el fuego y cartas volando. 🍲🔥
      Ven a jugar <strong>EDH</strong>, <strong>Dual Commander</strong>, <strong>Pauper</strong>, <strong>Modern</strong> y hasta <strong>cEDH</strong> —
      desde la mesa más casual y política hasta la más tryhard. ¡Trae tu comandante favorito y tu mejor sombrero!
    </p>
    <div class="row">
      <button class="btn gold" @click="openModal">✍️ ¡Inscríbete!</button>
      <RouterLink to="/rifa" class="btn ghost">🎡 Ver la Rifa</RouterLink>
    </div>
  </section>

  <div class="card poster-card">
    <img v-if="!imgError" :src="posterUrl" alt="Mondongo Fest — El Señor Deer" class="poster" @error="imgError = true" />
    <div v-else class="poster-fallback">
      🦌🎴<br />
      <span>Sube <code>public/mondongo-fest.jpg</code> para ver el póster aquí.</span>
    </div>
  </div>

  <div class="grid cols-3" style="margin-top:16px">
    <div class="card fmt"><div class="fmt-emoji">👑</div><strong>EDH / Commander</strong><p class="muted">Mesas de 3–4, política, caos y momentos memorables.</p></div>
    <div class="card fmt"><div class="fmt-emoji">🤺</div><strong>Dual Commander</strong><p class="muted">Commander 1 contra 1. Duelos tácticos con tu general.</p></div>
    <div class="card fmt"><div class="fmt-emoji">🪙</div><strong>Pauper</strong><p class="muted">Solo comunes, puro ingenio. Barato y brutal.</p></div>
    <div class="card fmt"><div class="fmt-emoji">⚡</div><strong>Modern</strong><p class="muted">Cartas de 8ª edición en adelante. Rápido y competitivo.</p></div>
    <div class="card fmt"><div class="fmt-emoji">⚔️</div><strong>cEDH</strong><p class="muted">Para los que juegan a ganar. Combos y velocidad.</p></div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="row spread" style="margin-bottom:8px">
      <h2 style="margin:0">🙋 {{ count }} Participante{{ count === 1 ? '' : 's' }}</h2>
      <button class="btn sm" @click="openModal">✍️ Inscribirme</button>
    </div>

    <div v-if="loading" class="empty">Cargando…</div>
    <div v-else-if="count === 0" class="empty">Aún no hay inscritos. ¡Sé el primero en apuntarte!</div>

    <div v-else class="tablewrap">
      <table>
        <thead>
          <tr><th style="width:44px">#</th><th>Nombre</th><th>Estado</th><th v-if="isAdmin"></th></tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in participants" :key="p.id">
            <td class="tag-rank">{{ i + 1 }}</td>
            <td><strong>{{ p.name }}</strong></td>
            <td>
              <span v-if="p.ganador" class="badge win">🏆 Ganador</span>
              <span v-else class="badge">🎟️ En la rifa</span>
            </td>
            <td v-if="isAdmin" class="num">
              <button class="btn danger sm" @click="removeParticipant(p)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal de inscripción -->
  <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
    <div class="modal card">
      <h3>✍️ Inscríbete al Mondongo Fest</h3>
      <p class="muted" style="margin-top:0">Escribe tu nombre para entrar a la lista y a la rifa.</p>
      <div v-if="error" class="alert err">{{ error }}</div>
      <form @submit.prevent="submit">
        <label>Tu nombre</label>
        <input v-model="newName" ref="nameInput" placeholder="p. ej. El Señor Deer" autofocus @keyup.enter="submit" />
        <div class="row" style="margin-top:16px; gap:8px">
          <button class="btn" :disabled="busy" type="submit">{{ busy ? 'Guardando…' : 'Inscribirme' }}</button>
          <button class="btn ghost" type="button" @click="showModal = false">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.hero { padding: 30px 26px; }
.lead { font-size: 1.05rem; }
.phrase { font-style: italic; color: var(--gold); font-size: 1.2rem; margin: 4px 0 12px; }
.date-line { font-size: 1.05rem; margin: 6px 0 12px; }
.poster-card { margin-top: 16px; padding: 12px; display: flex; justify-content: center; }
.poster { max-width: 100%; width: 560px; border-radius: 12px; display: block; }
.poster-fallback { text-align: center; padding: 50px 16px; font-size: 2rem; color: var(--muted); line-height: 1.6; }
.poster-fallback span { font-size: .9rem; display: block; margin-top: 8px; }
.poster-fallback code { background: var(--bg-soft); padding: 2px 6px; border-radius: 6px; font-size: .85rem; }
.fmt { text-align: center; }
.fmt-emoji { font-size: 2rem; margin-bottom: 6px; }
.fmt p { margin: 6px 0 0; font-size: .88rem; }
.tablewrap { overflow-x: auto; }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.6); backdrop-filter: blur(3px);
  display: grid; place-items: center; padding: 18px;
}
.modal { width: 100%; max-width: 420px; }
</style>
