<script setup>
import { ref } from 'vue'
import { auth, saveProfile } from '../store/auth'
import Avatar from '../components/Avatar.vue'

const COLORS = ['#8b5cf6', '#ef4444', '#22c55e', '#3b82f6', '#e3b341', '#ec4899', '#14b8a6', '#f97316']

const form = ref({
  displayName: auth.user.displayName,
  commander: auth.user.commander,
  color: auth.user.color || '#8b5cf6',
  bio: auth.user.bio
})
const saved = ref(false)
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  saved.value = false
  busy.value = true
  try {
    await saveProfile({ ...form.value })
    saved.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h1>Tu perfil</h1>
  <div v-if="auth.user.isAdmin" class="alert info">👑 Eres el organizador de la liga — puedes crear jornadas y registrar resultados.</div>

  <div class="grid cols-2">
    <div class="card">
      <div class="row" style="margin-bottom: 8px">
        <Avatar :name="form.displayName" :color="form.color" :size="64" />
        <div>
          <h2 style="margin:0">{{ form.displayName || 'Tu nombre' }}</h2>
          <div class="muted">{{ form.commander || 'Sin comandante definido' }}</div>
        </div>
      </div>
      <p class="muted" style="white-space: pre-wrap">{{ form.bio || 'Agrega una biografía para contarle a la mesa cómo juegas.' }}</p>
    </div>

    <div class="card">
      <div v-if="saved" class="alert ok">Perfil guardado.</div>
      <div v-if="error" class="alert err">{{ error }}</div>
      <form @submit.prevent="submit">
        <label>Nombre para mostrar</label>
        <input v-model="form.displayName" required />

        <label>Comandante / mazo favorito</label>
        <input v-model="form.commander" placeholder="p. ej. Atraxa, Voz de los Pretores" />

        <label>Tu color</label>
        <div class="swatches">
          <button
            v-for="c in COLORS" :key="c" type="button"
            class="swatch" :class="{ active: form.color === c }"
            :style="{ background: c }" @click="form.color = c"
          />
        </div>

        <label>Biografía</label>
        <textarea v-model="form.bio" rows="3" placeholder="¿Spike, Timmy, Johnny? Cuéntale a todos tu estilo."></textarea>

        <button class="btn" style="margin-top:18px" :disabled="busy">
          {{ busy ? 'Guardando…' : 'Guardar perfil' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.swatches { display: flex; gap: 10px; flex-wrap: wrap; }
.swatch {
  width: 34px; height: 34px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer;
}
.swatch.active { border-color: var(--text); transform: scale(1.1); }
</style>
