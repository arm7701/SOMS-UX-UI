<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/TodayPassesWidget.vue
 * วัตถุประสงค์: แสดงรายการพาสดาวเทียมประจำวัน (Pass Detail Schedule) สำหรับทั้ง 2 ดวง
 * ธีมดำเทาไททาเนียม คอนทราสต์คมชัดทุกแถว
 * ============================================================================
 */
import { Calendar, Sun, Moon, ArrowRight } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  passes: {
    type: Array,
    default: () => []
  }
})

const getPassesForSat = (noradId) => {
  return props.passes
    .filter(p => Number(p.satellite_id) === noradId)
    .sort((a, b) => String(a.aos_time_utc).localeCompare(String(b.aos_time_utc)))
}

const isDayPass = (timeStr) => {
  const hour = Number(String(timeStr || '').slice(0, 2))
  return hour < 13
}
</script>

<template>
  <div class="p-4 h-full flex flex-col justify-between space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
      <!-- NAPA-1 Passes -->
      <div class="bg-[#090e18]/90 rounded-xl p-4 border border-slate-700/80 flex flex-col justify-between shadow-xs">
        <div>
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-750">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] flex-shrink-0"></span>
              <h4 class="text-sm sm:text-base font-bold font-prompt text-white truncate">
                NAPA-1 N (46320)
              </h4>
            </div>
            <router-link
              to="/passes?satellite=46320"
              class="text-xs text-cyan-300 hover:text-white inline-flex items-center gap-1 font-bold font-prompt flex-shrink-0 ml-2"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>

          <div class="mt-2.5 divide-y divide-slate-800">
            <div
              v-for="(p, i) in getPassesForSat(46320)"
              :key="p.id || i"
              class="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <Sun v-if="isDayPass(p.aos_time_utc)" class="w-4 h-4 text-amber-400 flex-shrink-0" />
                <Moon v-else class="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <span class="font-bold text-white font-prompt whitespace-nowrap text-xs sm:text-sm">
                    {{ isDayPass(p.aos_time_utc) ? `DayPass-${i + 1}` : `NightPass-${i + 1}` }}
                  </span>
                  <span class="text-slate-300 font-mono font-semibold text-xs whitespace-nowrap">
                    {{ p.aos_time_utc }} – {{ p.los_time_utc }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="font-mono text-cyan-300 font-black text-xs sm:text-sm">
                  El. {{ p.maxEl }}°
                </span>
                <StatusBadge
                  :label="Number(p.maxEl) < 5 ? 'Abort' : 'พร้อมปฏิบัติ'"
                  :status="Number(p.maxEl) < 5 ? 'danger' : 'normal'"
                  size="sm"
                />
              </div>
            </div>

            <div v-if="getPassesForSat(46320).length === 0" class="py-6 text-center text-slate-400 text-xs font-prompt font-medium">
              ไม่มีรอบพาสผ่านในวันนี้
            </div>
          </div>
        </div>
      </div>

      <!-- NAPA-2 Passes -->
      <div class="bg-[#090e18]/90 rounded-xl p-4 border border-slate-700/80 flex flex-col justify-between shadow-xs">
        <div>
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-750">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] flex-shrink-0"></span>
              <h4 class="text-sm sm:text-base font-bold font-prompt text-white truncate">
                NAPA-2 N (48963)
              </h4>
            </div>
            <router-link
              to="/passes?satellite=48963"
              class="text-xs text-cyan-300 hover:text-white inline-flex items-center gap-1 font-bold font-prompt flex-shrink-0 ml-2"
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>

          <div class="mt-2.5 divide-y divide-slate-800">
            <div
              v-for="(p, i) in getPassesForSat(48963)"
              :key="p.id || i"
              class="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <Sun v-if="isDayPass(p.aos_time_utc)" class="w-4 h-4 text-amber-400 flex-shrink-0" />
                <Moon v-else class="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <span class="font-bold text-white font-prompt whitespace-nowrap text-xs sm:text-sm">
                    {{ isDayPass(p.aos_time_utc) ? `DayPass-${i + 1}` : `NightPass-${i + 1}` }}
                  </span>
                  <span class="text-slate-300 font-mono font-semibold text-xs whitespace-nowrap">
                    {{ p.aos_time_utc }} – {{ p.los_time_utc }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="font-mono text-emerald-300 font-black text-xs sm:text-sm">
                  El. {{ p.maxEl }}°
                </span>
                <StatusBadge
                  :label="Number(p.maxEl) < 5 ? 'Abort' : 'พร้อมปฏิบัติ'"
                  :status="Number(p.maxEl) < 5 ? 'danger' : 'normal'"
                  size="sm"
                />
              </div>
            </div>

            <div v-if="getPassesForSat(48963).length === 0" class="py-6 text-center text-slate-400 text-xs font-prompt font-medium">
              ไม่มีรอบพาสผ่านในวันนี้
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
