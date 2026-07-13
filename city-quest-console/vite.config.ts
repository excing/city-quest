/**
 * Callers: vite CLI (npm run dev/build). Console SPA for admin API.
 * User: 开始阶段B 和 C, 完成产品闭环.
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
})
