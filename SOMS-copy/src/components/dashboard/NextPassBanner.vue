<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/NextPassBanner.vue
 * วัตถุประสงค์: แบนเนอร์นับถอยหลังรอบพาสถัดไปแบบเรียลไทม์ (Next Pass Live Countdown)
 * ธีมดำเทาไททาเนียม คอนทราสต์คมชัดทุกจุด อ่านง่ายแม้มองจากระยะไกล
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
  Bell,
  BellOff
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

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
  const p = currentOrNextPass.value

  if (p.isActive) {
    // กำลังผ่านสถานี (In-Pass) -> นับเวลาที่เหลือก่อน LOS
    const remainingMs = Math.max(0, p.losDate.getTime() - currentTs)
    const totalMs = p.losDate.getTime() - p.aosDate.getTime()
    const progress = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 100

    const totalSec = Math.floor(remainingMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
      isActive: true,
      isPassed: false,
      progress: Math.round(progress),
      label: 'เวลาผ่านสถานีคงเหลือ (Before LOS)'
    }
  } else {
    // รอพาสถัดไป (Upcoming) -> นับถอยหลังสู่ AOS
    const diffMs = p.aosDate.getTime() - currentTs

    if (diffMs <= 0) {
      return { hours: '00', minutes: '00', seconds: '00', isActive: false, isPassed: true, progress: 100, label: 'พาสสิ้นสุดแล้ว' }
    }

    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
      isActive: false,
      isPassed: false,
      progress: 0,
      label: 'นับถอยหลังสู่รอบพาสถัดไป (AOS Countdown)'
    }
  }
})

const navigateToPasses = () => {
  router.push('/passes')
}

const navigateToCreateReport = () => {
  if (currentOrNextPass.value) {
    router.push(`/reports/new?pass=${currentOrNextPass.value.id || ''}`)
  } else {
    router.push('/reports/new')
  }
}
</script>

