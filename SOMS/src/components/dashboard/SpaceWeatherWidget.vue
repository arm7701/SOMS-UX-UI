<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SpaceWeatherWidget.vue
 * วัตถุประสงค์: แสดงสถานะสภาพอวกาศ (Space Weather Scales - NOAA)
 * R (Radio Blackout), S (Solar Radiation Storm), G (Geomagnetic Storm)
 * ============================================================================
 */
import { Sun, ShieldAlert } from 'lucide-vue-next'

const props = defineProps({
  weather: {
    type: Object,
    default: () => null
  }
})

const getScaleInfo = (val) => {
  const num = Number(val)
  if (isNaN(num) || val === null || val === undefined) {
    return { level: '—', text: 'ไม่มีข้อมูล', classes: 'text-sky-300 bg-[#061833] border-2 border-sky-500/30' }
  }
  const levels = [
    { text: 'ปกติ (Normal)', classes: 'text-emerald-300 bg-emerald-950/60 border-2 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.15)]' },
    { text: 'เล็กน้อย (Minor)', classes: 'text-emerald-300 bg-emerald-950/50 border-2 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]' },
    { text: 'ปานกลาง (Moderate)', classes: 'text-amber-300 bg-amber-950/60 border-2 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
    { text: 'รุนแรง (Strong)', classes: 'text-orange-300 bg-orange-950/60 border-2 border-orange-400/50 shadow-[0_0_12px_rgba(249,115,22,0.15)]' },
    { text: 'รุนแรงมาก (Severe)', classes: 'text-rose-300 bg-rose-950/60 border-2 border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]' },
    { text: 'วิกฤต (Extreme)', classes: 'text-red-200 bg-red-950/80 border-2 border-red-500/70 shadow-[0_0_16px_rgba(239,68,68,0.25)]' }
  ]
  return {
    level: num,
    text: levels[num]?.text || 'ระดับ ' + num,
    classes: levels[num]?.classes || 'text-cyan-200 bg-[#061833]'
  }
}
</script>

<template>
  <div class="bg-[#08172f]/85 rounded-2xl p-5 border border-sky-400/25 shadow-lg flex flex-col justify-between">
    <div class="flex items-center justify-between pb-3 border-b border-sky-500/20">
      <div class="flex items-center gap-2">
        <Sun class="w-6 h-6 text-amber-400" />
        <h3 class="text-lg font-bold font-prompt text-white">
          สภาวะอวกาศ (Space Weather)
        </h3>
      </div>
      <span class="text-sm text-cyan-200 font-mono font-bold">
        {{ weather?.spaceweather_date || 'วันนี้' }}
      </span>
    </div>

    <!-- 3 Core Scales -->
    <div class="grid grid-cols-3 gap-3 my-4 text-center">
      <!-- R Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_r).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">R - Radio</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1 drop-shadow-sm">
          R{{ weather?.spaceweather_r !== undefined && weather?.spaceweather_r !== null ? weather.spaceweather_r : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_r).text.split(' ')[0] }}
        </span>
      </div>

      <!-- S Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_s).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">S - Solar</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1 drop-shadow-sm">
          S{{ weather?.spaceweather_s !== undefined && weather?.spaceweather_s !== null ? weather.spaceweather_s : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_s).text.split(' ')[0] }}
        </span>
      </div>

      <!-- G Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_g).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">G - Geomagnetic</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1 drop-shadow-sm">
          G{{ weather?.spaceweather_g !== undefined && weather?.spaceweather_g !== null ? weather.spaceweather_g : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_g).text.split(' ')[0] }}
        </span>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="weather?.spaceweather_note" class="text-sm font-semibold text-sky-100 bg-[#040e21]/90 p-3.5 rounded-xl border border-sky-500/30 flex items-start gap-2.5">
      <ShieldAlert class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <span>{{ weather.spaceweather_note }}</span>
    </div>
  </div>
</template>
