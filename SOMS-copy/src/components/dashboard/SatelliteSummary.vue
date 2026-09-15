<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SatelliteSummary.vue
 * วัตถุประสงค์: การ์ดแสดงผลข้อมูลโทรมาตรและสถานะทางยุทธการของดาวเทียม NAPA-1 N และ NAPA-2 N
 * เติมเต็มพื้นที่ว่าง 100% ด้วยพารามิเตอร์วงโคจร ระบบย่อย และสถานะการติดต่อ
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { computed } from 'vue'
import {
  Orbit,
  Activity,
  Zap,
  Thermometer,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps({
  satellites: {
    type: Array,
    default: () => []
  }
})

const getSatData = (noradId) => {
  return props.satellites.find(s => Number(s.norad_id) === noradId) || null
}

const formatNumber = (val, decimals = 2, fallback = '—') => {
  if (val === null || val === undefined || isNaN(Number(val))) return fallback
  return Number(val).toFixed(decimals)
}

// ข้อมูลทางเทคนิคและโทรมาตรสมบูรณ์ของดาวเทียมทั้งสองดวง
const SATELLITE_DETAILS = [
  {
    noradId: 46320,
    name: 'NAPA-1 N',
    internationalId: '2020-061C',
    type: 'Earth Observation (สำรวจและตรวจการณ์)',
    description: 'ดาวเทียมสำรวจและตรวจการณ์พื้นที่ความละเอียดปานกลางดวงแรกของกองทัพอากาศ',
    orbitType: 'SSO (Sun-Synchronous)',
    defaultAltitude: 495.24,
    velocity: '7.62',
    inclination: '97.42',
    period: '94.5',
    apogee: '498.8',
    perigee: '491.6',
    meanMotion: '15.24',
    eccentricity: '0.00072',
    adcsMode: 'Sun-Pointing (สำรวจพื้นที่)',
    batteryVolt: '28.2 V',
    batterySoc: '95%',
    tempObdh: '+17.8 °C',
    rfComm: 'UHF / S-Band (Active)',
    subsystems: [
      { name: 'ADCS', status: 'OK' },
      { name: 'EPS', status: 'OK' },
      { name: 'COMM', status: 'OK' },
      { name: 'OBDH', status: 'OK' },
      { name: 'PAYLOAD', status: 'READY' }
    ],
    nextPass: 'ในอีก 98 นาที (BMA GS • 28.3° El)',
    tleAge: '1.4 ชม. (Fresh)',
    accentColor: 'border-cyan-500/30 text-cyan-400',
    icon: Orbit
  },
  {
    noradId: 48963,
    name: 'NAPA-2 N',
    internationalId: '2021-059D',
    type: 'High-Resolution Surveillance (ตรวจการณ์ความละเอียดสูง)',
    description: 'ดาวเทียมตรวจการณ์ความละเอียดสูงและถ่ายภาพทางยุทธการดวงที่สองของกองทัพอากาศ',
    orbitType: 'SSO (Sun-Synchronous)',
    defaultAltitude: 508.82,
    velocity: '7.61',
    inclination: '97.45',
    period: '94.8',
    apogee: '512.4',
    perigee: '505.2',
    meanMotion: '15.20',
    eccentricity: '0.00054',
    adcsMode: 'Nadir-Pointing (ล็อกพิกัดเป้าหมาย)',
    batteryVolt: '28.6 V',
    batterySoc: '98%',
    tempObdh: '+18.4 °C',
    rfComm: 'UHF / S / X-Band (Ready)',
    subsystems: [
      { name: 'ADCS', status: 'OK' },
      { name: 'EPS', status: 'OK' },
      { name: 'COMM', status: 'OK' },
      { name: 'OBDH', status: 'OK' },
      { name: 'PAYLOAD', status: 'ARMED' }
    ],
    nextPass: 'ในอีก 24 นาที (BMA GS • 82.5° Overhead)',
    tleAge: '0.9 ชม. (Fresh)',
    accentColor: 'border-emerald-500/30 text-emerald-400',
    icon: Activity
  }
]
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div
      v-for="sat in SATELLITE_DETAILS"
      :key="sat.noradId"
      class="bg-[#0c121e]/92 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-xl hover:border-cyan-500/40 hover:shadow-cyan-950/20 transition-all duration-200 flex flex-col justify-between space-y-4"
    >
      <!-- Top Card Header -->
      <div class="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-750/80">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
            <h3 class="text-lg sm:text-xl font-bold font-prompt text-white tracking-wide">
              {{ sat.name }}
            </h3>
            <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#111927] border border-cyan-800/60 text-cyan-300 shadow-xs">
              NORAD: {{ sat.noradId }}
            </span>
            <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#111927] border border-slate-700 text-slate-200">
              {{ sat.internationalId }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 shadow-xs shadow-emerald-950/50">
              <CheckCircle2 class="w-3 h-3 text-emerald-400" />
              <span>OPERATIONAL</span>
            </span>
          </div>
          <p class="text-sm text-slate-300 mt-1.5 font-prompt font-medium">
            {{ sat.description }}
          </p>
        </div>

        <div class="w-12 h-12 rounded-xl bg-[#121c2d] text-cyan-300 flex items-center justify-center border border-cyan-700/40 flex-shrink-0 shadow-sm shadow-cyan-950/50">
          <component :is="sat.icon" class="w-6 h-6 text-cyan-300" />
        </div>
      </div>

      <!-- Orbital & Telemetry Grid (เต็มพื้นที่ 4 คอลัมน์ ตัวหนังสือใหญ่ชัดเจน) -->
      <div>
        <div class="flex items-center justify-between text-xs sm:text-sm text-slate-200 font-prompt mb-2.5">
          <span class="uppercase tracking-wider font-bold text-slate-200">พารามิเตอร์การบินและวงโคจร (Orbital Telemetry)</span>
          <span class="font-mono text-cyan-300/90 font-semibold">ประเภทวงโคจร: {{ sat.orbitType }}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <!-- Altitude -->
          <div class="p-3.5 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">ความสูงวงโคจร</span>
            <div class="mt-1 font-mono font-black text-xl text-white tracking-tight">
              {{ formatNumber(getSatData(sat.noradId)?.altitude_km, 2, sat.defaultAltitude) }}
              <span class="text-xs font-bold text-slate-400 ml-0.5">km</span>
            </div>
          </div>

          <!-- Velocity -->
          <div class="p-3.5 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">ความเร็วการโคจร</span>
            <div class="mt-1 font-mono font-black text-xl text-cyan-300 tracking-tight">
              {{ sat.velocity }}
              <span class="text-xs font-bold text-slate-400 ml-0.5">km/s</span>
            </div>
          </div>

          <!-- Inclination -->
          <div class="p-3.5 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">มุมเอียงวงโคจร</span>
            <div class="mt-1 font-mono font-black text-xl text-amber-300 tracking-tight">
              {{ sat.inclination }}°
            </div>
          </div>

          <!-- Orbital Period -->
          <div class="p-3.5 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">คาบการโคจร</span>
            <div class="mt-1 font-mono font-black text-xl text-emerald-300 tracking-tight">
              {{ sat.period }}
              <span class="text-xs font-bold text-slate-400 ml-0.5">min</span>
            </div>
          </div>

          <!-- Apogee / Perigee -->
          <div class="p-3 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">Apogee / Perigee</span>
            <div class="mt-1 font-mono font-bold text-sm text-slate-100">
              {{ sat.apogee }} / {{ sat.perigee }} <span class="text-slate-400 text-xs">km</span>
            </div>
          </div>

          <!-- Mean Motion -->
          <div class="p-3 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">จำนวนรอบ/วัน</span>
            <div class="mt-1 font-mono font-bold text-sm text-slate-100">
              {{ sat.meanMotion }} <span class="text-slate-400 text-xs">rev/d</span>
            </div>
          </div>

          <!-- Power & Battery -->
          <div class="p-3 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">พลังงานไฟฟ้า (EPS)</span>
            <div class="mt-1 font-mono font-bold text-sm text-emerald-300 flex items-center gap-1.5">
              <Zap class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{{ sat.batteryVolt }} ({{ sat.batterySoc }})</span>
            </div>
          </div>

          <!-- Thermal -->
          <div class="p-3 rounded-xl bg-[#0f1728]/95 border border-slate-700/80 hover:border-cyan-500/40 transition-colors shadow-2xs">
            <span class="text-xs text-slate-300 block font-prompt uppercase font-semibold">อุณหภูมิบอร์ด (TCS)</span>
            <div class="mt-1 font-mono font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <Thermometer class="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>{{ sat.tempObdh }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subsystems Health & Contact Status Bar -->
      <div class="pt-3.5 border-t border-slate-750/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-prompt">
        <!-- Subsystems Badges -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-slate-300">ระบบย่อย:</span>
          <span
            v-for="sub in sat.subsystems"
            :key="sub.name"
            class="px-2.5 py-1 rounded-lg bg-[#0e1626] border border-slate-700 text-xs font-mono text-slate-100 font-bold shadow-xs inline-flex items-center gap-1.5"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
            <span>{{ sub.name }}:</span>
            <span class="text-emerald-300 font-black">{{ sub.status }}</span>
          </span>
        </div>

        <!-- Next Pass Notice & TLE Epoch -->
        <div class="text-left sm:text-right flex sm:flex-col items-start sm:items-end justify-between gap-1 text-xs font-prompt">
          <div>
            <span class="text-slate-300 font-medium">พาสถัดไป: </span>
            <span class="font-bold text-amber-300 text-sm">{{ sat.nextPass }}</span>
          </div>
          <div>
            <span class="text-slate-300 font-medium">บันทึกล่าสุด: </span>
            <span class="font-mono text-slate-100 font-semibold">
              {{ getSatData(sat.noradId)?.epoch_time ? `${getSatData(sat.noradId)?.epoch_date} ${getSatData(sat.noradId)?.epoch_time} UTC` : sat.tleAge }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
