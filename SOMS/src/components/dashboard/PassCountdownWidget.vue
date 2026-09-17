<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/PassCountdownWidget.vue
 * วัตถุประสงค์: วิดเจ็ตนับถอยหลังรอบพาสดาวเทียมสด (Live Pass Countdown Widget)
 * สอดคล้องกับ DashboardCountdown ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Timer,
  Radio,
  Clock,
  Compass,
  MapPin,
  FilePlus,
  ArrowUpRight,
  Sparkles,
  Signal,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
  passes: {
    type: Array,
    default: () => []
  },
  editing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['locateSat', 'openPlanner'])

const router = useRouter()
const now = ref(new Date())
let timer = null

// ตัวเลือกลิสต์ดาวเทียมและสถานี
const selectedSatelliteId = ref('all') // 'all' | '48963' | '46320'
const selectedLocation = ref('bma') // 'bma' | 'chiangmai' | 'surat'

const LOCATIONS = [
  { id: 'bma', name: 'BMA Ground Station (ศปอ.ทอ.)', lat: 13.91, lng: 100.60 },
  { id: 'chiangmai', name: 'Chiang Mai Tracking Post', lat: 18.78, lng: 98.98 },
  { id: 'surat', name: 'Surat Thani Observation Post', lat: 9.14, lng: 99.33 }
]

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ประมวลผลรอบพาสทั้งหมด
const processedPasses = computed(() => {
  return props.passes.map(p => {
    const aosStr = `${p.aos_date_utc}T${p.aos_time_utc}Z`
    const losStr = `${p.los_date_utc}T${p.los_time_utc}Z`
    const aosDate = new Date(aosStr)
    const losDate = new Date(losStr)
    const satName = Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : Number(p.satellite_id) === 48963 ? 'NAPA-2 N' : (p.sat_name || `SAT-${p.satellite_id}`)
    const maxElevation = Number(p.maxEl) || 0

    return {
      ...p,
      satName,
      aosDate,
      losDate,
      maxElevation
    }
  }).sort((a, b) => a.aosDate - b.aosDate)
})

// กรองตามดาวเทียมที่เลือก
const filteredPasses = computed(() => {
  if (selectedSatelliteId.value === 'all') return processedPasses.value
  return processedPasses.value.filter(p => String(p.satellite_id) === String(selectedSatelliteId.value))
})

// ค้นหารอบพาสที่กำลัง In-Contact หรือรอบพาสถัดไป
const activeOrNextPass = computed(() => {
  const currentTs = now.value.getTime()

  // 1. ตรวจสอบว่ากำลัง In-Contact หรือไม่
  const inContact = filteredPasses.value.find(p => p.aosDate.getTime() <= currentTs && currentTs <= p.losDate.getTime())
  if (inContact) {
    return { ...inContact, isInContact: true }
  }

  // 2. หากไม่มี ให้ค้นหาพาสถัดไปที่กำลังจะมาถึง
  const upcoming = filteredPasses.value.find(p => p.aosDate.getTime() > currentTs)
  if (upcoming) {
    return { ...upcoming, isInContact: false }
  }

  // 3. หากผ่านไปหมดแล้ว ให้แสดงพาสแรก
  return filteredPasses.value[0] || null
})

// คำนวณเวลานับถอยหลัง
const countdown = computed(() => {
  if (!activeOrNextPass.value) {
    return { hours: '00', minutes: '00', seconds: '00', totalSeconds: 0, progress: 0 }
  }

  const p = activeOrNextPass.value
  const currentTs = now.value.getTime()

  if (p.isInContact) {
    // กำลังอยู่ในรอบพาส (AOS -> LOS)
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
      totalSeconds: totalSec,
      progress
    }
  } else {
    // กำลังรอเข้าสู่รอบพาส (Countdown to AOS)
    const diffMs = Math.max(0, p.aosDate.getTime() - currentTs)
    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    return {
      hours: String(h).padStart(2, '0'),
      minutes: String(m).padStart(2, '0'),
      seconds: String(s).padStart(2, '0'),
      totalSeconds: totalSec,
      progress: 0
    }
  }
})

// ข้อมูลสถานีที่เลือก
const currentLocation = computed(() => {
  return LOCATIONS.find(l => l.id === selectedLocation.value) || LOCATIONS[0]
})
</script>

