import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'planner-static-serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/planner/') {
            req.url = '/planner/index.html'
          }
          next()
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/reference_original/**', '**/.git/**']
    },
    // ตั้งค่า Reverse Proxy เฉพาะเมื่อผู้พัฒนาได้ระบุ VITE_API_TARGET ไว้เท่านั้น (ป้องกันการค้างเชื่อมต่อ IP ภายนอก)
    proxy: process.env.VITE_API_TARGET ? {
      '/api': {
        target: process.env.VITE_API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 2000
      }
    } : {}
  },
  // ตั้งค่า Production Preview Server (โหลดเว็บเร็วแบบ Pre-built Production Bundle)
  preview: {
    port: 3000,
    host: true,
    proxy: process.env.VITE_API_TARGET ? {
      '/api': {
        target: process.env.VITE_API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 2000
      }
    } : {}
  }
})
