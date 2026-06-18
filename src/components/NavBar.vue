<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { auth, signOut } from '../store/auth'

const router = useRouter()
const open = ref(false)

async function doSignOut() {
  await signOut()
  open.value = false
  router.push('/')
}
</script>

<template>
  <header class="nav">
    <div class="nav-inner container">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">⚔️</span>
        <span class="brand-text">
          <span class="brand-name">Masatepe The Gathering</span>
          <span class="brand-sub">Liga de Commander</span>
        </span>
      </RouterLink>

      <button class="hamburger" @click="open = !open" aria-label="Menú">☰</button>

      <nav class="links" :class="{ open }" @click="open = false">
        <RouterLink to="/leaderboard">Clasificación</RouterLink>
        <RouterLink to="/prizes">Premios</RouterLink>
        <RouterLink to="/calendar">Calendario</RouterLink>
        <RouterLink to="/players">Jugadores</RouterLink>
        <template v-if="auth.user">
          <RouterLink to="/profile">Perfil</RouterLink>
          <button class="btn ghost sm" @click.stop="doSignOut">Cerrar sesión</button>
        </template>
        <template v-else>
          <RouterLink to="/login">Entrar</RouterLink>
          <RouterLink to="/register" class="btn sm">Unirse</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(14, 11, 22, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  padding-bottom: 14px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.3px;
}
.brand:hover { text-decoration: none; }
.brand-mark { font-size: 1.25rem; }
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-name { font-size: 1rem; }
.brand-sub { font-size: .72rem; font-weight: 600; color: var(--muted); letter-spacing: .2px; }
.links {
  display: flex;
  align-items: center;
  gap: 18px;
}
.links a { color: var(--muted); font-weight: 600; font-size: .92rem; }
.links a:hover { color: var(--text); text-decoration: none; }
.links a.router-link-active:not(.btn) { color: var(--primary-2); }
.links a.btn { color: white; }
.hamburger {
  display: none;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 1.1rem;
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
}
@media (max-width: 680px) {
  .hamburger { display: block; }
  .links {
    display: none;
    position: absolute;
    top: 100%;
    right: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    min-width: 180px;
    box-shadow: var(--shadow);
  }
  .links.open { display: flex; }
}
</style>
