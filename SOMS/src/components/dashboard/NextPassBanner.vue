<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/NextPassBanner.vue
 * วัตถุประสงค์: แบนเนอร์นับถอยหลังรอบพาสถัดไปแบบเรียลไทม์ (Next Pass Live Countdown)
 * แสดงข้อมูลรอบพาสที่กำลังจะมาถึง พร้อมเวลาถอยหลัง และสถานะขณะกำลังผ่านสถานี (In-Pass)
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Orbit,
  Radio,
  Clock,
  Compass,
  FilePlus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Bell,
  BellOff
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  passes: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const appStore = useAppStore()
const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// แปลงข้อมูลพาสทั้งหมดให้อยู่ในรูป Date object
const parsedPasses = computed(() => {
  return props.passes.map(p => {
    // สร้าง Date object จาก UTC date/time
    const aosStr = `${p.aos_date_utc}T${p.aos_time_utc}Z`
    const losStr = `${p.los_date_utc}T${p.los_time_utc}Z`
    const aosDate = new Date(aosStr)
    const losDate = new Date(losStr)
    const satName = Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : 'NAPA-2 N'

    return {
      ...p,
      satName,
      aosDate,
      losDate,
      maxElevation: Number(p.maxEl) || 0
    }
  }).sort((a, b) => a.aosDate - b.aosDate)
})

// ค้นหารอบพาสที่กำลังเกิดขึ้น หรือรอบพาสถัดไปที่จะมาถึง
const currentOrNextPass = computed(() => {
  const currentTs = now.value.getTime()

  // 1. ตรวจสอบว่ามีพาสที่กำลังปฏิบัติการอยู่หรือไม่ (In-Pass)
  const active = parsedPasses.value.find(p => p.aosDate.getTime() <= currentTs && currentTs <= p.losDate.getTime())
  if (active) {
    return { ...active, isActive: true }
  }

  // 2. หากไม่มี ให้ค้นหาพาสที่กำลังจะมาถึงในอนาคตอันใกล้ที่สุด
  const next = parsedPasses.value.find(p => p.aosDate.getTime() > currentTs)
  if (next) {
    return { ...next, isActive: false }
  }

  // 3. หากผ่านไปหมดแล้ว ให้แสดงพาสล่าสุด
  return parsedPasses.value[0] || null
})

// คำนวณเวลานับถอยหลัง หรือเวลาคงเหลือของพาส
const countdown = computed(() => {
  if (!currentOrNextPass.value) return { hours: '00', minutes: '00', seconds: '00', isPassed: true, progress: 0 }

  const currentTs = now.value.getTime()
  const pass = currentOrNextPass.value

  if (pass.isActive) {
    // กำลังผ่านสถานี: คำนวณเวลาคงเหลือก่อน LOS
    const remainingMs = Math.max(0, pass.losDate.getTime() - currentTs)
    const totalMs = pass.losDate.getTime() - pass.aosDate.getTime()
    const progress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100))

    const mins = Math.floor(remainingMs / 60000)
    const secs = Math.floor((remainingMs % 60000) / 1000)
    return {
      hours: '00',
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
      isActive: true,
      progress: Math.round(progress)
    }
  } else {
    // ยังไม่ถึงเวลา: นับถอยหลังสู่ AOS
    const diffMs = pass.aosDate.getTime() - currentTs
    if (diffMs <= 0) {
      return { hours: '00', minutes: '00', seconds: '00', isPassed: true, progress: 100 }
    }

    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    const secs = Math.floor((diffMs % 60000) / 1000)

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
      isActive: false,
      progress: 0
    }
  }
})

const navigateToPlanner = () => {
  router.push('/planner')
}

const navigateToReport = () => {
  if (currentOrNextPass.value) {
    router.push(`/reports/new?pass=${currentOrNextPass.value.id}`)
  } else {
    router.push('/reports/new')
  }
}
</script>

