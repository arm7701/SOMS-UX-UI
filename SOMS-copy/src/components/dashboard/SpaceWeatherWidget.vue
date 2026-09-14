<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SpaceWeatherWidget.vue
 * วัตถุประสงค์: แสดงสถานะสภาพอวกาศ (Space Weather Scales - NOAA)
 * ธีมดำเทาไททาเนียม: คอนทราสต์ชัดเจน อ่านค่าได้ทันที
 * ============================================================================
 */
import { Sun, ShieldAlert, Info } from 'lucide-vue-next'

const props = defineProps({
  weather: {
    type: Object,
    default: () => null
  }
})

const getScaleInfo = (val) => {
  const num = Number(val)
  if (isNaN(num) || val === null || val === undefined) {
    return { level: '—', text: 'ไม่มีข้อมูล', classes: 'text-zinc-400 bg-space-800 border-space-700' }
  }
  const levels = [
    { text: 'ปกติ (Normal)', classes: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80' },
    { text: 'เล็กน้อย (Minor)', classes: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' },
    { text: 'ปานกลาง (Moderate)', classes: 'text-amber-300 bg-amber-950/60 border-amber-800/80' },
    { text: 'รุนแรง (Strong)', classes: 'text-orange-300 bg-orange-950/60 border-orange-800/80' },
    { text: 'รุนแรงมาก (Severe)', classes: 'text-rose-300 bg-rose-950/60 border-rose-800/80' },
    { text: 'วิกฤต (Extreme)', classes: 'text-red-200 bg-red-950/80 border-red-800/90' }
  ]
  return {
    level: num,
    text: levels[num]?.text || 'ระดับ ' + num,
    classes: levels[num]?.classes || 'text-slate-200 bg-space-800 border-space-700'
  }
}
</script>

<template>
  <div class="bg-space-850 rounded-2xl p-5 border border-space-700 shadow-md flex flex-col justify-between">
    <div class="flex items-center justify-between pb-3 border-b border-space-750">
      <div class="flex items-center gap-2">
        <Sun class="w-5 h-5 text-amber-400" />
        <h3 class="text-base font-bold font-prompt text-white">
          สภาวะอวกาศ (Space Weather)
        </h3>
      </div>
      <span class="text-xs sm:text-sm text-slate-200 font-mono font-bold">
        {{ weather?.spaceweather_date || 'วันนี้' }}
      </span>
    </div>

    <!-- 3 Core Scales -->
    <div class="grid grid-cols-3 gap-3 my-4 text-center">
      <!-- R Scale -->
      <div class="p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all shadow-xs" :class="getScaleInfo(weather?.spaceweather_r).classes">
        <span class="text-xs font-bold uppercase tracking-wider font-prompt">R - Radio</span>
        <span class="text-3xl font-black font-mono my-1">
          R{{ weather?.spaceweather_r !== undefined && weather?.spaceweather_r !== null ? weather.spaceweather_r : '—' }}
        </span>
        <span class="text-xs font-bold truncate max-w-full font-prompt">
          {{ getScaleInfo(weather?.spaceweather_r).text.split(' ')[0] }}
        </span>
      </div>

      <!-- S Scale -->
      <div class="p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all shadow-xs" :class="getScaleInfo(weather?.spaceweather_s).classes">
        <span class="text-xs font-bold uppercase tracking-wider font-prompt">S - Solar</span>
        <span class="text-3xl font-black font-mono my-1">
          S{{ weather?.spaceweather_s !== undefined && weather?.spaceweather_s !== null ? weather.spaceweather_s : '—' }}
        </span>
        <span class="text-xs font-bold truncate max-w-full font-prompt">
          {{ getScaleInfo(weather?.spaceweather_s).text.split(' ')[0] }}
        </span>
      </div>

      <!-- G Scale -->
      <div class="p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all shadow-xs" :class="getScaleInfo(weather?.spaceweather_g).classes">
        <span class="text-xs font-bold uppercase tracking-wider font-prompt">G - Geomag</span>
        <span class="text-3xl font-black font-mono my-1">
          G{{ weather?.spaceweather_g !== undefined && weather?.spaceweather_g !== null ? weather.spaceweather_g : '—' }}
        </span>
        <span class="text-xs font-bold truncate max-w-full font-prompt">
          {{ getScaleInfo(weather?.spaceweather_g).text.split(' ')[0] }}
        </span>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="weather?.spaceweather_note" class="text-xs sm:text-sm text-slate-100 bg-space-900/80 p-3 rounded-xl border border-space-700 flex items-start gap-2.5 font-prompt">
      <Info class="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
      <span class="leading-relaxed font-medium">{{ weather.spaceweather_note }}</span>
    </div>
  </div>
</template>
