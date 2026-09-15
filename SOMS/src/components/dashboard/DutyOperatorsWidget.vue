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
  <div class="bg-[#08172f]/85 rounded-2xl p-5 border border-sky-400/25 shadow-lg">
    <div class="flex items-center justify-between pb-3 border-b border-sky-500/20">
      <div class="flex items-center gap-2">
        <Users class="w-6 h-6 text-cyan-300" />
        <h3 class="text-lg font-bold font-prompt text-white">
          เจ้าหน้าที่ปฏิบัติเวรประจำวัน (Mission Operators)
        </h3>
      </div>
      <router-link to="/operations" class="text-sm text-cyan-300 hover:text-white inline-flex items-center gap-1 font-bold">
        <span>ดูตารางเวรทั้งเดือน</span>
        <ArrowRight class="w-4 h-4" />
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <!-- MD -->
      <div class="p-4 rounded-xl bg-[#05142a] border border-sky-400/35 flex items-start gap-3.5 shadow-xs">
        <div class="w-11 h-11 rounded-xl bg-sky-950 text-cyan-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
          MD
        </div>
        <div>
          <span class="text-xs font-bold text-cyan-200 uppercase tracking-wider block">
            Mission Director
          </span>
          <span class="text-base font-extrabold text-white block mt-0.5">
            {{ getNamesByRole('MD') }}
          </span>
        </div>
      </div>

      <!-- FMO -->
      <div class="p-4 rounded-xl bg-[#05142a] border border-emerald-400/35 flex items-start gap-3.5 shadow-xs">
        <div class="w-11 h-11 rounded-xl bg-emerald-950 text-emerald-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
          FMO
        </div>
        <div>
          <span class="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
            Flight & Mission Operator
          </span>
          <span class="text-base font-extrabold text-white block mt-0.5">
            {{ getNamesByRole('FMO') }}
          </span>
        </div>
      </div>

      <!-- GSO -->
      <div class="p-4 rounded-xl bg-[#05142a] border border-indigo-400/35 flex items-start gap-3.5 shadow-xs">
        <div class="w-11 h-11 rounded-xl bg-indigo-950 text-indigo-200 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-indigo-400/50 shadow-[0_0_10px_rgba(129,140,248,0.2)]">
          GSO
        </div>
        <div>
          <span class="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
            Ground Station Operator
          </span>
          <span class="text-base font-extrabold text-white block mt-0.5">
            {{ getNamesByRole('GSO') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
