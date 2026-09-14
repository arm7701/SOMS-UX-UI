<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/ReportDetailModal.vue
 * วัตถุประสงค์: แสดงรายละเอียดรายงานปฏิบัติการดาวเทียมฉบับสมบูรณ์ในรูปแบบ Modal
 * พร้อมปุ่มคัดลอกข้อความ (Copy to Clipboard) และปุ่มดาวน์โหลดรายงาน PDF
 * ============================================================================
 */
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { api } from '@/api/client'
import { FileText, Copy, Check, FileDown, Orbit, Activity, ShieldAlert, Users } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  report: { type: Object, default: () => null }
})

const emit = defineEmits(['update:modelValue'])

const dataStore = useDataStore()
const appStore = useAppStore()
const copied = ref(false)

const copyToClipboard = async () => {
  if (!props.report) return
  const r = props.report

  const text = `
=== รายงานการปฏิบัติการดาวเทียม SOIS ===
Flight Pass No.: ${r.sat_flight_pass || '-'}
ดาวเทียม: ${dataStore.getSatelliteName(r.norad_id)}
รอบพาส: ${dataStore.getPassName(r.sat_seq)}
วันที่: ${r.sat_report_date || '-'}
ช่วงเวลา: AOS ${r.sat_pass_aos || '-'} - LOS ${r.sat_pass_los || '-'} (UTC)
ระยะเวลา: ${r.sat_pass_duration_min || 0} นาที ${r.sat_pass_duration_sec || 0} วินาที
มุมยกสูงสุด: ${r.sat_max_el || '-'}°

[สถานะระบบ]
- สถานีภาคพื้น (Ground Station): ${r.sat_gsostatus || '-'}
- ระบบควบคุมภารกิจ (MCS): ${r.sat_mcs || '-'}
- PDHU Free Space: ${r.sat_pdhufreespace || '-'} GB
- Last Image ID: ${r.sat_lastimg || '-'}

[เจ้าหน้าที่ผู้ปฏิบัติหน้าที่]
- Mission Director: ${dataStore.getUserDisplay(r.sat_md)}
- Flight Operator: ${dataStore.getUserDisplay(r.sat_fmo)}
- Ground Operator: ${dataStore.getUserDisplay(r.sat_gso)}

[ภารกิจ]
${(r.missions || []).map(m => `- ${m.mission_name || ''}: ${m.logmission_result || ''}`).join('\n') || '- ไม่มี'}

[ข้อขัดข้อง/Next Pass]
- การดำเนินการ Next Pass: ${r.sat_next_pass || '-'}
- หมายเหตุ: ${r.sat_note || '-'}
`.trim()

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    appStore.showToast('คัดลอกสำเร็จ', 'คัดลอกรายละเอียดรายงานลงคลิปบอร์ดแล้ว')
    setTimeout(() => { copied.value = false }, 2500)
  } catch {
    appStore.showToast('คัดลอกไม่สำเร็จ', 'เบราว์เซอร์ไม่อนุญาตให้เข้าถึงคลิปบอร์ด', 'error')
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="report ? `รายละเอียดรายงาน Flight No. ${report.sat_flight_pass}` : 'รายละเอียดรายงาน'"
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="report" class="space-y-6">
      <!-- Section 1: Top Key Summary -->
      <div class="p-4 rounded-2xl bg-blue-50/60 dark:bg-space-900 border border-blue-100 dark:border-space-700 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Orbit class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs text-slate-500 uppercase tracking-wider font-semibold">ดาวเทียมและรอบพาส</span>
            <h4 class="text-base font-bold text-slate-900 dark:text-white font-prompt">
              {{ dataStore.getSatelliteName(report.norad_id) }} • {{ dataStore.getPassName(report.sat_seq) }}
            </h4>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-space-700 transition-colors shadow-2xs"
            @click="copyToClipboard"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ copied ? 'คัดลอกแล้ว' : 'คัดลอกสรุป' }}</span>
          </button>

          <a
            :href="api.getPdfUrl(report.report_id)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileDown class="w-3.5 h-3.5" />
            <span>ดาวน์โหลด PDF</span>
          </a>
        </div>
      </div>

      <!-- Section 2: Pass & Time Telemetry -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
          <span class="text-slate-400 block font-medium">วันที่ปฏิบัติการ</span>
          <span class="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5 block">{{ report.sat_report_date || '—' }}</span>
        </div>
        <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
          <span class="text-slate-400 block font-medium">ช่วงเวลา (UTC)</span>
          <span class="font-bold text-blue-700 dark:text-blue-400 font-mono mt-0.5 block">{{ report.sat_pass_aos }} - {{ report.sat_pass_los }}</span>
        </div>
        <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
          <span class="text-slate-400 block font-medium">ระยะเวลาพาส</span>
          <span class="font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5 block">{{ report.sat_pass_duration_min }}น. {{ report.sat_pass_duration_sec }}วิ.</span>
        </div>
        <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
          <span class="text-slate-400 block font-medium">มุมยกสูงสุด (Max El)</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{{ report.sat_max_el }}°</span>
        </div>
      </div>

      <!-- Section 3: Missions Executed -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-prompt">
          <Activity class="w-4 h-4 text-blue-600" />
          <span>ภารกิจที่ปฏิบัติ (Missions & Results)</span>
        </h4>
        <div class="divide-y divide-slate-100 dark:divide-space-750 border border-slate-200 dark:border-space-700 rounded-xl overflow-hidden bg-white dark:bg-space-800">
          <div
            v-for="(m, idx) in report.missions || []"
            :key="idx"
            class="p-3 flex items-start justify-between gap-4 text-xs"
          >
            <div>
              <span class="font-bold text-slate-800 dark:text-slate-100 block">{{ m.mission_name }}</span>
              <span class="text-slate-500 dark:text-slate-400 block mt-0.5">{{ m.logmission_name || 'ไม่มีรายละเอียดเพิ่มเติม' }}</span>
            </div>
            <StatusBadge :label="m.logmission_result || 'ปกติ'" :status="m.logmission_result" size="sm" />
          </div>
          <div v-if="!report.missions || report.missions.length === 0" class="p-4 text-center text-slate-400 text-xs">
            ไม่มีรายการภารกิจที่บันทึก
          </div>
        </div>
      </div>

      <!-- Section 4: Systems Status -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-prompt">
          สถานะระบบดาวเทียมและอุปกรณ์ (Systems Status)
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
            <span class="text-slate-400 block">Ground Station</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ report.sat_gsostatus || '—' }}</span>
          </div>
          <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
            <span class="text-slate-400 block">MCS System</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ report.sat_mcs || '—' }}</span>
          </div>
          <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
            <span class="text-slate-400 block">PDHU Free Space</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ report.sat_pdhufreespace ? `${report.sat_pdhufreespace} GB` : '—' }}</span>
          </div>
          <div class="p-3 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800">
            <span class="text-slate-400 block">Last Image ID</span>
            <span class="font-bold text-slate-800 dark:text-slate-100">{{ report.sat_lastimg || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Section 5: Troubleshooting & Next Pass -->
      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-prompt">
          <ShieldAlert class="w-4 h-4 text-amber-500" />
          <span>ข้อขัดข้องและการดำเนินการ Next Pass</span>
        </h4>
        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-space-700 bg-white dark:bg-space-800 text-xs space-y-2">
          <div v-if="report.troubles && report.troubles.length > 0" class="divide-y divide-slate-100 dark:divide-space-750">
            <div v-for="(t, i) in report.troubles" :key="i" class="py-2 flex items-start justify-between gap-2">
              <div>
                <span class="font-bold text-rose-600 dark:text-rose-400">{{ t.trouble_name }}</span>
                <p class="text-slate-600 dark:text-slate-300 mt-0.5">{{ t.logtrouble_name }}</p>
              </div>
              <StatusBadge :label="t.logtrouble_result || 'แก้ไขแล้ว'" :status="t.logtrouble_result" size="sm" />
            </div>
          </div>
          <p v-else class="text-slate-500">ไม่พบข้อขัดข้องในพาสนี้</p>

          <div v-if="report.sat_next_pass" class="pt-2 border-t border-slate-100 dark:border-space-750">
            <span class="font-bold text-slate-700 dark:text-slate-300 block">การดำเนินการในพาสถัดไป:</span>
            <p class="text-slate-600 dark:text-slate-300 mt-0.5">{{ report.sat_next_pass }}</p>
          </div>
        </div>
      </div>

      <!-- Section 6: Staff On Duty -->
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-space-900 border border-slate-200 dark:border-space-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-slate-400" />
          <span class="font-semibold text-slate-600 dark:text-slate-300">เจ้าหน้าที่รับผิดชอบ:</span>
        </div>
        <div class="flex items-center gap-4 text-slate-700 dark:text-slate-200">
          <span><strong>MD:</strong> {{ dataStore.getUserDisplay(report.sat_md) }}</span>
          <span><strong>FMO:</strong> {{ dataStore.getUserDisplay(report.sat_fmo) }}</span>
          <span><strong>GSO:</strong> {{ dataStore.getUserDisplay(report.sat_gso) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-space-750 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
        @click="emit('update:modelValue', false)"
      >
        ปิดหน้าต่าง
      </button>
    </template>
  </BaseModal>
</template>
