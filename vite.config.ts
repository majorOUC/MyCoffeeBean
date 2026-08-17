import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  build: {
    // 目标兼容 Chromium 60+（百度浏览器内核）
    target: 'es2018',
    // 确保 CSS 兼容性
    cssTarget: 'chrome61',
  },
})
