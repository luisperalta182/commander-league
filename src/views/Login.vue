<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { signIn } from '../store/auth'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await signIn({ email: email.value, password: password.value })
    router.push(route.query.redirect || '/')
  } catch (e) {
    error.value = e.message === 'Wrong email or password.' ? 'Correo o contraseña incorrectos.' : e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="card">
      <h1>Iniciar sesión</h1>
      <p class="muted">Bienvenido de vuelta a la mesa.</p>
      <div v-if="error" class="alert err">{{ error }}</div>
      <form @submit.prevent="submit">
        <label>Correo</label>
        <input v-model="email" type="email" autocomplete="email" required placeholder="tu@ejemplo.com" />
        <label>Contraseña</label>
        <input v-model="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
        <button class="btn" style="margin-top:18px; width:100%" :disabled="busy">
          {{ busy ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
      <p class="muted center" style="margin-top:16px">
        ¿Eres nuevo? <RouterLink to="/register">Únete a la liga</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap { max-width: 420px; margin: 30px auto; }
</style>
