<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { signUp } from '../store/auth'

const router = useRouter()
const displayName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  busy.value = true
  try {
    await signUp({ email: email.value, password: password.value, displayName: displayName.value })
    router.push('/profile')
  } catch (e) {
    error.value = e.message === 'An account with that email already exists.'
      ? 'Ya existe una cuenta con ese correo.' : e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="card">
      <h1>Únete a la liga</h1>
      <p class="muted">Crea una cuenta para reclamar tu lugar en la mesa.</p>
      <div v-if="error" class="alert err">{{ error }}</div>
      <form @submit.prevent="submit">
        <label>Nombre para mostrar</label>
        <input v-model="displayName" required placeholder="p. ej. Jace el Valiente" />
        <label>Correo</label>
        <input v-model="email" type="email" autocomplete="email" required placeholder="tu@ejemplo.com" />
        <label>Contraseña</label>
        <input v-model="password" type="password" autocomplete="new-password" required placeholder="Al menos 6 caracteres" />
        <button class="btn" style="margin-top:18px; width:100%" :disabled="busy">
          {{ busy ? 'Creando…' : 'Crear cuenta' }}
        </button>
      </form>
      <p class="muted center" style="margin-top:16px">
        ¿Ya tienes cuenta? <RouterLink to="/login">Inicia sesión</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap { max-width: 420px; margin: 30px auto; }
</style>
