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
  <div class="p-4 h-full flex flex-col justify-between space-y-3">
    <div class="flex items-center justify-between pb-2.5 border-b border-slate-750">
      <div class="flex items-center gap-2">
        <Users class="w-4.5 h-4.5 text-cyan-400" />
        <h4 class="text-sm sm:text-base font-bold font-prompt text-white">
          เจ้าหน้าที่ปฏิบัติเวรประจำวัน (Mission Operators)
        </h4>
      </div>
      <router-link
        to="/operations"
        class="text-xs text-cyan-300 hover:text-white inline-flex items-center gap-1 font-bold font-prompt"
      >
        <span>ดูตารางเวรทั้งเดือน</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-center">
      <!-- MD -->
      <div class="p-3.5 rounded-xl bg-[#090e18]/90 border border-slate-700/80 hover:border-cyan-500/40 transition-colors flex items-start gap-3 shadow-xs">
        <div class="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-600/50 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs shadow-cyan-950/50">
          MD
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Mission Director
          </span>
          <span class="text-sm sm:text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('MD') }}
          </span>
        </div>
      </div>

      <!-- FMO -->
      <div class="p-3.5 rounded-xl bg-[#090e18]/90 border border-slate-700/80 hover:border-emerald-500/40 transition-colors flex items-start gap-3 shadow-xs">
        <div class="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-600/50 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs shadow-emerald-950/50">
          FMO
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Flight & Mission Operator
          </span>
          <span class="text-sm sm:text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('FMO') }}
          </span>
        </div>
      </div>

      <!-- GSO -->
      <div class="p-3.5 rounded-xl bg-[#090e18]/90 border border-slate-700/80 hover:border-amber-500/40 transition-colors flex items-start gap-3 shadow-xs">
        <div class="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-600/50 flex items-center justify-center font-black text-sm font-mono flex-shrink-0 shadow-xs shadow-amber-950/50">
          GSO
        </div>
        <div class="min-w-0">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block font-prompt">
            Ground Station Operator
          </span>
          <span class="text-sm sm:text-base font-bold text-white block mt-0.5 font-prompt truncate">
            {{ getNamesByRole('GSO') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
