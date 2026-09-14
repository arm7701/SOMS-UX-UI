<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/PassesView.vue
 * วัตถุประสงค์: หน้าจอแผนการผ่านของดาวเทียม (Pass Detail Schedule)
 * แสดงตารางเวลา AOS/LOS ทั้งเวลา UTC และเวลาไทย พร้อมการแจ้งเตือนมุมยกต่ำ (< 5 องศา)
 * และปุ่มเชื่อมโยงสร้างรายงานภารกิจจากพาสได้ทันที
 * ============================================================================
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { CalendarDays, Filter, PlusCircle, AlertCircle, Orbit, Clock, Sparkles, Download } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const loading = ref(false)
const passes = ref([])
const selectedSatellite = ref(route.query.satellite ? String(route.query.satellite) : '46320')
const filterMode = ref('all') // 'all' | 'today' | 'upcoming' | 'high_el' | 'low_el'

const columns = [
  { key: 'satellite_name', label: 'ดาวเทียม', width: '130px' },
  { key: 'utc_time', label: 'เวลา (UTC)', sortable: true },
  { key: 'local_date', label: 'วันที่ (ไทย)', sortable: true, width: '120px' },
  { key: 'local_time', label: 'ช่วงเวลาผ่าน (เวลาไทย)', width: '160px' },
  { key: 'duration', label: 'ระยะเวลา', width: '110px', align: 'center' },
  { key: 'maxEl', label: 'มุมยกสูงสุด', sortable: true, width: '110px', align: 'center' },
  { key: 'status', label: 'สถานะพาส', width: '130px', align: 'center' }
]

const fetchPasses = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const query = selectedSatellite.value ? `?satellite_id=${selectedSatellite.value}` : ''
    const data = await api.get(`/passes${query}`)
    passes.value = data || []
  } catch (err) {
    console.error('โหลดข้อมูลพาสผิดพลาด:', err)
  } finally {
    if (!silent) loading.value = false
  }
}

onMounted(() => {
  fetchPasses()
})

// เฝ้าติดตามการสั่งรีเฟรชข้อมูลอัตโนมัติ
watch(() => appStore.refreshTrigger, () => {
  fetchPasses(true)
})

const todayIso = new Date().toISOString().slice(0, 10)

const processedPasses = computed(() => {
  const nowTs = Date.now()
  return passes.value.map(p => {
    const aosDate = new Date(`${p.aos_date_utc}T${p.aos_time_utc}Z`)
    const isUpcoming = aosDate.getTime() > nowTs
    const isToday = p.aos_date_utc === todayIso || (p.aos_date_local && p.aos_date_local.includes(todayIso))
    const maxElevation = Number(p.maxEl) || 0
    const isLowElevation = maxElevation < 5

    return {
      ...p,
      satellite_name: Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : 'NAPA-2 N',
      utc_time: `${p.aos_date_utc} ${p.aos_time_utc} – ${p.los_time_utc}`,
      local_date: p.aos_date_local,
      local_time: `${p.aos_time_local} – ${p.los_time_local}`,
      duration: `${p.duration_min}น. ${p.duration_sec}วิ.`,
      isLowElevation,
      maxElevation,
      isUpcoming,
      isToday,
      aosDate
    }
  })
})

const filteredPasses = computed(() => {
  let list = processedPasses.value
  if (filterMode.value === 'today') {
    list = list.filter(p => p.isToday)
  } else if (filterMode.value === 'upcoming') {
    list = list.filter(p => p.isUpcoming)
  } else if (filterMode.value === 'high_el') {
    list = list.filter(p => p.maxElevation >= 20)
  } else if (filterMode.value === 'low_el') {
    list = list.filter(p => p.isLowElevation)
  }
  return list
})

// สถิติพาสสำหรับตัวชี้วัดและปุ่มกรอง
const stats = computed(() => {
  const all = processedPasses.value
  const total = all.length
  const today = all.filter(p => p.isToday).length
  const upcoming = all.filter(p => p.isUpcoming).length
  const highEl = all.filter(p => p.maxElevation >= 20).length
  const lowEl = all.filter(p => p.isLowElevation).length
  const normal = total - lowEl
  return { total, today, upcoming, highEl, lowEl, normal }
})

