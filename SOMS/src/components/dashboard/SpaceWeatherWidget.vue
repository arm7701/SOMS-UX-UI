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
    return { level: '—', text: 'ไม่มีข้อมูล', classes: 'text-slate-400 bg-slate-100 dark:bg-space-800' }
  }
  const levels = [
    { text: 'ปกติ (Normal)', classes: 'text-emerald-800 bg-emerald-50 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500/50' },
    { text: 'เล็กน้อย (Minor)', classes: 'text-emerald-700 bg-emerald-50 border-2 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/50' },
    { text: 'ปานกลาง (Moderate)', classes: 'text-amber-800 bg-amber-50 border-2 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-500/50' },
    { text: 'รุนแรง (Strong)', classes: 'text-orange-800 bg-orange-50 border-2 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-500/50' },
    { text: 'รุนแรงมาก (Severe)', classes: 'text-rose-800 bg-rose-50 border-2 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-500/50' },
    { text: 'วิกฤต (Extreme)', classes: 'text-red-800 bg-red-100 border-2 border-red-300 dark:bg-red-950/80 dark:text-red-100 dark:border-red-400' }
  ]
  return {
    level: num,
    text: levels[num]?.text || 'ระดับ ' + num,
    classes: levels[num]?.classes || 'text-slate-600 bg-slate-100'
  }
}
</script>

<template>
  <div class="bg-white dark:bg-space-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-space-700 shadow-sm flex flex-col justify-between">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-space-750">
      <div class="flex items-center gap-2">
        <Sun class="w-6 h-6 text-amber-500" />
        <h3 class="text-lg font-bold font-prompt text-slate-900 dark:text-white">
          สภาวะอวกาศ (Space Weather)
        </h3>
      </div>
      <span class="text-sm text-sky-200 dark:text-sky-200 font-mono font-bold">
        {{ weather?.spaceweather_date || 'วันนี้' }}
      </span>
    </div>

    <!-- 3 Core Scales -->
    <div class="grid grid-cols-3 gap-3 my-4 text-center">
      <!-- R Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_r).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">R - Radio</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1">
          R{{ weather?.spaceweather_r !== undefined && weather?.spaceweather_r !== null ? weather.spaceweather_r : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_r).text.split(' ')[0] }}
        </span>
      </div>

      <!-- S Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_s).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">S - Solar</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1">
          S{{ weather?.spaceweather_s !== undefined && weather?.spaceweather_s !== null ? weather.spaceweather_s : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_s).text.split(' ')[0] }}
        </span>
      </div>

      <!-- G Scale -->
      <div class="p-3.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all" :class="getScaleInfo(weather?.spaceweather_g).classes">
        <span class="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">G - Geomagnetic</span>
        <span class="text-2xl sm:text-3xl font-extrabold font-mono my-1">
          G{{ weather?.spaceweather_g !== undefined && weather?.spaceweather_g !== null ? weather.spaceweather_g : '—' }}
        </span>
        <span class="text-xs sm:text-sm font-bold opacity-95 truncate max-w-full">
          {{ getScaleInfo(weather?.spaceweather_g).text.split(' ')[0] }}
        </span>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="weather?.spaceweather_note" class="text-sm font-semibold text-slate-700 dark:text-sky-100 bg-slate-50 dark:bg-space-900/80 p-3 rounded-xl border border-slate-200 dark:border-space-700 flex items-start gap-2.5">
      <ShieldAlert class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <span>{{ weather.spaceweather_note }}</span>
    </div>
  </div>
</template>
