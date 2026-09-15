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
    <div class="bg-[#08172f]/85 rounded-2xl p-5 border border-sky-400/25 shadow-lg hover:border-sky-400/50 transition-all flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
            <h3 class="text-lg font-bold font-prompt text-white">
              NAPA-1 N (NORAD: 46320)
            </h3>
          </div>
          <p class="text-sm font-semibold text-cyan-200 mt-1">
            ดาวเทียมสำรวจและตรวจการณ์พื้นที่ดวงแรก
          </p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-sky-950/70 text-cyan-300 flex items-center justify-center border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
          <Orbit class="w-6 h-6" />
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-sky-500/20 flex items-end justify-between">
        <div>
          <span class="text-sm text-sky-200 uppercase tracking-wider font-bold">ความสูงวงโคจร (Altitude)</span>
          <div class="text-3xl font-extrabold font-mono text-cyan-300 mt-1 drop-shadow-sm">
            {{ formatAltitude(getSatData(46320)?.altitude_km) }} <span class="text-base font-bold text-sky-200">KM</span>
          </div>
        </div>
        <div class="text-right text-sm text-sky-200 font-semibold">
          <span class="block text-xs font-bold text-cyan-300 uppercase">บันทึกล่าสุด:</span>
          <span class="font-mono font-bold text-white">
            {{ getSatData(46320)?.epoch_time ? `${getSatData(46320)?.epoch_date} ${getSatData(46320)?.epoch_time} UTC` : 'ยังไม่มีข้อมูล' }}
          </span>
        </div>
      </div>
    </div>

    <!-- NAPA-2 Card -->
    <div class="bg-[#08172f]/85 rounded-2xl p-5 border border-sky-400/25 shadow-lg hover:border-sky-400/50 transition-all flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
            <h3 class="text-lg font-bold font-prompt text-white">
              NAPA-2 N (NORAD: 48963)
            </h3>
          </div>
          <p class="text-sm font-semibold text-cyan-200 mt-1">
            ดาวเทียมตรวจการณ์ความละเอียดสูงดวงที่สอง
          </p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-950/70 text-indigo-300 flex items-center justify-center border border-indigo-400/40 shadow-[0_0_12px_rgba(129,140,248,0.2)]">
          <Activity class="w-6 h-6" />
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-sky-500/20 flex items-end justify-between">
        <div>
          <span class="text-sm text-sky-200 uppercase tracking-wider font-bold">ความสูงวงโคจร (Altitude)</span>
          <div class="text-3xl font-extrabold font-mono text-indigo-300 mt-1 drop-shadow-sm">
            {{ formatAltitude(getSatData(48963)?.altitude_km) }} <span class="text-base font-bold text-sky-200">KM</span>
          </div>
        </div>
        <div class="text-right text-sm text-sky-200 font-semibold">
          <span class="block text-xs font-bold text-cyan-300 uppercase">บันทึกล่าสุด:</span>
          <span class="font-mono font-bold text-white">
            {{ getSatData(48963)?.epoch_time ? `${getSatData(48963)?.epoch_date} ${getSatData(48963)?.epoch_time} UTC` : 'ยังไม่มีข้อมูล' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
