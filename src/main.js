import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAuth } from './store/auth'

// Restore any existing session before mounting so guarded routes resolve correctly.
initAuth().finally(() => {
  createApp(App).use(router).mount('#app')
})
