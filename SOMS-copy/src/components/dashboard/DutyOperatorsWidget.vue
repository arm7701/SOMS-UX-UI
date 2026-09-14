<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DutyOperatorsWidget.vue
 * วัตถุประสงค์: แสดงรายชื่อเจ้าหน้าที่ผู้เข้าเวรปฏิบัติหน้าที่ในวันนี้ (MD, FMO, GSO)
 * ธีมดำเทาไททาเนียม: คอนทราสต์ชัดเจน อ่านง่าย
 * ============================================================================
 */
import { Users, ArrowRight } from 'lucide-vue-next'

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
  <div class="bg-space-850 rounded-2xl p-5 border border-space-700 shadow-md">
    <div class="flex items-center justify-between pb-3 border-b border-space-750">
      <div class="flex items-center gap-2">
        <Users class="w-5 h-5 text-zinc-300" />
        <h3 class="text-base font-bold font-prompt text-white">
          เจ้าหน้าที่ปฏิบัติเวรประจำวัน (Mission Operators)
        </h3>
      </div>
      <router-link to="/operations" class="text-xs sm:text-sm text-slate-200 hover:text-white hover:underline inline-flex items-center gap-1 font-bold font-prompt">
        <span>ดูตารางเวรทั้งเดือน</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <!-- MD -->
      <div class="p-4 rounded-xl bg-space-900/90 border border-space-700 flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-space-800 text-cyan-300 border border-cyan-700/60 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs">
          MD
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Mission Director
          </span>
          <span class="text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('MD') }}
          </span>
        </div>
      </div>

      <!-- FMO -->
      <div class="p-4 rounded-xl bg-space-900/90 border border-space-700 flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-space-800 text-emerald-300 border border-emerald-700/60 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs">
          FMO
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Flight & Mission Operator
          </span>
          <span class="text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('FMO') }}
          </span>
        </div>
      </div>

      <!-- GSO -->
      <div class="p-4 rounded-xl bg-space-900/90 border border-space-700 flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-space-800 text-amber-300 border border-amber-700/60 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs">
          GSO
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Ground Station Operator
          </span>
          <span class="text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('GSO') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
