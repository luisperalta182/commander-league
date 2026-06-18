import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' makes the build work on GitHub Pages from any sub-path
// (e.g. https://user.github.io/commander-league/).
export default defineConfig({
  plugins: [vue()],
  base: './'
})
