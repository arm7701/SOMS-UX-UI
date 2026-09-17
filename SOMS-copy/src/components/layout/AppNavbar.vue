<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppNavbar.vue
 * วัตถุประสงค์: แถบเมนูด้านบน (Top Navigation Bar) ธีมดำเทา Obsidian & Titanium
 * ประกอบด้วย: โลโก้ ISR, เวลาเรียลไทม์ (UTC & Local Thai), ค้นหาด่วน (Ctrl+K),
 * ปุ่มสลับโหมด Mock Data (Dev Friendly), ข้อมูลผู้ใช้งาน และปุ่ม Sign Out
 * ============================================================================
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import SomsLogo from '@/components/common/SomsLogo.vue'
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
  <header class="sticky top-0 z-40 bg-space-900/95 backdrop-blur-md border-b border-space-700 transition-colors shadow-md">
    <div class="px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
      <!-- Left: Sidebar Toggle Button (ปุ่มสามขีด) & Brand Logo (ป้องกันการบีบอัด flex-shrink-0) -->
      <div class="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        <!-- ปุ่มสามขีดสำหรับกดเด้งเข้าเด้งออก Sidebar ทั้งบนจอมือถือและเดสก์ท็อป -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-200 hover:text-white bg-space-850 hover:bg-space-800 border border-space-700 focus:outline-none transition-all duration-150 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
          :class="appStore.sidebarOpen ? 'bg-zinc-800 text-white border-zinc-500 shadow-sm' : ''"
          aria-label="เปิด/ปิดแถบเมนูเลือกหมวด (Sidebar)"
          title="เปิด/ปิดแถบเมนู (Sidebar)"
          @click="appStore.toggleSidebar"
        >
          <Menu class="w-5 h-5" />
        </button>

        <router-link to="/dashboard" class="flex items-center group flex-shrink-0">
          <SomsLogo variant="full" />
        </router-link>
      </div>

      <!-- Center: Operations Clock (UTC & Thai Local - Responsive Layout) -->
      <!-- จอใหญ่พิเศษ (xl: 1280px+): แสดงครบทั้ง UTC และเวลาไทย (TH) -->
      <div class="hidden xl:flex items-center gap-3.5 px-3.5 py-1.5 rounded-xl bg-space-850 border border-space-700 text-xs font-mono shadow-xs flex-shrink-0">
        <div class="flex items-center gap-2 text-emerald-300 font-bold">
          <Radio class="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{{ utcTime }}</span>
        </div>
        <div class="w-px h-3.5 bg-space-700"></div>
        <div class="flex items-center gap-2 text-slate-100 font-bold">
          <Clock class="w-3.5 h-3.5 text-cyan-400" />
          <span>{{ localTime }}</span>
        </div>
      </div>
      <!-- จอขนาดกลาง (md: 768px - lg: 1279px): แสดงเวลา UTC กระชับ ไม่แย่งพื้นที่ชื่อระบบ -->
      <div class="hidden md:flex xl:hidden items-center gap-2 px-2.5 py-1 rounded-xl bg-space-850 border border-space-700 text-xs font-mono shadow-xs flex-shrink-0 text-emerald-300 font-bold">
        <Radio class="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>{{ utcTime }}</span>
      </div>

      <!-- Right: Actions, Command Search, Mock Switch & User Profile -->
      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <!-- Command Palette Search Button (Ctrl+K) -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-space-700 bg-space-850 hover:bg-space-800 text-xs sm:text-sm text-slate-200 hover:text-white transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer font-medium flex-shrink-0"
          title="ค้นหาเมนู, คำสั่งด่วน หรือดาวเทียม (Ctrl+K)"
          @click="appStore.commandPaletteOpen = true"
        >
          <Search class="w-4 h-4 text-cyan-400" />
          <span class="hidden 2xl:inline font-prompt font-semibold">ค้นหา...</span>
          <kbd class="hidden xl:inline-flex px-1.5 py-0.5 text-xs font-mono font-bold text-slate-200 bg-space-800 rounded border border-space-700">Ctrl K</kbd>
        </button>

        <!-- Audio Alert Toggle (เสียงเตือนรอบพาส AOS) -->
        <button
          type="button"
          class="p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0"
          :class="appStore.audioAlertsEnabled
            ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-xs'
            : 'bg-space-850 text-slate-300 hover:text-white border-space-700 hover:bg-space-800'"
          :title="appStore.audioAlertsEnabled ? 'เปิดเสียงเตือน AOS อยู่ (คลิกเพื่อปิด)' : 'ปิดเสียงเตือน AOS อยู่ (คลิกเพื่อเปิด)'"
          @click="appStore.toggleAudioAlerts"
        >
          <Bell v-if="appStore.audioAlertsEnabled" class="w-4 h-4 text-emerald-400" />
          <BellOff v-else class="w-4 h-4 opacity-70" />
        </button>

        <!-- Mock Data Toggle (สำหรับนักพัฒนา) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex-shrink-0"
          :class="appStore.mockMode
            ? 'bg-amber-950/70 text-amber-300 border-amber-600 shadow-xs'
            : 'bg-space-850 text-slate-200 border-space-700 hover:bg-space-800 hover:text-white'"
          title="สลับโหมดการเชื่อมต่อระหว่างข้อมูลจำลอง (Mock) และเซิร์ฟเวอร์จริง"
          @click="appStore.toggleMockMode"
        >
          <Database class="w-3.5 h-3.5" />
          <span>{{ appStore.mockMode ? 'Mock Data' : 'Live API' }}</span>
        </button>

        <!-- Auto-Refresh Toggle Button (รอบรีเฟรชข้อมูลอัตโนมัติ) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex-shrink-0"
          :class="appStore.autoRefreshSeconds > 0
            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600 shadow-xs'
            : 'bg-space-850 text-slate-200 border-space-700 hover:bg-space-800 hover:text-white'"
          :title="appStore.autoRefreshSeconds > 0 ? `อัปเดตอัตโนมัติทุก ${appStore.autoRefreshSeconds} วินาที (คลิกเพื่อเปลี่ยนรอบ)` : 'เปิดการอัปเดตข้อมูลอัตโนมัติ (คลิกเพื่อเปิด)'"
          @click="cycleAutoRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="appStore.autoRefreshSeconds > 0 ? 'text-emerald-400 animate-spin' : 'opacity-60'" style="animation-duration: 3s;" />
          <span>Auto: {{ appStore.autoRefreshSeconds > 0 ? `${refreshCountdown}s` : 'ปิด' }}</span>
        </button>

        <!-- User Profile Information -->
        <div v-if="authStore.user" class="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-space-700 flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-space-800 text-slate-100 flex items-center justify-center font-bold text-xs border border-space-700 flex-shrink-0">
            <User class="w-4 h-4 text-cyan-300" />
          </div>
          <div class="hidden xl:block text-left text-xs leading-tight">
            <span class="font-bold text-white block truncate max-w-[140px]">
              {{ authStore.displayName }}
            </span>
            <span class="text-xs font-bold text-cyan-300 uppercase font-mono">
              Role: {{ authStore.userRole }}
            </span>
          </div>

          <!-- Sign Out Button -->
          <button
            type="button"
            class="ml-0.5 p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 transition-colors cursor-pointer flex-shrink-0"
            title="ออกจากระบบ"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
