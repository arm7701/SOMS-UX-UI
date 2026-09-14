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
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- NAPA-1 Passes -->
    <div class="bg-space-850 rounded-2xl p-5 border border-space-700 shadow-md flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-space-750">
          <div class="flex items-center gap-2">
            <Calendar class="w-5 h-5 text-zinc-300" />
            <h3 class="text-base font-bold font-prompt text-white">
              พาสดาวเทียม NAPA-1 N
            </h3>
          </div>
          <router-link to="/passes?satellite=46320" class="text-xs sm:text-sm text-slate-200 hover:text-white hover:underline inline-flex items-center gap-1 font-bold font-prompt">
            <span>ดูทั้งหมด</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div class="mt-3 divide-y divide-space-750">
          <div
            v-for="(p, i) in getPassesForSat(46320)"
            :key="p.id || i"
            class="py-3 flex items-center justify-between gap-3 text-sm"
          >
            <div class="flex items-center gap-2.5">
              <Sun v-if="isDayPass(p.aos_time_utc)" class="w-4 h-4 text-amber-400 flex-shrink-0" />
              <Moon v-else class="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <span class="font-bold text-white font-prompt">
                  {{ isDayPass(p.aos_time_utc) ? `DayPass-${i + 1}` : `NightPass-${i + 1}` }}
                </span>
                <span class="text-slate-100 ml-2 font-mono font-bold">
                  {{ p.aos_time_utc }} – {{ p.los_time_utc }} (UTC)
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <span class="font-mono text-cyan-300 font-bold text-sm sm:text-base">
                El. {{ p.maxEl }}°
              </span>
              <StatusBadge
                :label="Number(p.maxEl) < 5 ? 'Abort (<5°)' : 'พร้อมปฏิบัติ'"
                :status="Number(p.maxEl) < 5 ? 'danger' : 'normal'"
                size="sm"
              />
            </div>
          </div>

          <div v-if="getPassesForSat(46320).length === 0" class="py-6 text-center text-slate-300 text-sm font-prompt font-medium">
            ไม่มีรอบพาสผ่านในวันนี้
          </div>
        </div>
      </div>
    </div>

    <!-- NAPA-2 Passes -->
    <div class="bg-space-850 rounded-2xl p-5 border border-space-700 shadow-md flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-space-750">
          <div class="flex items-center gap-2">
            <Calendar class="w-5 h-5 text-zinc-300" />
            <h3 class="text-base font-bold font-prompt text-white">
              พาสดาวเทียม NAPA-2 N
            </h3>
          </div>
          <router-link to="/passes?satellite=48963" class="text-xs sm:text-sm text-slate-200 hover:text-white hover:underline inline-flex items-center gap-1 font-bold font-prompt">
            <span>ดูทั้งหมด</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div class="mt-3 divide-y divide-space-750">
          <div
            v-for="(p, i) in getPassesForSat(48963)"
            :key="p.id || i"
            class="py-3 flex items-center justify-between gap-3 text-sm"
          >
            <div class="flex items-center gap-2.5">
              <Sun v-if="isDayPass(p.aos_time_utc)" class="w-4 h-4 text-amber-400 flex-shrink-0" />
              <Moon v-else class="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <span class="font-bold text-white font-prompt">
                  {{ isDayPass(p.aos_time_utc) ? `DayPass-${i + 1}` : `NightPass-${i + 1}` }}
                </span>
                <span class="text-slate-100 ml-2 font-mono font-bold">
                  {{ p.aos_time_utc }} – {{ p.los_time_utc }} (UTC)
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <span class="font-mono text-cyan-300 font-bold text-sm sm:text-base">
                El. {{ p.maxEl }}°
              </span>
              <StatusBadge
                :label="Number(p.maxEl) < 5 ? 'Abort (<5°)' : 'พร้อมปฏิบัติ'"
                :status="Number(p.maxEl) < 5 ? 'danger' : 'normal'"
                size="sm"
              />
            </div>
          </div>

          <div v-if="getPassesForSat(48963).length === 0" class="py-6 text-center text-slate-300 text-sm font-prompt font-medium">
            ไม่มีรอบพาสผ่านในวันนี้
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
