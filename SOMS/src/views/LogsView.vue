<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/LogsView.vue
 * วัตถุประสงค์: หน้าจอบันทึกประวัติกิจกรรมและ Audit Logs (Activity & Audit Logs)
 * ตามที่ผู้ใช้ระบุ: "ในเว็บแอพมีระบบ login โชว์ หน้า log และอื่น ช่วยแบ่งไฟล์ เป็นหน้าๆเลยก็ดี"
 * แสดงประวัติการล็อกอิน, การสร้างรายงาน, การติดตามพาสดาวเทียม และการแจ้งเตือน
 * ============================================================================
 */
import { ref, onMounted, computed } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { History, Filter, Download, ShieldCheck, RefreshCw, User, Terminal } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const appStore = useAppStore()

const loading = ref(false)
const logs = ref([])
const selectedCategory = ref('ALL')
const selectedSeverity = ref('ALL')

const columns = [
  { key: 'timestamp', label: 'วัน-เวลา (Timestamp)', sortable: true, width: '16%', minWidth: '150px' },
  { key: 'user', label: 'ผู้ดำเนินการ (User / Source)', width: '18%', minWidth: '160px' },
  { key: 'category', label: 'หมวดหมู่งาน', width: '12%', minWidth: '110px', align: 'center' },
  { key: 'action', label: 'กิจกรรม (Action)', width: '16%', minWidth: '140px' },
  { key: 'details', label: 'รายละเอียดเหตุการณ์ (Event Details)', width: '28%', minWidth: '200px' },
  { key: 'severity', label: 'ระดับ (Severity)', width: '10%', minWidth: '90px', align: 'center' }
]

const fetchLogs = async () => {
  loading.value = true
  try {
    const data = await api.get('/logs')
    logs.value = data || []
  } catch (err) {
    console.error('โหลด Logs ผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchCat = selectedCategory.value === 'ALL' || log.category === selectedCategory.value
    const matchSev = selectedSeverity.value === 'ALL' || log.severity === selectedSeverity.value
    return matchCat && matchSev
  })
})

const exportLogsCsv = () => {
  const headers = ['ID', 'Timestamp', 'User', 'Category', 'Action', 'Details', 'Severity']
  const rows = filteredLogs.value.map(l => [
    l.log_id,
    `"${l.timestamp}"`,
    `"${l.user}"`,
    `"${l.category}"`,
    `"${l.action}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
    l.severity
  ])

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `soms_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  appStore.showToast('ส่งออกสำเร็จ', 'ดาวน์โหลดไฟล์บันทึกประวัติ (CSV) เรียบร้อย')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-space-700">
      <div>
        <div class="flex items-center gap-2">
          <History class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
            บันทึกกิจกรรมระบบ (Activity & Audit Logs)
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ประวัติการเข้าใช้งานระบบ การปฏิบัติการพาสดาวเทียม และเหตุการณ์ความมั่นคงปลอดภัย
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-space-700 transition-colors shadow-2xs"
          @click="fetchLogs"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
          <span>รีเฟรช</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          @click="exportLogsCsv"
        >
          <Download class="w-3.5 h-3.5" />
          <span>ส่งออก CSV</span>
        </button>
      </div>
    </div>

    <!-- Filters & DataTable -->
    <DataTable
      :columns="columns"
      :data="filteredLogs"
      search-placeholder="ค้นหาข้อความ, กิจกรรม, ชื่อผู้ใช้ หรือ IP..."
      :default-page-size="25"
    >
      <template #filters>
        <!-- Category Filter -->
        <select
          v-model="selectedCategory"
          class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">ทุกหมวดหมู่ (All Categories)</option>
          <option value="AUTH">การเข้าสู่ระบบ (AUTH)</option>
          <option value="REPORT">รายงานภารกิจ (REPORT)</option>
          <option value="PASS">พาสดาวเทียม (PASS)</option>
          <option value="TELEMETRY">โทรมาตร (TELEMETRY)</option>
          <option value="WEATHER">สภาพอวกาศ (WEATHER)</option>
          <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
        </select>

        <!-- Severity Filter -->
        <select
          v-model="selectedSeverity"
          class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">ทุกระดับ (All Severity)</option>
          <option value="SUCCESS">สำเร็จ (SUCCESS)</option>
          <option value="INFO">ข้อมูล (INFO)</option>
          <option value="WARNING">แจ้งเตือน (WARNING)</option>
          <option value="ERROR">ข้อผิดพลาด (ERROR)</option>
        </select>
      </template>

      <template #cell(timestamp)="{ value }">
        <span class="font-mono text-xs text-slate-700 dark:text-slate-300 font-medium">
          {{ value }}
        </span>
      </template>

      <template #cell(user)="{ value }">
        <div class="flex items-center gap-1.5">
          <Terminal v-if="value.includes('SYSTEM')" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <User v-else class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span class="font-medium text-xs text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
            {{ value }}
          </span>
        </div>
      </template>

      <template #cell(category)="{ value }">
        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono uppercase bg-slate-100 dark:bg-space-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-space-700">
          {{ value }}
        </span>
      </template>

      <template #cell(action)="{ value }">
        <span class="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
          {{ value }}
        </span>
      </template>

      <template #cell(details)="{ value }">
        <span class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ value }}
        </span>
      </template>

      <template #cell(severity)="{ value }">
        <StatusBadge
          :label="value"
          :status="value.toLowerCase()"
          size="sm"
        />
      </template>
    </DataTable>
  </div>
</template>
