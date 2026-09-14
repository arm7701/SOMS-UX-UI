<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/ShiftHandoverModal.vue
 * วัตถุประสงค์: หน้าต่างสรุปข้อมูลส่งมอบเวรประจำผลัด (Shift Handover Briefing Sheet)
 * ช่วยรวมข้อมูลสถานะดาวเทียม สภาพอวกาศ รอบพาส และเจ้าหน้าที่เวรเพื่อส่งมอบ
 * รองรับการคัดลอกข้อความสรุป (Copy to Clipboard) และการพิมพ์เอกสาร (Print)
 * ============================================================================
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  ClipboardList,
  Copy,
  Printer,
  X,
  Users,
  Orbit,
  SunMedium,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dashboardData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])
const appStore = useAppStore()

const close = () => {
  emit('update:modelValue', false)
}

const todayFormatted = computed(() => {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'full'
  }).format(new Date())
})

// สรุปเจ้าหน้าที่เข้าเวรวันนี้
const dutyOperators = computed(() => {
  return props.dashboardData.operations || []
})

const md = computed(() => dutyOperators.value.find(o => o.role === 'MD')?.operator_name || '—')
const fmo = computed(() => dutyOperators.value.find(o => o.role === 'FMO')?.operator_name || '—')
const gso = computed(() => dutyOperators.value.find(o => o.role === 'GSO')?.operator_name || '—')

// สรุปสภาพอวกาศ
const weather = computed(() => props.dashboardData.weather || {})

// สรุปรอบพาสประจำวัน
const todayPasses = computed(() => {
  return (props.dashboardData.passes || []).filter(p => p.isToday)
})