const createReportFromPass = (pass) => {
  router.push(`/reports/new?pass=${pass.id}`)
}

// ส่งออกตารางพาสที่กำลังแสดงเป็นไฟล์ CSV (รองรับภาษาไทยสำหรับ Excel ด้วย UTF-8 BOM)
const exportPassesToCsv = () => {
  const rows = filteredPasses.value
  if (!rows || rows.length === 0) {
    appStore.showToast('ไม่มีข้อมูล', 'ไม่มีรายการรอบพาสสำหรับส่งออกในขณะนี้', 'warning')
    return
  }

  const headers = ['ลำดับ', 'ดาวเทียม', 'รอบพาส', 'วันที่ (ไทย)', 'AOS (UTC)', 'LOS (UTC)', 'AOS (ไทย)', 'LOS (ไทย)', 'มุมยกสูงสุด (MaxEl)', 'ระยะเวลา', 'สถานะ']
  const csvRows = [headers.join(',')]

  rows.forEach((r, idx) => {
    const row = [
      idx + 1,
      `"${r.satellite_name}"`,
      `"${r.pass_name}"`,
      `"${r.local_date}"`,
      `"${r.aos_time_utc}"`,
      `"${r.los_time_utc}"`,
      `"${r.aos_time_local}"`,
      `"${r.los_time_local}"`,
      r.maxElevation,
      `"${r.duration_min}m ${r.duration_sec}s"`,
      `"${r.isLowElevation ? 'Abort (<5°)' : 'Ready'}"`
    ]
    csvRows.push(row.join(','))
  })

  const csvContent = '\uFEFF' + csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `soms-passes-${selectedSatellite.value}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  appStore.showToast('ส่งออกสำเร็จ', `ดาวน์โหลดตารางพาส ${rows.length} รายการเป็นไฟล์ CSV เรียบร้อยแล้ว`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-space-700">
      <div>
        <div class="flex items-center gap-2">
          <CalendarDays class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
            แผนการผ่านดาวเทียม (Pass Detail)
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ตารางเวลาการโคจรผ่านสถานีภาคพื้นดิน (AOS - Acquisition of Signal / LOS - Loss of Signal)
        </p>
      </div>

      <!-- Satellite Filter Selector & Export Action -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200/80 dark:border-sky-800/50 bg-sky-50 dark:bg-space-850 hover:bg-sky-100 dark:hover:bg-space-800 text-sky-700 dark:text-sky-300 text-xs font-semibold transition-colors shadow-2xs"
          title="ดาวน์โหลดตารางพาสเป็นไฟล์ CSV สำหรับ Excel"
          @click="exportPassesToCsv"
        >
          <Download class="w-3.5 h-3.5 text-sky-500" />
          <span>ส่งออก CSV</span>
        </button>

        <div class="flex items-center gap-2">
          <label for="sat-select" class="text-xs font-semibold text-slate-600 dark:text-slate-300">
            ดาวเทียม:
          </label>
          <select
            id="sat-select"
            v-model="selectedSatellite"
            class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
            @change="fetchPasses"
          >
            <option value="46320">NAPA-1 N (46320)</option>
            <option value="48963">NAPA-2 N (48963)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Quick Pass Summary Chips -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-3.5 rounded-xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700 shadow-2xs flex items-center justify-between">
        <span class="text-xs font-semibold text-sky-200 dark:text-sky-200">พาสทั้งหมดที่ตรวจพบ</span>
        <span class="text-base font-bold font-mono text-slate-800 dark:text-white">{{ stats.total }} รอบ</span>
      </div>
      <div class="p-3.5 rounded-xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700 shadow-2xs flex items-center justify-between">
        <span class="text-xs font-semibold text-sky-200 dark:text-sky-200">พาสมุมยกปกติ (พร้อมปฏิบัติ)</span>
        <span class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ stats.normal }} รอบ</span>
      </div>
      <div class="p-3.5 rounded-xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700 shadow-2xs flex items-center justify-between">
        <span class="text-xs font-semibold text-sky-200 dark:text-sky-200">พาสมุมต่ำ (&lt; 5° แนะนำ Abort)</span>
        <span class="text-base font-bold font-mono text-rose-600 dark:text-rose-400">{{ stats.lowEl }} รอบ</span>
      </div>
    </div>

    <!-- Filter Chips Bar (ปุ่มกรองพาสด่วน) -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none">
      <span class="text-sky-200 dark:text-sky-200 flex items-center gap-1 mr-1 flex-shrink-0 font-semibold">
        <Filter class="w-3.5 h-3.5 text-sky-400" />
        <span>ตัวกรอง:</span>
      </span>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap"
        :class="filterMode === 'all'
          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
          : 'bg-white dark:bg-space-850 border-slate-200 dark:border-space-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-space-800'"
        @click="filterMode = 'all'"
      >
        ทั้งหมด ({{ stats.total }})
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1"
        :class="filterMode === 'today'
          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
          : 'bg-white dark:bg-space-850 border-slate-200 dark:border-space-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-space-800'"
        @click="filterMode = 'today'"
      >
        <span>📅 เฉพาะวันนี้</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'today' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'">{{ stats.today }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1"
        :class="filterMode === 'upcoming'
          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
          : 'bg-white dark:bg-space-850 border-slate-200 dark:border-space-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-space-800'"
        @click="filterMode = 'upcoming'"
      >
        <span>⏳ ที่จะมาถึง (Upcoming)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'upcoming' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'">{{ stats.upcoming }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1"
        :class="filterMode === 'high_el'
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
          : 'bg-white dark:bg-space-850 border-slate-200 dark:border-space-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-space-800'"
        @click="filterMode = 'high_el'"
      >
        <span>🎯 มุมยกสูง (&ge; 20°)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'high_el' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'">{{ stats.highEl }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1"
        :class="filterMode === 'low_el'
          ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
          : 'bg-white dark:bg-space-850 border-slate-200 dark:border-space-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-space-800'"
        @click="filterMode = 'low_el'"
      >
        <span>⚠️ มุมต่ำ (&lt; 5° Abort)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'low_el' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'">{{ stats.lowEl }}</span>
      </button>
    </div>

    <!-- Passes DataTable -->
    <DataTable
      :columns="columns"
      :data="filteredPasses"
      search-placeholder="ค้นหาวันที่, เวลา หรือรอบพาส..."
      :default-page-size="25"
    >
      <template #cell(satellite_name)="{ row }">
        <div class="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-100">
          <Orbit class="w-3.5 h-3.5 text-blue-600" />
          <span>{{ row.satellite_name }}</span>
        </div>
      </template>

      <template #cell(utc_time)="{ value }">
        <span class="font-mono text-xs text-blue-700 dark:text-blue-400 font-medium">
          {{ value }}
        </span>
      </template>

      <template #cell(local_time)="{ value }">
        <span class="font-mono text-xs text-slate-700 dark:text-slate-300">
          {{ value }}
        </span>
      </template>

      <template #cell(maxEl)="{ value, row }">
        <span
          class="font-mono font-bold text-xs"
          :class="row.isLowElevation ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'"
        >
          {{ value }}°
        </span>
      </template>

      <template #cell(status)="{ row }">
        <StatusBadge
          :label="row.isLowElevation ? 'Abort (<5°)' : 'พร้อมติดต่อ'"
          :status="row.isLowElevation ? 'danger' : 'normal'"
        />
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300 text-xs font-semibold transition-colors"
          title="สร้างรายงานบันทึกผลการปฏิบัติการพาสนี้"
          @click="createReportFromPass(row)"
        >
          <PlusCircle class="w-3.5 h-3.5" />
          <span>สร้างรายงาน</span>
        </button>
      </template>
    </DataTable>
  </div>
</template>