<template>
  <div class="w-full h-full flex flex-col flex-1 min-h-0 bg-transparent overflow-hidden">
    <!-- Tactical Sub-Bar (สถานะ AOS และการเลือกสถานี/ดาวเทียม) -->
    <div class="px-3.5 py-2 bg-[#132238] border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
      <div class="flex items-center gap-2">
        <span
          v-if="activeOrNextPass?.isInContact"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/90 border border-emerald-500 text-emerald-300 animate-pulse font-mono"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          AOS IN-CONTACT
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#182840] border border-slate-600 text-slate-200 font-mono"
        >
          NEXT PASS QUEUED
        </span>
        <span class="text-xs text-slate-300 font-prompt hidden sm:inline">
          {{ currentLocation.name }}
        </span>
      </div>

      <!-- Quick Selector Controls -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Satellite Selector -->
        <select
          v-model="selectedSatelliteId"
          class="px-2.5 py-1 text-xs rounded-lg border border-slate-600 bg-[#182840] text-slate-100 font-prompt font-medium focus:outline-none focus:border-cyan-500 shadow-inner"
        >
          <option value="all">ดาวเทียมทั้งหมด (All)</option>
          <option value="48963">NAPA-2 N (48963)</option>
          <option value="46320">NAPA-1 N (46320)</option>
        </select>

        <!-- Ground Station Selector -->
        <select
          v-model="selectedLocation"
          class="px-2.5 py-1 text-xs rounded-lg border border-slate-600 bg-[#182840] text-slate-100 font-prompt font-medium focus:outline-none focus:border-cyan-500 shadow-inner"
        >
          <option v-for="loc in LOCATIONS" :key="loc.id" :value="loc.id">
            {{ loc.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Main Widget Body -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
      <!-- Target Satellite & Contact Window Title -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-750/60">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-bold font-prompt text-cyan-300">
              {{ activeOrNextPass?.isInContact ? 'สัญญาณกำลังส่ง-รับ (In-Pass)' : 'พาสถัดไปที่จะมาถึง (Next Pass)' }}
            </span>
            <span class="text-xs text-slate-300 font-prompt">·</span>
            <span class="text-base font-bold font-prompt text-white">
              {{ activeOrNextPass?.satName || 'NAPA-2 N' }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-200 font-prompt font-normal mt-1 flex items-center gap-1.5">
            <MapPin class="w-4 h-4 text-emerald-400" />
            <span>{{ currentLocation.name }}</span>
          </p>
        </div>

        <!-- Max Elevation Badge -->
        <div class="flex items-center gap-2">
          <div class="px-3.5 py-2 rounded-xl bg-[#182840] border border-slate-600/60 text-right">
            <p class="text-xs text-slate-300 font-prompt font-medium">มุมยกสูงสุด (Max El)</p>
            <p class="text-base font-bold font-mono text-amber-300">
              {{ activeOrNextPass?.maxElevation || 0 }}°
            </p>
          </div>
        </div>
      </div>

      <!-- Grand Digital Countdown Display -->
      <div class="py-2 text-center">
        <p class="text-xs sm:text-sm uppercase tracking-wider text-slate-200 font-semibold mb-2.5 font-prompt">
          {{ activeOrNextPass?.isInContact ? 'เวลาคงเหลือก่อนสัญญาณขาดหาย (LOS COUNTDOWN)' : 'เวลานับถอยหลังเข้าสู่รอบพาส (AOS COUNTDOWN)' }}
        </p>

        <!-- Big Bold Digital Clocks -->
        <div class="inline-flex items-center justify-center gap-2 sm:gap-4 bg-[#101c2e] px-7 py-4 rounded-2xl border border-slate-600/70 shadow-inner">
          <div class="text-center">
            <div class="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-white">
              {{ countdown.hours }}
            </div>
            <span class="text-xs uppercase tracking-wide text-slate-300 font-semibold font-prompt">ชั่วโมง</span>
          </div>
          <span class="text-3xl sm:text-4xl font-mono font-bold text-slate-400 -mt-4">:</span>
          <div class="text-center">
            <div class="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-cyan-300">
              {{ countdown.minutes }}
            </div>
            <span class="text-xs uppercase tracking-wide text-slate-300 font-semibold font-prompt">นาที</span>
          </div>
          <span class="text-3xl sm:text-4xl font-mono font-bold text-slate-400 -mt-4">:</span>
          <div class="text-center">
            <div class="text-3xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight text-emerald-300">
              {{ countdown.seconds }}
            </div>
            <span class="text-xs uppercase tracking-wide text-slate-300 font-semibold font-prompt">วินาที</span>
          </div>
        </div>

        <!-- In-Pass Progress Bar (ถ้าอยู่ในรอบพาส) -->
        <div v-if="activeOrNextPass?.isInContact" class="mt-4 max-w-md mx-auto space-y-1.5">
          <div class="h-2.5 w-full rounded-full bg-[#182840] overflow-hidden border border-slate-600/60">
            <div
              class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-1000 rounded-full"
              :style="{ width: `${countdown.progress}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs font-prompt text-slate-200 font-semibold px-1">
            <span>AOS {{ activeOrNextPass?.aos_time_local }}</span>
            <span class="text-emerald-300 font-bold">สัญญาณกำลังทำงาน {{ Math.round(countdown.progress) }}%</span>
            <span>LOS {{ activeOrNextPass?.los_time_local }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Detailed Meta Grid (ตัวหนังสือใหญ่ชัดเจน คอนทราสต์สูง) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-700/60 text-xs font-prompt">
        <div class="p-2.5 rounded-xl bg-[#182840] border border-slate-600/60">
          <span class="text-slate-300 text-xs block font-medium">เวลา AOS (UTC)</span>
          <p class="font-mono text-white font-bold text-sm mt-0.5">
            {{ activeOrNextPass?.aos_time_utc || '—' }}
          </p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#182840] border border-slate-600/60">
          <span class="text-slate-300 text-xs block font-medium">เวลา LOS (UTC)</span>
          <p class="font-mono text-white font-bold text-sm mt-0.5">
            {{ activeOrNextPass?.los_time_utc || '—' }}
          </p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#182840] border border-slate-600/60">
          <span class="text-slate-300 text-xs block font-medium">เวลาท้องถิ่น (Local)</span>
          <p class="font-mono text-emerald-300 font-bold text-sm mt-0.5">
            {{ activeOrNextPass?.aos_time_local || '—' }}
          </p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#182840] border border-slate-600/60">
          <span class="text-slate-300 text-xs block font-medium">ระยะเวลาพาส</span>
          <p class="font-mono text-white font-bold text-sm mt-0.5">
            {{ activeOrNextPass ? `${activeOrNextPass.duration_min}น. ${activeOrNextPass.duration_sec}วิ.` : '—' }}
          </p>
        </div>
      </div>

      <!-- RF Link & Frequency Specs (เติมเต็มข้อมูลการสื่อสาร ตัวหนังสือคมชัด) -->
      <div class="p-3 rounded-xl bg-[#132238] border border-slate-600/60 text-xs font-prompt">
        <div class="flex items-center justify-between text-xs text-slate-200 mb-2">
          <span class="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Signal class="w-4 h-4 text-cyan-400" />
            <span>พารามิเตอร์ลิงก์สัญญาณ RF (Ground Station Link)</span>
          </span>
          <span class="text-emerald-300 font-mono text-xs font-bold">CARRIER LOCK: NOMINAL</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div class="bg-[#182840] p-2 rounded-lg border border-slate-600/60">
            <span class="text-slate-300 text-xs block font-prompt font-medium">UHF Uplink</span>
            <span class="text-white font-bold text-sm">437.525 MHz</span>
          </div>
          <div class="bg-[#182840] p-2 rounded-lg border border-slate-600/60">
            <span class="text-slate-300 text-xs block font-prompt font-medium">S-Band Downlink</span>
            <span class="text-cyan-300 font-bold text-sm">2245.00 MHz</span>
          </div>
          <div class="bg-[#182840] p-2 rounded-lg border border-slate-600/60">
            <span class="text-slate-300 text-xs block font-prompt font-medium">X-Band Payload</span>
            <span class="text-amber-300 font-bold text-sm">8150.00 MHz</span>
          </div>
          <div class="bg-[#182840] p-2 rounded-lg border border-slate-600/60">
            <span class="text-slate-300 text-xs block font-prompt font-medium">Link SNR</span>
            <span class="text-emerald-300 font-bold text-sm">+14.2 dB</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Pass Schedule Mini-Table (เติมเต็มพื้นที่ล่างให้สมบูรณ์ ตัวหนังสืออ่านง่าย) -->
      <div class="space-y-2 pt-1 border-t border-slate-700/60">
        <div class="flex items-center justify-between text-xs sm:text-sm font-prompt text-slate-200">
          <span class="font-bold text-white">ตารางรอบพาสวันนี้ (Today's Passes Queue)</span>
          <span class="font-semibold text-slate-300">แสดง {{ filteredPasses.length }} พาส</span>
        </div>

        <div class="space-y-1.5 overflow-y-auto max-h-[130px] pr-1">
          <div
            v-for="(p, idx) in filteredPasses"
            :key="p.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-prompt transition-colors"
            :class="p.id === activeOrNextPass?.id ? 'bg-cyan-950/70 border border-cyan-500 text-white font-semibold' : 'bg-[#182840] border border-slate-600/60 text-slate-200'"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-5 text-center font-mono text-xs font-bold text-slate-300">#{{ idx + 1 }}</span>
              <span class="font-bold text-white">{{ p.satName }}</span>
              <span class="text-xs font-mono text-slate-200 font-semibold">AOS: {{ p.aos_time_local }}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="text-xs text-slate-200 font-mono font-medium">ระยะเวลา {{ p.duration_min }}น.</span>
              <span
                class="px-2 py-0.5 rounded text-xs font-mono font-bold"
                :class="p.maxElevation >= 60 ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : p.maxElevation >= 30 ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-[#132238] text-slate-200 border border-slate-600'"
              >
                {{ p.maxElevation }}° El
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-700/60">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-prompt font-medium transition-colors cursor-pointer"
          @click="router.push('/planner')"
        >
          <span>เปิดระบบจำลอง SAT PASS PLANNER</span>
          <ArrowUpRight class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2c47] hover:bg-[#223a5e] text-white text-xs font-medium font-prompt border border-slate-600/70 shadow-sm transition-all cursor-pointer"
          @click="router.push('/reports/new')"
        >
          <FilePlus class="w-3.5 h-3.5 text-cyan-300" />
          <span>บันทึกรายงานพาส</span>
        </button>
      </div>
    </div>
  </div>
</template>
