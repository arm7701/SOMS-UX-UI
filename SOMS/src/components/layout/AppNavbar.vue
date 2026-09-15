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
  <header class="sticky top-0 z-40 bg-[#040e21]/95 backdrop-blur-xl border-b border-sky-500/25 transition-colors shadow-lg">
    <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <!-- Left: Sidebar Toggle Button (ปุ่มสามขีด) & Brand Logo -->
      <div class="flex items-center gap-2.5">
        <!-- ปุ่มสามขีดสำหรับกดเด้งเข้าเด้งออก Sidebar ทั้งบนจอมือถือและเดสก์ท็อป -->
        <button
          type="button"
          class="p-2 rounded-xl text-sky-200 hover:text-white bg-[#061833]/90 hover:bg-sky-500/20 border border-sky-400/30 focus:outline-hidden transition-all duration-150 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95"
          :class="appStore.sidebarOpen ? 'bg-sky-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]' : ''"
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
            class="h-8 w-auto object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
            onerror="this.style.display='none'"
          />
          <div>
            <span class="text-base sm:text-lg font-bold font-prompt bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 bg-clip-text text-transparent tracking-tight block leading-tight">
              SOIS
            </span>
            <span class="hidden md:block text-xs uppercase tracking-wider text-cyan-200 font-bold">
              Satellite Operations Information System
            </span>
          </div>
        </router-link>
      </div>

      <!-- Center: Operations Clock (UTC & Thai Local) -->
      <div class="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-[#061833]/90 border border-sky-400/30 text-sm font-mono font-bold shadow-md shadow-sky-950/50">
        <div class="flex items-center gap-2 text-cyan-300">
          <Radio class="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{{ utcTime }}</span>
        </div>
        <div class="w-px h-4 bg-sky-500/40"></div>
        <div class="flex items-center gap-2 text-white">
          <Clock class="w-4 h-4 text-sky-300" />
          <span>{{ localTime }}</span>
        </div>
      </div>

      <!-- Right: Actions, Theme Toggle, Mock Switch & User Profile -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Command Palette Search Button (Ctrl+K) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl border border-sky-400/30 bg-[#061833]/90 hover:bg-sky-500/20 text-sm text-cyan-200 hover:text-white transition-all shadow-xs hover:scale-102 active:scale-98"
          title="ค้นหาเมนู, คำสั่งด่วน หรือดาวเทียม (Ctrl+K)"
          @click="appStore.commandPaletteOpen = true"
        >
          <Search class="w-4 h-4 text-cyan-400" />
          <span class="hidden md:inline font-prompt font-bold">ค้นหา...</span>
          <kbd class="hidden sm:inline-flex px-2 py-0.5 text-xs font-mono font-bold text-cyan-200 bg-[#040e21] rounded border border-sky-500/40">Ctrl K</kbd>
        </button>

        <!-- Audio Alert Toggle (เสียงเตือนรอบพาส AOS) -->
        <button
          type="button"
          class="p-2.5 rounded-xl border-2 transition-all cursor-pointer"
          :class="appStore.audioAlertsEnabled
            ? 'bg-sky-500/20 text-cyan-300 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            : 'bg-[#061833]/60 text-slate-400 hover:text-slate-200 border-slate-700/60 hover:border-slate-600'"
          :title="appStore.audioAlertsEnabled ? 'เปิดเสียงเตือน AOS อยู่ (คลิกเพื่อปิด)' : 'ปิดเสียงเตือน AOS อยู่ (คลิกเพื่อเปิด)'"
          @click="appStore.toggleAudioAlerts"
        >
          <Bell v-if="appStore.audioAlertsEnabled" class="w-4 h-4 text-cyan-300" />
          <BellOff v-else class="w-4 h-4 opacity-70" />
        </button>

        <!-- Mock Data Toggle (สำหรับนักพัฒนา) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all cursor-pointer"
          :class="appStore.mockMode
            ? 'bg-amber-950/60 text-amber-200 border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
            : 'bg-[#061833]/90 text-cyan-200 border-sky-400/40 hover:bg-sky-500/20'"
          title="สลับโหมดการเชื่อมต่อระหว่างข้อมูลจำลอง (Mock) และเซิร์ฟเวอร์จริง"
          @click="appStore.toggleMockMode"
        >
          <Database class="w-4 h-4 text-amber-300" />
          <span>{{ appStore.mockMode ? 'Mock Data' : 'Live API' }}</span>
        </button>

        <!-- Auto-Refresh Toggle Button (รอบรีเฟรชข้อมูลอัตโนมัติ) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl border-2 transition-all cursor-pointer"
          :class="appStore.autoRefreshSeconds > 0
            ? 'bg-emerald-950/60 text-emerald-200 border-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
            : 'bg-[#061833]/90 text-slate-300 border-slate-700/60 hover:bg-slate-800'"
          :title="appStore.autoRefreshSeconds > 0 ? `อัปเดตอัตโนมัติทุก ${appStore.autoRefreshSeconds} วินาที (คลิกเพื่อเปลี่ยนรอบ)` : 'เปิดการอัปเดตข้อมูลอัตโนมัติ (คลิกเพื่อเปิด)'"
          @click="cycleAutoRefresh"
        >
          <RefreshCw class="w-4 h-4" :class="appStore.autoRefreshSeconds > 0 ? 'text-emerald-400 animate-spin' : 'opacity-70'" style="animation-duration: 3s;" />
          <span>Auto: {{ appStore.autoRefreshSeconds > 0 ? `${refreshCountdown}s` : 'ปิด' }}</span>
        </button>

        <!-- User Profile Information -->
        <div v-if="authStore.user" class="flex items-center gap-2.5 pl-2.5 border-l border-sky-500/30">
          <div class="w-9 h-9 rounded-full bg-[#081f3d] text-cyan-200 flex items-center justify-center font-bold text-sm border-2 border-cyan-400/50 flex-shrink-0 shadow-xs">
            <User class="w-4 h-4" />
          </div>
          <div class="hidden lg:block text-left text-xs leading-tight">
            <span class="font-bold text-sm text-white block truncate max-w-[140px]">
              {{ authStore.displayName }}
            </span>
            <span class="text-xs font-bold text-cyan-300 uppercase">
              Role: {{ authStore.userRole }}
            </span>
          </div>

          <!-- Sign Out Button -->
          <button
            type="button"
            class="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-200 hover:bg-rose-950/50 border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
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
