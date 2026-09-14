<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppNavbar.vue
 * วัตถุประสงค์: แถบเมนูด้านบน (Top Navigation Bar)
 * ประกอบด้วย: โลโก้ ISR, เวลาเรียลไทม์ (UTC & Local Thai), ปุ่มสลับธีม (Light/Dark),
 * ปุ่มสลับโหมด Mock Data (Dev Friendly), ข้อมูลผู้ใช้งาน และปุ่ม Sign Out
 * ============================================================================
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import {
  Menu,
  LogOut,
  User,
  Clock,
  Database,
  Radio,
  RefreshCw,
  Search,
  Bell,
  BellOff
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// เวลาเรียลไทม์ (UTC & Local)
const utcTime = ref('')
const localTime = ref('')

// ระบบ Auto-Refresh นับถอยหลัง
const refreshCountdown = ref(appStore.autoRefreshSeconds || 30)

const refreshOptions = [
  { value: 0, label: 'ปิด' },
  { value: 30, label: '30วิ' },
  { value: 60, label: '1นาที' },
  { value: 300, label: '5นาที' }
]

const cycleAutoRefresh = () => {
  const currentIndex = refreshOptions.findIndex(o => o.value === appStore.autoRefreshSeconds)
  const nextIndex = (currentIndex + 1) % refreshOptions.length
  const next = refreshOptions[nextIndex]
  appStore.setAutoRefresh(next.value)
  refreshCountdown.value = next.value
}

let timer = null
const updateClock = () => {
  const now = new Date()
  utcTime.value = now.toISOString().slice(11, 19) + ' UTC'
  localTime.value = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now) + ' (TH)'

  // จัดการตัวนับถอยหลัง Auto-Refresh
  if (appStore.autoRefreshSeconds > 0) {
    refreshCountdown.value--
    if (refreshCountdown.value <= 0) {
      appStore.triggerRefresh()
      refreshCountdown.value = appStore.autoRefreshSeconds
    }
  }
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const handleLogout = async () => {
  await authStore.logout()
  appStore.showToast('ออกจากระบบสำเร็จ', 'ขอบคุณสำหรับการปฏิบัติหน้าที่', 'info')
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/90 dark:bg-space-900/90 backdrop-blur-md border-b border-sky-200/80 dark:border-sky-800/40 transition-colors shadow-2xs">
    <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <!-- Left: Sidebar Toggle Button (ปุ่มสามขีด) & Brand Logo -->
      <div class="flex items-center gap-2.5">
        <!-- ปุ่มสามขีดสำหรับกดเด้งเข้าเด้งออก Sidebar ทั้งบนจอมือถือและเดสก์ท็อป -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-space-800 border border-sky-200/80 dark:border-sky-800/40 focus:outline-none transition-all duration-150 flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95"
          :class="appStore.sidebarOpen ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700' : ''"
          aria-label="เปิด/ปิดแถบเมนูเลือกหมวด (Sidebar)"
          title="เปิด/ปิดแถบเมนู (Sidebar)"
          @click="appStore.toggleSidebar"
        >
          <Menu class="w-5 h-5" />
        </button>

        <router-link to="/dashboard" class="flex items-center gap-2.5 group">
          <img
            src="/src/assets/png-isr.png"
            alt="ISR Logo"
            class="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            onerror="this.style.display='none'"
          />
          <div>
            <span class="text-base sm:text-lg font-bold font-prompt bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent tracking-tight block leading-tight">
              SOIS
            </span>
            <span class="hidden md:block text-xs uppercase tracking-wider text-sky-600 dark:text-cyan-200 font-bold">
              Satellite Operations Information System
            </span>
          </div>
        </router-link>
      </div>

      <!-- Center: Operations Clock (UTC & Thai Local) -->
      <div class="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-sky-50/90 dark:bg-space-850 border border-sky-300 dark:border-sky-700/70 text-sm font-mono font-bold shadow-xs">
        <div class="flex items-center gap-2 text-sky-800 dark:text-cyan-300">
          <Radio class="w-4 h-4 text-sky-500 animate-pulse" />
          <span>{{ utcTime }}</span>
        </div>
        <div class="w-px h-4 bg-sky-300 dark:bg-sky-700"></div>
        <div class="flex items-center gap-2 text-slate-800 dark:text-sky-100">
          <Clock class="w-4 h-4 text-sky-400" />
          <span>{{ localTime }}</span>
        </div>
      </div>

      <!-- Right: Actions, Theme Toggle, Mock Switch & User Profile -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Command Palette Search Button (Ctrl+K) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-space-850 hover:bg-sky-100 dark:hover:bg-space-800 text-sm text-slate-800 dark:text-cyan-200 transition-all shadow-2xs hover:scale-102 active:scale-98"
          title="ค้นหาเมนู, คำสั่งด่วน หรือดาวเทียม (Ctrl+K)"
          @click="appStore.commandPaletteOpen = true"
        >
          <Search class="w-4 h-4 text-sky-500" />
          <span class="hidden md:inline font-prompt font-bold">ค้นหา...</span>
          <kbd class="hidden sm:inline-flex px-2 py-0.5 text-xs font-mono font-bold text-slate-700 bg-white dark:bg-space-800 rounded border border-slate-300 dark:border-space-700">Ctrl K</kbd>
        </button>

        <!-- Audio Alert Toggle (เสียงเตือนรอบพาส AOS) -->
        <button
          type="button"
          class="p-2.5 rounded-xl border-2 transition-all"
          :class="appStore.audioAlertsEnabled
            ? 'bg-sky-50 text-sky-600 border-sky-400 dark:bg-sky-950/70 dark:text-cyan-300 dark:border-sky-500 shadow-xs'
            : 'bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-space-700'"
          :title="appStore.audioAlertsEnabled ? 'เปิดเสียงเตือน AOS อยู่ (คลิกเพื่อปิด)' : 'ปิดเสียงเตือน AOS อยู่ (คลิกเพื่อเปิด)'"
          @click="appStore.toggleAudioAlerts"
        >
          <Bell v-if="appStore.audioAlertsEnabled" class="w-4 h-4 text-cyan-300" />
          <BellOff v-else class="w-4 h-4 opacity-70" />
        </button>

        <!-- Mock Data Toggle (สำหรับนักพัฒนา) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all"
          :class="appStore.mockMode
            ? 'bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-500/70'
            : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-space-800 dark:text-slate-200 dark:border-space-700 hover:bg-slate-100'"
          title="สลับโหมดการเชื่อมต่อระหว่างข้อมูลจำลอง (Mock) และเซิร์ฟเวอร์จริง"
          @click="appStore.toggleMockMode"
        >
          <Database class="w-4 h-4" />
          <span>{{ appStore.mockMode ? 'Mock Data' : 'Live API' }}</span>
        </button>

        <!-- Auto-Refresh Toggle Button (รอบรีเฟรชข้อมูลอัตโนมัติ) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all"
          :class="appStore.autoRefreshSeconds > 0
            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-500/70'
            : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-space-800 dark:text-slate-200 dark:border-space-700 hover:bg-slate-100'"
          :title="appStore.autoRefreshSeconds > 0 ? `อัปเดตอัตโนมัติทุก ${appStore.autoRefreshSeconds} วินาที (คลิกเพื่อเปลี่ยนรอบ)` : 'เปิดการอัปเดตข้อมูลอัตโนมัติ (คลิกเพื่อเปิด)'"
          @click="cycleAutoRefresh"
        >
          <RefreshCw class="w-4 h-4" :class="appStore.autoRefreshSeconds > 0 ? 'text-emerald-500 animate-spin' : 'opacity-70'" style="animation-duration: 3s;" />
          <span>Auto: {{ appStore.autoRefreshSeconds > 0 ? `${refreshCountdown}s` : 'ปิด' }}</span>
        </button>

        <!-- User Profile Information -->
        <div v-if="authStore.user" class="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-space-700">
          <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-200 flex items-center justify-center font-bold text-sm border-2 border-blue-300 dark:border-cyan-400/40 flex-shrink-0">
            <User class="w-4 h-4" />
          </div>
          <div class="hidden lg:block text-left text-xs leading-tight">
            <span class="font-bold text-sm text-slate-900 dark:text-white block truncate max-w-[140px]">
              {{ authStore.displayName }}
            </span>
            <span class="text-xs font-bold text-blue-600 dark:text-cyan-300 uppercase">
              Role: {{ authStore.userRole }}
            </span>
          </div>

          <!-- Sign Out Button -->
          <button
            type="button"
            class="ml-1 p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
            title="ออกจากระบบ"
            @click="handleLogout"
          >
            <LogOut class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
