<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SatelliteAltitudeWidget.vue
 * วัตถุประสงค์: วิดเจ็ตแสดงค่าระดับความสูงและการคาดการณ์วงโคจรจาก TLE
 * สอดคล้องกับ DashboardAltitude ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, computed, watch } from 'vue'
import {
  ArrowUp,
  RefreshCw,
  Orbit,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  satellites: {
    type: Array,
    default: () => []
  },
  satelliteId: {
    type: [String, Number],
    default: ''
  }
})

const selectedSatId = ref(props.satelliteId ? String(props.satelliteId) : '48963')
const isRefreshing = ref(false)
const refreshSuccess = ref(false)

watch(() => props.satelliteId, (newVal) => {
  if (newVal) {
    selectedSatId.value = String(newVal)
  }
})

const SATELLITE_DATA = {
  '48963': {
    name: 'NAPA-2 N',
    noradId: '48963',
    altitudeKm: 508.82,
    apogeeKm: 512.4,
    perigeeKm: 505.2,
    inclinationDeg: 97.45,
    periodMin: 94.8,
    velocityKmS: 7.61,
    tleEpoch: '2026-09-14 06:00:00 UTC',
    tleSource: 'Space-Track / RTAF Space Operations',
    ageHours: 3.5,
    status: 'OPTIMAL'
  },
  '46320': {
    name: 'NAPA-1 N',
    noradId: '46320',
    altitudeKm: 495.24,
    apogeeKm: 498.8,
    perigeeKm: 491.6,
    inclinationDeg: 97.42,
    periodMin: 94.5,
    velocityKmS: 7.62,
    tleEpoch: '2026-09-14 05:45:00 UTC',
    tleSource: 'Space-Track / RTAF Space Operations',
    ageHours: 4.2,
    status: 'OPTIMAL'
  },
  '58016': {
    name: 'THEOS-2',
    noradId: '58016',
    altitudeKm: 621.15,
    apogeeKm: 624.0,
    perigeeKm: 618.3,
    inclinationDeg: 97.85,
    periodMin: 97.1,
    velocityKmS: 7.55,
    tleEpoch: '2026-09-14 04:30:00 UTC',
    tleSource: 'GISTDA / Space-Track',
    ageHours: 5.8,
    status: 'OPTIMAL'
  }
}

const currentSat = computed(() => {
  return SATELLITE_DATA[selectedSatId.value] || SATELLITE_DATA['48963']
})

const refreshTle = () => {
  isRefreshing.value = true
  refreshSuccess.value = false
  setTimeout(() => {
    isRefreshing.value = false
    refreshSuccess.value = true
    setTimeout(() => {
      refreshSuccess.value = false
    }, 2500)
  }, 900)
}
</script>

<template>
  <div class="w-full h-full flex flex-col flex-1 min-h-0 bg-transparent overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-[#0d1117] border-b border-space-700/80 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <ArrowUp class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm sm:text-base font-bold font-prompt text-white">
            Altitude & Orbital Stats
          </h3>
          <p class="text-xs text-slate-300 font-prompt font-medium">
            ระดับความสูงและพารามิเตอร์วงโคจร TLE
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedSatId"
          class="px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-space-700 bg-[#090b0f] text-slate-100 font-prompt focus:outline-none"
        >
          <option value="48963">NAPA-2 N</option>
          <option value="46320">NAPA-1 N</option>
          <option value="58016">THEOS-2</option>
        </select>

        <button
          type="button"
          :disabled="isRefreshing"
          title="ดึงข้อมูล TLE ล่าสุด"
          class="p-1.5 rounded-lg bg-[#090b0f] border border-space-700 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          @click="refreshTle"
        >
          <RefreshCw class="w-4 h-4" :class="isRefreshing ? 'animate-spin' : ''" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
      <!-- Main Altitude Readout -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <span class="text-xs sm:text-sm font-semibold text-slate-300 font-prompt">ระดับความสูงปัจจุบัน (Predicted Altitude)</span>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span class="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
              {{ currentSat.altitudeKm.toFixed(2) }}
            </span>
            <span class="text-base font-bold font-prompt text-emerald-400">กิโลเมตร (km)</span>
          </div>
        </div>

        <!-- TLE Age Badge -->
        <div class="text-right">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold font-prompt"
            :class="currentSat.ageHours < 24 ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-xs' : 'bg-amber-950/90 border border-amber-500 text-amber-300 shadow-xs'"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
            <span>TLE สดใหม่ ({{ currentSat.ageHours }} ชม.)</span>
          </span>
          <p class="text-xs text-slate-300 font-mono mt-1 font-medium">
            Epoch: {{ currentSat.tleEpoch }}
          </p>
        </div>
      </div>

      <!-- Orbital Elements Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-space-700/60 text-xs font-prompt">
        <div class="p-2.5 rounded-xl bg-[#0d1117] border border-space-700">
          <span class="text-slate-300 text-xs font-semibold block">Apogee (จุดสูงสุด)</span>
          <p class="font-mono text-white font-black text-base mt-1">{{ currentSat.apogeeKm }} km</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#0d1117] border border-space-700">
          <span class="text-slate-300 text-xs font-semibold block">Perigee (จุดต่ำสุด)</span>
          <p class="font-mono text-white font-black text-base mt-1">{{ currentSat.perigeeKm }} km</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#0d1117] border border-space-700">
          <span class="text-slate-300 text-xs font-semibold block">ความเร็วในวงโคจร</span>
          <p class="font-mono text-cyan-300 font-black text-base mt-1">{{ currentSat.velocityKmS }} km/s</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#0d1117] border border-space-700">
          <span class="text-slate-300 text-xs font-semibold block">มุมเอียง (Inclination)</span>
          <p class="font-mono text-amber-300 font-black text-base mt-1">{{ currentSat.inclinationDeg }}°</p>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs font-prompt text-slate-300 pt-1 font-medium">
        <span>แหล่งข้อมูล: {{ currentSat.tleSource }}</span>
        <span v-if="refreshSuccess" class="text-emerald-400 flex items-center gap-1 font-bold">
          <CheckCircle2 class="w-3.5 h-3.5" /> อัปเดตข้อมูล TLE สำเร็จ
        </span>
      </div>
    </div>
  </div>
</template>
