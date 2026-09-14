<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DutyOperatorsWidget.vue
 * วัตถุประสงค์: แสดงรายชื่อเจ้าหน้าที่ผู้เข้าเวรปฏิบัติหน้าที่ในวันนี้ (MD, FMO, GSO)
 * ============================================================================
 */
import { Users, UserCheck, ArrowRight } from 'lucide-vue-next'

const props = defineProps({
  operations: {
    type: Array,
    default: () => []
  }
})

const getNamesByRole = (role) => {
  const list = props.operations
    .filter(op => op.rbac_role === role)
    .map(op => op.rbac_fullname)
    .filter(Boolean)
  return [...new Set(list)].join(', ') || '—'
}
</script>

<template>
  <div class="bg-white dark:bg-space-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-space-700 shadow-sm">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-space-750">
      <div class="flex items-center gap-2">
        <Users class="w-6 h-6 text-blue-600 dark:text-cyan-300" />
        <h3 class="text-lg font-bold font-prompt text-slate-900 dark:text-white">
          เจ้าหน้าที่ปฏิบัติเวรประจำวัน (Mission Operators)
        </h3>
      </div>
      <router-link to="/operations" class="text-sm text-blue-600 dark:text-cyan-300 hover:underline inline-flex items-center gap-1 font-bold">
        <span>ดูตารางเวรทั้งเดือน</span>
        <ArrowRight class="w-4 h-4" />
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <!-- MD -->
      <div class="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-cyan-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-blue-300 dark:border-blue-700">
          MD
        </div>
        <div>
          <span class="text-xs font-bold text-sky-200 dark:text-sky-200 uppercase tracking-wider block">
            Mission Director
          </span>
          <span class="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {{ getNamesByRole('MD') }}
          </span>
        </div>
      </div>

      <!-- FMO -->
      <div class="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-emerald-300 dark:border-emerald-700">
          FMO
        </div>
        <div>
          <span class="text-xs font-bold text-sky-200 dark:text-sky-200 uppercase tracking-wider block">
            Flight & Mission Operator
          </span>
          <span class="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {{ getNamesByRole('FMO') }}
          </span>
        </div>
      </div>

      <!-- GSO -->
      <div class="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-purple-300 dark:border-purple-700">
          GSO
        </div>
        <div>
          <span class="text-xs font-bold text-sky-200 dark:text-sky-200 uppercase tracking-wider block">
            Ground Station Operator
          </span>
          <span class="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {{ getNamesByRole('GSO') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