<template>
  <div
    v-if="currentOrNextPass"
    class="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-md p-4 sm:p-5"
    :class="countdown.isActive
      ? 'bg-gradient-to-r from-emerald-950/90 via-space-900 to-[#071c3b] border-emerald-500/50 text-white shadow-emerald-950/20'
      : 'bg-gradient-to-r from-sky-900/90 via-[#0b2b5c] to-[#081e40] border-sky-400/40 text-white shadow-sky-950/30'"
  >
    <!-- Background Tactical Grid Pattern -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>

    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- Left: Satellite & Pass Details -->
      <div class="space-y-2 flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Active Status Badge -->
          <div
            v-if="countdown.isActive"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500 text-slate-950 animate-pulse shadow-sm"
          >
            <Radio class="w-3.5 h-3.5" />
            <span>LIVE AOS IN-PASS (กำลังผ่านสถานี)</span>
          </div>

          <div
            v-else
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-blue-500/20 border border-blue-400/40 text-blue-300"
          >
            <Clock class="w-3.5 h-3.5 text-blue-400" />
            <span>NEXT SCHEDULED PASS (รอบผ่านถัดไป)</span>
          </div>

          <span class="text-sm font-mono font-bold text-sky-200">
            NORAD ID: {{ currentOrNextPass.satellite_id }}
          </span>

          <!-- Audio Alert Toggle on Banner -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border-2 transition-colors cursor-pointer"
            :class="appStore.audioAlertsEnabled
              ? 'bg-sky-500/25 border-sky-400/50 text-white'
              : 'bg-black/30 border-white/20 text-sky-200 hover:text-white'"
            title="เปิด/ปิดเสียงเตือนอัตโนมัติเมื่อดาวเทียมเริ่มผ่านสถานี"
            @click="appStore.toggleAudioAlerts"
          >
            <Bell v-if="appStore.audioAlertsEnabled" class="w-3.5 h-3.5 text-sky-300" />
            <BellOff v-else class="w-3.5 h-3.5 opacity-70" />
            <span>{{ appStore.audioAlertsEnabled ? 'เสียงเตือน: เปิด' : 'เสียงเตือน: ปิด' }}</span>
          </button>
        </div>

        <div class="flex items-baseline gap-3 flex-wrap">
          <h2 class="text-2xl sm:text-3xl font-bold font-prompt text-white tracking-tight flex items-center gap-2">
            <Orbit class="w-7 h-7 text-cyan-300" />
            <span>{{ currentOrNextPass.satName }}</span>
          </h2>
          <span class="text-base font-bold text-cyan-200 font-prompt">
            {{ currentOrNextPass.sat_seq ? `DayPass-${currentOrNextPass.sat_seq}` : 'Operational Pass' }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div class="bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-sky-400/20">
            <span class="text-sky-200 block text-xs font-bold">ช่วงเวลาผ่าน (เวลาไทย):</span>
            <span class="font-mono font-bold text-sm sm:text-base text-white">
              {{ currentOrNextPass.aos_time_local }} – {{ currentOrNextPass.los_time_local }}
            </span>
          </div>

          <div class="bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-sky-400/20">
            <span class="text-sky-200 block text-xs font-bold">เวลามาตรฐานสากล (UTC):</span>
            <span class="font-mono font-bold text-sm sm:text-base text-cyan-200">
              {{ currentOrNextPass.aos_time_utc }} (UTC)
            </span>
          </div>

          <div class="bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-sky-400/20">
            <span class="text-sky-200 block text-xs font-bold">มุมยกสูงสุด (Max Elev):</span>
            <span class="font-mono font-bold text-sm sm:text-base" :class="currentOrNextPass.maxElevation < 5 ? 'text-rose-300' : 'text-emerald-300'">
              {{ currentOrNextPass.maxEl }}° {{ currentOrNextPass.maxElevation < 5 ? '(Abort)' : '(Good ✓)' }}
            </span>
          </div>

          <div class="bg-black/40 backdrop-blur-xs p-2.5 rounded-xl border border-sky-400/20">
            <span class="text-sky-200 block text-xs font-bold">ระยะเวลาโคจรผ่าน:</span>
            <span class="font-mono font-bold text-sm sm:text-base text-white">
              {{ currentOrNextPass.duration_min }}น. {{ currentOrNextPass.duration_sec }}วิ.
            </span>
          </div>
        </div>

        <!-- In-Pass Progress Bar -->
        <div v-if="countdown.isActive" class="pt-2">
          <div class="flex justify-between text-xs sm:text-sm text-emerald-300 font-mono font-bold mb-1">
            <span>AOS ผ่านสถานีไปแล้ว</span>
            <span>เหลือเวลาอีก {{ countdown.minutes }}:{{ countdown.seconds }} น.</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-emerald-400/50">
            <div
              class="bg-emerald-400 h-2.5 transition-all duration-1000 ease-linear rounded-full"
              :style="{ width: `${countdown.progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Right: Big Tactical Countdown Digits & Action Buttons -->
      <div class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0 lg:pl-6 lg:border-l lg:border-white/10 flex-shrink-0">
        <div class="text-left sm:text-right">
          <span class="text-xs sm:text-sm font-bold text-sky-100 uppercase tracking-wider block font-prompt">
            {{ countdown.isActive ? 'เวลาคงเหลือก่อนสัญญาณหลุด (LOS)' : 'นับถอยหลังสัญญาณมาถึง (AOS)' }}
          </span>
          <div class="flex items-center gap-1.5 font-mono font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-white mt-1">
            <span class="bg-black/50 px-2.5 py-1 rounded-xl border border-white/20">{{ countdown.hours }}</span>
            <span class="text-cyan-400 animate-pulse">:</span>
            <span class="bg-black/50 px-2.5 py-1 rounded-xl border border-white/20">{{ countdown.minutes }}</span>
            <span class="text-cyan-400 animate-pulse">:</span>
            <span class="bg-black/50 px-2.5 py-1 rounded-xl border border-white/20" :class="countdown.isActive ? 'text-emerald-300' : 'text-cyan-300'">
              {{ countdown.seconds }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold text-white border border-white/25 transition-all shadow-xs"
            @click="navigateToPlanner"
          >
            <Compass class="w-4 h-4 text-cyan-300" />
            <span>วางแผนใน Planner</span>
          </button>

          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-sm font-bold text-white transition-all shadow-md shadow-sky-500/25"
            @click="navigateToReport"
          >
            <FilePlus class="w-4 h-4" />
            <span>สร้างรายงานพาสนี้</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
