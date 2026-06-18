<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { MODE } from './services/db'
</script>

<template>
  <NavBar />
  <main class="container">
    <RouterView />
  </main>
  <div class="pill-mode" :title="MODE === 'local'
      ? 'Los datos se guardan solo en este navegador. Agrega las llaves de Supabase para compartirlos.'
      : 'Conectado a una base de datos compartida de Supabase.'">
    {{ MODE === 'local' ? '● modo local' : '● compartido (supabase)' }}
  </div>
</template>
