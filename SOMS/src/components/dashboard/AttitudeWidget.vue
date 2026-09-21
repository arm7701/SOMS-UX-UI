<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/AttitudeWidget.vue
 * วัตถุประสงค์: วิดเจ็ตแสดงสถานะท่าทางการทรงตัวของดาวเทียม (Attitude & Orientation)
 * สอดคล้องกับ Attitude widget ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref } from 'vue'
import { Compass, ShieldCheck, CheckCircle2, Radio, Sliders } from 'lucide-vue-next'

const selectedSat = ref('48963')

const attitudeData = {
  '48963': {
    name: 'NAPA-2 N',
    mode: 'Nadir Pointing (ชี้ลงพื้นโลก)',
    roll: '+0.12°',
    pitch: '-0.08°',
    yaw: '+0.34°',
    stabilization: '3-Axis Stabilized (วงล้อ Reaction Wheels)',
    status: 'NORMAL',
    lastSync: '2026-09-14 13:22:15 UTC'
  },
  '46320': {
    name: 'NAPA-1 N',
    mode: 'Sun-Pointing (ชาร์จพลังงานแสงอาทิตย์)',
    roll: '+0.45°',
    pitch: '+0.15°',
    yaw: '-0.20°',
    stabilization: '3-Axis Stabilized',
    status: 'NORMAL',
    lastSync: '2026-09-14 11:52:10 UTC'
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col flex-1 min-h-0 bg-transparent overflow-hidden">
    <div class="px-4 py-3 bg-[#0e2b50] border-b border-sky-700/50 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/60 flex items-center justify-center text-amber-400 flex-shrink-0">
          <Compass class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm sm:text-base font-bold font-prompt text-white">
            Spacecraft Attitude
          </h3>
          <p class="text-xs text-sky-200 font-prompt font-medium">
            ท่าทางการทรงตัวและการหันหน้าของยานอวกาศ
          </p>
        </div>
      </div>

      <select
        v-model="selectedSat"
        class="px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-sky-500/40 bg-[#1a4175] text-sky-100 font-prompt focus:outline-none"
      >
        <option value="48963">NAPA-2 N</option>
        <option value="46320">NAPA-1 N</option>
      </select>
    </div>

    <div class="p-4 flex-1 flex flex-col justify-between space-y-3 font-prompt">
      <div class="flex items-center justify-between pb-2 border-b border-sky-600/30">
        <div>
          <span class="text-xs sm:text-sm font-semibold text-sky-200">โหมดการควบคุมท่าทาง (ADCS Mode)</span>
          <p class="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
            {{ attitudeData[selectedSat]?.mode }}
          </p>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-xs">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>{{ attitudeData[selectedSat]?.status }}</span>
        </span>
      </div>

      <!-- Roll Pitch Yaw Grid -->
      <div class="grid grid-cols-3 gap-2.5 text-center">
        <div class="p-2.5 rounded-xl bg-[#1a4175] border border-sky-600/40">
          <span class="text-sky-200 text-xs font-semibold block">Roll (เอียงข้าง)</span>
          <p class="font-mono text-cyan-300 font-black text-base sm:text-lg mt-1">{{ attitudeData[selectedSat]?.roll }}</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#1a4175] border border-sky-600/40">
          <span class="text-sky-200 text-xs font-semibold block">Pitch (ก้ม-เงย)</span>
          <p class="font-mono text-cyan-300 font-black text-base sm:text-lg mt-1">{{ attitudeData[selectedSat]?.pitch }}</p>
        </div>
        <div class="p-2.5 rounded-xl bg-[#1a4175] border border-sky-600/40">
          <span class="text-sky-200 text-xs font-semibold block">Yaw (หันซ้าย-ขวา)</span>
          <p class="font-mono text-cyan-300 font-black text-base sm:text-lg mt-1">{{ attitudeData[selectedSat]?.yaw }}</p>
        </div>
      </div>

      <div class="flex justify-between items-center text-xs text-sky-200 font-medium pt-1">
        <span>ระบบทรงตัว: {{ attitudeData[selectedSat]?.stabilization }}</span>
        <span class="font-mono text-sky-100">Sync: {{ attitudeData[selectedSat]?.lastSync }}</span>
      </div>
    </div>
  </div>
</template>
