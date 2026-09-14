/**
 * ============================================================================
 * ไฟล์: src/main.js
 * วัตถุประสงค์: Entrypoint หลักของแอปพลิเคชัน SOMS Vue 3
 * เริ่มต้น Vue App พร้อมติดตั้ง Pinia (State Management) และ Vue Router
 * ============================================================================
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')
