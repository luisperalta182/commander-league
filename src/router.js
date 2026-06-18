import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from './store/auth'

import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Profile from './views/Profile.vue'
import Players from './views/Players.vue'
import Calendar from './views/Calendar.vue'
import Leaderboard from './views/Leaderboard.vue'
import Prizes from './views/Prizes.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/players', component: Players },
  { path: '/calendar', component: Calendar },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/prizes', component: Prizes },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

// Hash history => works on GitHub Pages with no server rewrites or 404s.
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) return { path: '/login', query: { redirect: to.path } }
  if (to.meta.guestOnly && auth.user) return { path: '/' }
  return true
})

export default router
