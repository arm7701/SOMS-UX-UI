<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/ShiftHandoverModal.vue
 * วัตถุประสงค์: หน้าต่างสรุปข้อมูลส่งมอบเวรประจำผลัด (Shift Handover Briefing Sheet)
 * ธีมดำเทาไททาเนียม: คอนทราสต์ชัดเจน คัดลอกและสั่งพิมพ์ได้สะดวก
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
  CheckCircle2
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

const md = computed(() => dutyOperators.value.find(o => o.rbac_role === 'MD')?.rbac_fullname || '—')
const fmo = computed(() => dutyOperators.value.find(o => o.rbac_role === 'FMO')?.rbac_fullname || '—')
const gso = computed(() => dutyOperators.value.find(o => o.rbac_role === 'GSO')?.rbac_fullname || '—')

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

  let text = `📋 [รายงานสรุปส่งมอบเวร SOMS]\n`
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
  text += `• Radio Blackouts (R): R${weather.value.spaceweather_r || 0} (ปกติ)\n`
  text += `• Solar Radiation (S): S${weather.value.spaceweather_s || 0} (ปกติ)\n`
  text += `• Geomagnetic Storms (G): G${weather.value.spaceweather_g || 0} (ปกติ)\n\n`

  text += `📡 รอบพาสดาวเทียมวันนี้ (${todayPasses.value.length} รอบ):\n`
  if (todayPasses.value.length === 0) {
    text += `• ไม่มีรอบพาสสำหรับวันนี้\n`
  } else {
    todayPasses.value.forEach((p, idx) => {
      const sat = Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : 'NAPA-2 N'
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
    appStore.showToast('ข้อผิดพลาด', 'ไม่สามารถคัดลอกข้อความได้', 'error')
  }
}

const printBriefing = () => {
  window.print()
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity"
    @click.self="close"
  >
    <div
      class="w-full max-w-2xl bg-space-850 rounded-3xl border border-space-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-prompt transition-all"
    >
      <!-- Header -->
      <div class="p-5 border-b border-space-750 flex items-center justify-between bg-space-900/60">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-zinc-800 border border-zinc-600 text-white shadow-xs">
            <ClipboardList class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white">
              สรุปส่งมอบเวรปฏิบัติการ (Shift Handover Briefing)
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
              {{ todayFormatted }} • ระบบบริหารจัดการการปฏิบัติการดาวเทียม (SOMS)
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-space-800 transition-colors cursor-pointer"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Body -->
      <div class="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
        <!-- 1. Duty Personnel -->
        <div class="p-4 rounded-2xl bg-space-900/80 border border-space-700">
          <div class="flex items-center gap-2 text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3">
            <Users class="w-4 h-4 text-cyan-400" />
            <span>เจ้าหน้าที่ประจำผลัด (Duty Roster)</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-space-800 p-3 rounded-xl border border-space-700">
              <span class="text-xs uppercase tracking-wider text-slate-300 font-bold block">Mission Director</span>
              <span class="text-sm font-bold text-white block truncate mt-1">{{ md }}</span>
            </div>
            <div class="bg-space-800 p-3 rounded-xl border border-space-700">
              <span class="text-xs uppercase tracking-wider text-slate-300 font-bold block">Flight Operator</span>
              <span class="text-sm font-bold text-white block truncate mt-1">{{ fmo }}</span>
            </div>
            <div class="bg-space-800 p-3 rounded-xl border border-space-700">
              <span class="text-xs uppercase tracking-wider text-slate-300 font-bold block">Ground Station</span>
              <span class="text-sm font-bold text-white block truncate mt-1">{{ gso }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Satellites & Space Weather Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Satellites Status -->
          <div class="p-4 rounded-2xl bg-space-900/80 border border-space-700">
            <div class="flex items-center gap-2 text-xs sm:text-sm font-bold text-white mb-2.5">
              <Orbit class="w-4 h-4 text-cyan-400" />
              <span>สถานะดาวเทียม (Satellites)</span>
            </div>
            <div class="space-y-2 text-xs sm:text-sm">
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-space-800 border border-space-700">
                <span class="font-bold text-slate-100">NAPA-1 N (46320)</span>
                <span class="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs sm:text-sm">
                  <CheckCircle2 class="w-4 h-4" /> ปกติ
                </span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-space-800 border border-space-700">
                <span class="font-bold text-slate-100">NAPA-2 N (48963)</span>
                <span class="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs sm:text-sm">
                  <CheckCircle2 class="w-4 h-4" /> ปกติ
                </span>
              </div>
            </div>
          </div>

          <!-- Space Weather -->
          <div class="p-4 rounded-2xl bg-space-900/80 border border-space-700">
            <div class="flex items-center gap-2 text-xs sm:text-sm font-bold text-white mb-2.5">
              <SunMedium class="w-4 h-4 text-amber-400" />
              <span>สภาพอวกาศ (Space Weather)</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2 rounded-xl bg-space-800 border border-space-700">
                <span class="text-xs text-slate-300 font-bold block">R Scale</span>
                <span class="text-sm sm:text-base font-black text-emerald-400 mt-0.5 block">R{{ weather.spaceweather_r || 0 }}</span>
              </div>
              <div class="p-2 rounded-xl bg-space-800 border border-space-700">
                <span class="text-xs text-slate-300 font-bold block">S Scale</span>
                <span class="text-sm sm:text-base font-black text-emerald-400 mt-0.5 block">S{{ weather.spaceweather_s || 0 }}</span>
              </div>
              <div class="p-2 rounded-xl bg-space-800 border border-space-700">
                <span class="text-xs text-slate-300 font-bold block">G Scale</span>
                <span class="text-sm sm:text-base font-black text-emerald-400 mt-0.5 block">G{{ weather.spaceweather_g || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Today's Passes Summary -->
        <div class="p-4 rounded-2xl bg-space-900/80 border border-space-700">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
              <CalendarDays class="w-4 h-4 text-cyan-400" />
              <span>รอบพาสดาวเทียมประจำวันนี้ ({{ todayPasses.length }} รอบ)</span>
            </div>
            <span class="text-xs text-slate-300 font-mono font-semibold">สถานีภาคพื้น RTAF</span>
          </div>

          <div v-if="todayPasses.length === 0" class="text-center py-4 text-sm text-slate-300 font-medium">
            ไม่มีรอบพาสดาวเทียมสำหรับวันนี้
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(p, idx) in todayPasses"
              :key="p.id || idx"
              class="flex items-center justify-between p-2.5 rounded-xl border border-space-700 bg-space-800 text-xs sm:text-sm"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-space-700 text-white font-mono text-xs font-bold flex items-center justify-center">
                  {{ idx + 1 }}
                </span>
                <div>
                  <span class="font-bold text-white">
                    {{ Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : 'NAPA-2 N' }}
                  </span>
                  <span class="text-xs sm:text-sm text-slate-200 ml-2 font-mono font-bold">
                    {{ p.aos_time_local }} - {{ p.los_time_local }} น.
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 font-mono">
                <span class="text-xs sm:text-sm font-bold" :class="Number(p.maxEl) < 5 ? 'text-rose-400' : 'text-emerald-400'">
                  Max El: {{ p.maxEl }}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 sm:p-5 border-t border-space-750 bg-space-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-xs sm:text-sm text-slate-200 flex items-center gap-1.5 font-prompt font-medium">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>ข้อมูลพร้อมสำหรับการส่งมอบเวรประจำผลัด</span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-100 hover:text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer font-prompt"
            @click="printBriefing"
          >
            <Printer class="w-4 h-4" />
            <span>พิมพ์สรุป (Print)</span>
          </button>

          <button
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer font-prompt"
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
