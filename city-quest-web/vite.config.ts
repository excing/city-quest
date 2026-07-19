import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5183,
    proxy: {
      // Local develop: forward API to city-quest-server
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'https://cityquest.jiaderen.com',
        changeOrigin: true,
      },
      '/config': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'https://cityquest.jiaderen.com',
        changeOrigin: true,
      },
    },
  },
})
