import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  // 修复Vercel部署问题 - 移除base配置让Vite自动处理
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})