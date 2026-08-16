import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 本地开发：/api/* 由 Vite 转发到 wrangler dev，与生产（Pages 同域）架构一致
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