<template>
  <div
    v-if="currentOrNextPass"
    class="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl p-4 sm:p-6"
    :class="countdown.isActive
      ? 'bg-gradient-to-r from-emerald-950/90 via-space-900 to-space-950 border-emerald-500/60 shadow-emerald-950/20'
      : 'bg-gradient-to-r from-space-850 via-space-900 to-space-950 border-space-700 shadow-black/40'"
  >
    <!-- Background Tactical Grid Pattern -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_70%)] pointer-events-none"></div>

    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <!-- Left: Satellite & Pass Details -->
      <div class="space-y-2.5 flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Active Status Badge -->
          <div
            v-if="countdown.isActive"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black font-mono bg-emerald-400 text-slate-950 animate-pulse shadow-sm"
          >
            <Radio class="w-4 h-4" />
            <span>LIVE AOS IN-PASS (กำลังผ่านสถานี)</span>
          </div>

          <div
            v-else
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold font-mono bg-space-800 border border-space-600 text-slate-100 shadow-xs"
          >
            <Clock class="w-4 h-4 text-cyan-300" />
            <span>NEXT SCHEDULED PASS (รอบผ่านถัดไป)</span>
          </div>

          <span class="text-xs sm:text-sm font-mono text-slate-300 font-semibold">
            NORAD ID: {{ currentOrNextPass.satellite_id }}
          </span>

          <!-- Audio Alert Toggle on Banner -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer"
            :class="appStore.audioAlertsEnabled
              ? 'bg-zinc-800 border-zinc-600 text-emerald-400'
              : 'bg-space-850 border-space-700 text-slate-300 hover:text-white'"
            :title="appStore.audioAlertsEnabled ? 'เปิดเสียงเตือนอัตโนมัติเมื่อดาวเทียมเริ่มผ่านสถานี' : 'ปิดเสียงเตือนอยู่'"
            @click="appStore.toggleAudioAlerts"
          >
            <Bell v-if="appStore.audioAlertsEnabled" class="w-3.5 h-3.5 text-emerald-400" />
            <BellOff v-else class="w-3.5 h-3.5 opacity-60" />
            <span class="font-prompt">{{ appStore.audioAlertsEnabled ? 'เสียงเตือน: เปิด' : 'เสียงเตือน: ปิด' }}</span>
          </button>
        </div>

        <div class="flex items-baseline gap-3 flex-wrap">
          <h2 class="text-xl sm:text-2xl font-black font-prompt text-white tracking-tight flex items-center gap-2">
            <Orbit class="w-6 h-6 text-cyan-400" />
            <span>{{ currentOrNextPass.satName }}</span>
          </h2>
          <span class="text-sm sm:text-base font-bold text-amber-300 font-prompt">
            {{ currentOrNextPass.sat_seq ? `DayPass-${currentOrNextPass.sat_seq}` : 'Operational Pass' }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div class="bg-space-950/90 backdrop-blur-xs p-3 rounded-xl border border-space-700">
            <span class="text-slate-300 block text-xs font-prompt font-semibold">ช่วงเวลาผ่าน (เวลาไทย):</span>
            <span class="font-mono font-black text-white text-xs sm:text-sm mt-0.5 block">
              {{ currentOrNextPass.aos_time_local }} – {{ currentOrNextPass.los_time_local }}
            </span>
          </div>

          <div class="bg-space-950/90 backdrop-blur-xs p-3 rounded-xl border border-space-700">
            <span class="text-slate-300 block text-xs font-prompt font-semibold">เวลาสากล (UTC):</span>
            <span class="font-mono font-black text-white text-xs sm:text-sm mt-0.5 block">
              {{ currentOrNextPass.aos_time_utc }} (UTC)
            </span>
          </div>

          <div class="bg-space-950/90 backdrop-blur-xs p-3 rounded-xl border border-space-700">
            <span class="text-slate-300 block text-xs font-prompt font-semibold">มุมยกสูงสุด (Max El):</span>
            <span class="font-mono font-black text-white text-xs sm:text-sm flex items-center gap-1 mt-0.5">
              <span>{{ currentOrNextPass.maxElevation }}°</span>
              <span v-if="currentOrNextPass.maxElevation < 5" class="text-xs text-rose-400 font-bold">(Abort)</span>
              <span v-else class="text-xs text-emerald-400 font-bold">(Ready)</span>
            </span>
          </div>

          <div class="bg-space-950/90 backdrop-blur-xs p-3 rounded-xl border border-space-700">
            <span class="text-slate-300 block text-xs font-prompt font-semibold">ระยะเวลาผ่านสถานี:</span>
            <span class="font-mono font-black text-white text-xs sm:text-sm mt-0.5 block">
              {{ currentOrNextPass.duration_min }}น. {{ currentOrNextPass.duration_sec }}วิ.
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Real-time Countdown Timer & Action Buttons -->
      <div class="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-space-700">
        <div class="text-left lg:text-right">
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider block font-prompt">
            {{ countdown.label }}
          </span>

          <div class="flex items-center gap-2 mt-1.5 font-mono">
            <div class="bg-space-950/95 px-3 py-2 rounded-xl border border-space-700 text-center min-w-[56px] shadow-md">
              <span class="text-3xl sm:text-4xl font-black text-white tracking-tight">{{ countdown.hours }}</span>
              <span class="block text-xs text-slate-300 font-bold uppercase mt-0.5">ชม.</span>
            </div>
            <span class="text-2xl font-black text-cyan-400 animate-pulse">:</span>
            <div class="bg-space-950/95 px-3 py-2 rounded-xl border border-space-700 text-center min-w-[56px] shadow-md">
              <span class="text-3xl sm:text-4xl font-black text-white tracking-tight">{{ countdown.minutes }}</span>
              <span class="block text-xs text-slate-300 font-bold uppercase mt-0.5">นาที</span>
            </div>
            <span class="text-2xl font-black text-cyan-400 animate-pulse">:</span>
            <div class="bg-space-950/95 px-3 py-2 rounded-xl border border-space-700 text-center min-w-[56px] shadow-md">
              <span class="text-3xl sm:text-4xl font-black text-white tracking-tight">{{ countdown.seconds }}</span>
              <span class="block text-xs text-slate-300 font-bold uppercase mt-0.5">วินาที</span>
            </div>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer font-prompt"
            @click="navigateToPasses"
          >
            <Compass class="w-4 h-4 text-cyan-300" />
            <span>ตารางพาสทั้งหมด</span>
          </button>

          <button
            type="button"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer font-prompt"
            @click="navigateToCreateReport"
          >
            <FilePlus class="w-4 h-4 text-emerald-300" />
            <span>บันทึกภารกิจ</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
