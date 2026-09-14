<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SatelliteSummary.vue
 * วัตถุประสงค์: การ์ดแสดงผลสรุปสถานะดาวเทียม NAPA-1 N และ NAPA-2 N
 * ============================================================================
 */
import { Orbit, Activity } from 'lucide-vue-next'

const props = defineProps({
  satellites: {
    type: Array,
    default: () => []
  }
})

const getSatData = (noradId) => {
  return props.satellites.find(s => Number(s.norad_id) === noradId) || null
}

const formatAltitude = (val) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—'
  return `${Number(val).toFixed(2)}`
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- NAPA-1 Card -->
    <div class="bg-white dark:bg-space-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-space-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <h3 class="text-lg font-bold font-prompt text-slate-900 dark:text-white">
              NAPA-1 N (NORAD: 46320)
            </h3>
          </div>
          <p class="text-sm font-semibold text-sky-200 dark:text-sky-200 mt-1">
            ดาวเทียมสำรวจและตรวจการณ์พื้นที่ดวงแรก
          </p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-cyan-300 flex items-center justify-center border border-blue-200 dark:border-cyan-400/30">
          <Orbit class="w-6 h-6" />
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-100 dark:border-space-750 flex items-end justify-between">
        <div>
          <span class="text-sm text-sky-100 dark:text-sky-100 uppercase tracking-wider font-bold">ความสูงวงโคจร (Altitude)</span>
          <div class="text-3xl font-extrabold font-mono text-blue-600 dark:text-cyan-300 mt-1">
            {{ formatAltitude(getSatData(46320)?.altitude_km) }} <span class="text-base font-bold text-sky-300">KM</span>
          </div>
        </div>
        <div class="text-right text-sm text-sky-200 dark:text-sky-200 font-semibold">
          <span class="block text-xs font-bold text-sky-300 uppercase">บันทึกล่าสุด:</span>
          <span class="font-mono font-bold text-slate-900 dark:text-white">
            {{ getSatData(46320)?.epoch_time ? `${getSatData(46320)?.epoch_date} ${getSatData(46320)?.epoch_time} UTC` : 'ยังไม่มีข้อมูล' }}
          </span>
        </div>
      </div>
    </div>

    <!-- NAPA-2 Card -->
    <div class="bg-white dark:bg-space-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-space-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <h3 class="text-lg font-bold font-prompt text-slate-900 dark:text-white">
              NAPA-2 N (NORAD: 48963)
            </h3>
          </div>
          <p class="text-sm font-semibold text-sky-200 dark:text-sky-200 mt-1">
            ดาวเทียมตรวจการณ์ความละเอียดสูงดวงที่สอง
          </p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 flex items-center justify-center border border-purple-200 dark:border-purple-400/30">
          <Activity class="w-6 h-6" />
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-100 dark:border-space-750 flex items-end justify-between">
        <div>
          <span class="text-sm text-sky-100 dark:text-sky-100 uppercase tracking-wider font-bold">ความสูงวงโคจร (Altitude)</span>
          <div class="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-300 mt-1">
            {{ formatAltitude(getSatData(48963)?.altitude_km) }} <span class="text-base font-bold text-sky-300">KM</span>
          </div>
        </div>
        <div class="text-right text-sm text-sky-200 dark:text-sky-200 font-semibold">
          <span class="block text-xs font-bold text-sky-300 uppercase">บันทึกล่าสุด:</span>
          <span class="font-mono font-bold text-slate-900 dark:text-white">
            {{ getSatData(48963)?.epoch_time ? `${getSatData(48963)?.epoch_date} ${getSatData(48963)?.epoch_time} UTC` : 'ยังไม่มีข้อมูล' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