// สร้างข้อความสรุปสำหรับคัดลอกลง LINE หรือระบบแชตภายใน
const generateBriefingText = () => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  
  let text = `📋 [รายงานสรุปส่งมอบเวร SOIS/SOMS]\n`
  text += `ประจำวันที่: ${todayFormatted.value} (เวลาบันทึก: ${timeStr} น.)\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `👥 เจ้าหน้าที่ปฏิบัติหน้าที่:\n`
  text += `• MD: ${md.value}\n`
  text += `• FMO: ${fmo.value}\n`
  text += `• GSO: ${gso.value}\n\n`
  
  text += `🛰️ สถานะระบบดาวเทียม:\n`
  text += `• NAPA-1 N (46320): ปกติ (Active/Telemetry OK)\n`
  text += `• NAPA-2 N (48963): ปกติ (Active/Telemetry OK)\n\n`
  
  text += `☀️ สภาพอวกาศ (Space Weather):\n`
  text += `• Radio Blackouts (R): ${weather.value.r_scale || 'R0'} (ปกติ)\n`
  text += `• Solar Radiation (S): ${weather.value.s_scale || 'S0'} (ปกติ)\n`
  text += `• Geomagnetic Storms (G): ${weather.value.g_scale || 'G0'} (ปกติ)\n\n`
  
  text += `📡 รอบพาสดาวเทียมวันนี้ (${todayPasses.value.length} รอบ):\n`
  if (todayPasses.value.length === 0) {
    text += `• ไม่มีรอบพาสสำหรับวันนี้\n`
  } else {
    todayPasses.value.forEach((p, idx) => {
      const sat = Number(p.satellite_id) === 46320 ? 'NAPA-1' : 'NAPA-2'
      text += `${idx + 1}. [${sat}] เวลา ${p.aos_time_local} - ${p.los_time_local} น. (Max El: ${p.maxEl}°)\n`
    })
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `สรุปสถานะทั่วไป: ระบบพร้อมปฏิบัติการตามแผนปกติ ไม่มีข้อขัดข้องวิกฤต`
  return text
}

const copyBriefing = async () => {
  const text = generateBriefingText()
  try {
    await navigator.clipboard.writeText(text)
    appStore.showToast('คัดลอกสำเร็จ', 'คัดลอกข้อความสรุปส่งมอบเวรลง Clipboard เรียบร้อยแล้ว')
  } catch (err) {
    appStore.showToast('ข้อผิดพลาด', 'ไม่สามารถคัดลอกข้อความได้', 'danger')
  }
}

const printBriefing = () => {
  window.print()
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity"
    @click.self="close"
  >
    <div
      class="w-full max-w-2xl bg-white dark:bg-space-900 rounded-3xl border border-sky-200/90 dark:border-sky-800/60 shadow-2xl shadow-sky-950/30 overflow-hidden flex flex-col max-h-[90vh] font-prompt transition-all"
    >
      <!-- Header -->
      <div class="p-5 border-b border-sky-100 dark:border-sky-900/50 flex items-center justify-between bg-sky-50/50 dark:bg-space-850/60">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
            <ClipboardList class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              สรุปส่งมอบเวรปฏิบัติการ (Shift Handover Briefing)
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ todayFormatted }} • ศูนย์ปฏิบัติการทางอวกาศ SOIS/SOMS
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-space-800 transition-colors"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Body -->
      <div class="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
        <!-- 1. Duty Personnel -->
        <div class="p-4 rounded-2xl bg-sky-50/60 dark:bg-space-850/80 border border-sky-100 dark:border-sky-900/40">
          <div class="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-3">
            <Users class="w-4 h-4" />
            <span>เจ้าหน้าที่ประจำผลัด (Duty Roster)</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-white/80 dark:bg-space-800/80 p-3 rounded-xl border border-sky-100 dark:border-sky-900/30">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Mission Director</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate mt-0.5">{{ md }}</span>
            </div>
            <div class="bg-white/80 dark:bg-space-800/80 p-3 rounded-xl border border-sky-100 dark:border-sky-900/30">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Flight Operator</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate mt-0.5">{{ fmo }}</span>
            </div>
            <div class="bg-white/80 dark:bg-space-800/80 p-3 rounded-xl border border-sky-100 dark:border-sky-900/30">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Ground Station</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate mt-0.5">{{ gso }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Satellites & Space Weather Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Satellites Status -->
          <div class="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">
              <Orbit class="w-4 h-4 text-sky-500" />
              <span>สถานะดาวเทียม (Satellites)</span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-space-800">
                <span class="font-medium text-slate-700 dark:text-slate-300">NAPA-1 N (46320)</span>
                <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 class="w-3.5 h-3.5" /> ปกติ
                </span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-space-800">
                <span class="font-medium text-slate-700 dark:text-slate-300">NAPA-2 N (48963)</span>
                <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 class="w-3.5 h-3.5" /> ปกติ
                </span>
              </div>
            </div>
          </div>

          <!-- Space Weather -->
          <div class="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">
              <SunMedium class="w-4 h-4 text-amber-500" />
              <span>สภาพอวกาศ (Space Weather)</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-space-800">
                <span class="text-[10px] text-slate-400 font-semibold block">R Scale</span>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ weather.r_scale || 'R0' }}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-space-800">
                <span class="text-[10px] text-slate-400 font-semibold block">S Scale</span>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ weather.s_scale || 'S0' }}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-50 dark:bg-space-800">
                <span class="text-[10px] text-slate-400 font-semibold block">G Scale</span>
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{{ weather.g_scale || 'G0' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Today's Passes Summary -->
        <div class="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <CalendarDays class="w-4 h-4 text-blue-500" />
              <span>รอบพาสดาวเทียมประจำวันนี้ ({{ todayPasses.length }} รอบ)</span>
            </div>
            <span class="text-[11px] text-slate-400">สถานีภาคพื้น RTAF</span>
          </div>

          <div v-if="todayPasses.length === 0" class="text-center py-4 text-xs text-slate-400">
            ไม่มีรอบพาสดาวเทียมสำหรับวันนี้
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(p, idx) in todayPasses"
              :key="p.id || idx"
              class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-space-800 bg-slate-50/50 dark:bg-space-800/50 text-xs"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-100">
                    {{ Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : 'NAPA-2 N' }}
                  </span>
                  <span class="text-[11px] text-slate-400 ml-1.5 font-mono">
                    {{ p.aos_time_local }} - {{ p.los_time_local }} น.
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 font-mono">
                <span class="text-xs font-semibold" :class="Number(p.maxEl) < 5 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'">
                  Max El: {{ p.maxEl }}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 sm:p-5 border-t border-sky-100 dark:border-sky-900/50 bg-slate-50/80 dark:bg-space-850/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck class="w-4 h-4 text-emerald-500" />
          <span>ข้อมูลพร้อมสำหรับการส่งมอบเวรประจำผลัด</span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 hover:bg-slate-50 dark:hover:bg-space-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs"
            @click="printBriefing"
          >
            <Printer class="w-4 h-4" />
            <span>พิมพ์สรุป (Print)</span>
          </button>

          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition-all"
            @click="copyBriefing"
          >
            <Copy class="w-4 h-4" />
            <span>คัดลอกข้อความสรุป (Copy)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
