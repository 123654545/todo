import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  // 修复刷新页面404问题
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})