<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/ReportsView.vue
 * วัตถุประสงค์: หน้าจอรายการรายงานผลการปฏิบัติการดาวเทียม (Reports List)
 * รองรับการค้นหา, ดูรายละเอียด (Modal), ดาวน์โหลด PDF และลบรายงาน
 * ============================================================================
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { FileText, Plus, Eye, FileDown, Trash2 } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import ReportDetailModal from './ReportDetailModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const dataStore = useDataStore()
const appStore = useAppStore()
const authStore = useAuthStore()

const loading = ref(false)
const reports = ref([])
const selectedReport = ref(null)
const showDetailModal = ref(false)

// Delete Dialog
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const columns = [
  { key: 'sat_flight_pass', label: 'Flight No.', sortable: true, width: '130px' },
  { key: 'date_display', label: 'วันที่ (Date)', sortable: true, width: '130px' },
  { key: 'satellite_name', label: 'ดาวเทียม', width: '130px' },
  { key: 'pass_name', label: 'รอบพาส', width: '120px' },
  { key: 'pass_time', label: 'เวลา (AOS - LOS)', width: '170px' },
  { key: 'md_name', label: 'MD ประจำเวร', width: '140px' },
  { key: 'created_by', label: 'ผู้จัดทำ', width: '140px' }
]

const fetchReports = async () => {
  loading.value = true
  try {
    const data = await api.get('/reports')
    reports.value = data || []
  } catch (err) {
    console.error('โหลดรายงานผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await dataStore.fetchLookups()
  await fetchReports()
})

const formattedReports = computed(() => {
  return reports.value.map(r => ({
    ...r,
    date_display: r.sat_report_date || '—',
    satellite_name: dataStore.getSatelliteName(r.norad_id),
    pass_name: dataStore.getPassName(r.sat_seq),
    pass_time: `${r.sat_pass_aos || '-'} - ${r.sat_pass_los || '-'}`,
    md_name: dataStore.getUserDisplay(r.sat_md),
    created_by: dataStore.getUserDisplay(r.rbac_id),
    isOwner: String(r.rbac_id) === String(authStore.user?.rbac_id) || authStore.isAdmin
  }))
})

const viewReport = (row) => {
  selectedReport.value = row
  showDetailModal.value = true
}

const confirmDeleteReport = (row) => {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

const handleDeleteReport = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/reports/${deleteTarget.value.report_id}`)
    appStore.showToast('สำเร็จ', `ลบรายงาน Flight No. ${deleteTarget.value.sat_flight_pass} แล้ว`)
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchReports()
  } catch (err) {
    appStore.showToast('ลบล้มเหลว', err.message, 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
      <div>
        <div class="flex items-center gap-2">
          <FileText class="w-6 h-6 text-zinc-300" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            รายงานภารกิจดาวเทียม (Satellite Reports)
          </h1>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          บันทึกผลการปฏิบัติการประจำรอบพาส สภาพระบบ และข้อขัดข้อง
        </p>
      </div>

      <div>
        <router-link
          to="/reports/new"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 text-white text-xs font-semibold border border-zinc-500/60 shadow-md shadow-black/40 transition-all active:scale-[0.98]"
        >
          <Plus class="w-4 h-4 text-zinc-200" />
          <span>สร้างรายงานภารกิจใหม่</span>
        </router-link>
      </div>
    </div>

    <!-- Reports Table -->
    <DataTable
      :columns="columns"
      :data="formattedReports"
      search-placeholder="ค้นหา Flight No., วันที่, ดาวเทียม หรือผู้บันทึก..."
      :default-page-size="25"
    >
      <template #cell(sat_flight_pass)="{ value }">
        <span class="font-mono font-bold text-xs text-white bg-zinc-800/90 px-2.5 py-1 rounded-md border border-zinc-700/80">
          {{ value }}
        </span>
      </template>

      <template #cell(pass_time)="{ value }">
        <span class="font-mono text-xs text-zinc-300 font-medium">
          {{ value }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <!-- View Detail -->
          <button
            type="button"
            class="p-1.5 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-300 hover:bg-zinc-750 hover:text-white hover:border-zinc-500 transition-colors shadow-2xs"
            title="ดูรายละเอียดฉบับเต็ม"
            @click="viewReport(row)"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>

          <!-- PDF Download -->
          <a
            :href="api.getPdfUrl(row.report_id)"
            target="_blank"
            rel="noopener noreferrer"
            class="p-1.5 rounded-lg border border-amber-900/60 text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 hover:border-amber-700 transition-colors shadow-2xs"
            title="เปิดไฟล์ PDF"
          >
            <FileDown class="w-3.5 h-3.5" />
          </a>

          <!-- Delete (Only Owner or Admin) -->
          <button
            v-if="row.isOwner"
            type="button"
            class="p-1.5 rounded-lg border border-rose-900/60 text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 hover:border-rose-700 transition-colors shadow-2xs"
            title="ลบรายงาน"
            @click="confirmDeleteReport(row)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Full Report Detail Modal -->
    <ReportDetailModal
      v-model="showDetailModal"
      :report="selectedReport"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="ยืนยันการลบรายงานภารกิจ"
      :message="`ท่านต้องการลบรายงาน Flight No. ${deleteTarget?.sat_flight_pass || ''} ใช่หรือไม่?`"
      confirm-text="ลบรายงาน"
      @confirm="handleDeleteReport"
    />
  </div>
</template>
