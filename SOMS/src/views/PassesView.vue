<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/PassesView.vue
 * วัตถุประสงค์: หน้าจอแผนการผ่านของดาวเทียม (Pass Detail Schedule)
 * ธีมดำเทาไททาเนียม: คอนทราสต์คมชัดทุกเซลล์ พร้อมระบบกรองและส่งออก CSV
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
  { key: 'satellite_name', label: 'ดาวเทียม', width: '13%', minWidth: '130px' },
  { key: 'utc_time', label: 'เวลา (UTC)', sortable: true, width: '18%', minWidth: '170px' },
  { key: 'local_date', label: 'วันที่ (ไทย)', sortable: true, width: '12%', minWidth: '110px' },
  { key: 'local_time', label: 'ช่วงเวลาผ่าน (เวลาไทย)', width: '18%', minWidth: '160px' },
  { key: 'duration', label: 'ระยะเวลา', width: '12%', minWidth: '110px', align: 'center' },
  { key: 'maxEl', label: 'มุมยกสูงสุด', sortable: true, width: '12%', minWidth: '110px', align: 'center' },
  { key: 'status', label: 'สถานะพาส', width: '15%', minWidth: '130px', align: 'center' }
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
  } else {
    const headers = ['ลำดับ', 'ดาวเทียม', 'รอบพาส', 'วันที่ (ไทย)', 'AOS (UTC)', 'LOS (UTC)', 'AOS (ไทย)', 'LOS (ไทย)', 'มุมยกสูงสุด (MaxEl)', 'ระยะเวลา', 'สถานะ']
    const csvRows = [headers.join(',')]

    rows.forEach((r, idx) => {
      const row = [
        idx + 1,
        `"${r.satellite_name}"`,
        `"${r.pass_name || ''}"`,
        `"${r.local_date || ''}"`,
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
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-700">
      <div>
        <div class="flex items-center gap-2">
          <CalendarDays class="w-6 h-6 text-cyan-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            แผนการผ่านดาวเทียม (Pass Detail)
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 font-prompt font-medium">
          ตารางเวลาการโคจรผ่านสถานีภาคพื้นดิน (AOS - Acquisition of Signal / LOS - Loss of Signal)
        </p>
      </div>

      <!-- Satellite Filter Selector & Export Action -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-700/60 bg-[#0c1424] hover:bg-[#121f38] text-cyan-200 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer font-prompt"
          title="ดาวน์โหลดตารางพาสเป็นไฟล์ CSV สำหรับ Excel"
          @click="exportPassesToCsv"
        >
          <Download class="w-4 h-4 text-cyan-400" />
          <span>ส่งออก CSV</span>
        </button>

        <div class="flex items-center gap-2 font-prompt">
          <label for="sat-select" class="text-xs sm:text-sm font-semibold text-slate-200">
            ดาวเทียม:
          </label>
          <select
            id="sat-select"
            v-model="selectedSatellite"
            class="px-3 py-1.5 rounded-xl border border-space-600 bg-space-850 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-xs cursor-pointer font-prompt"
            @change="fetchPasses"
          >
            <option value="46320">NAPA-1 N (46320)</option>
            <option value="48963">NAPA-2 N (48963)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Quick Pass Summary Chips (เต็มพื้นที่หน้าจอ พร้อมไอคอนและตัวเลขคมชัด) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 w-full">
      <div class="p-4 sm:p-5 rounded-2xl bg-[#0c121e]/90 border border-slate-700/80 shadow-xs flex items-center justify-between font-prompt">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Orbit class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs sm:text-sm font-semibold text-slate-300 block">พาสทั้งหมดที่ตรวจพบ</span>
            <span class="text-xl sm:text-2xl font-black font-mono text-white">{{ stats.total }} รอบ</span>
          </div>
        </div>
      </div>
      <div class="p-4 sm:p-5 rounded-2xl bg-[#0c121e]/90 border border-slate-700/80 shadow-xs flex items-center justify-between font-prompt">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs sm:text-sm font-semibold text-slate-300 block">พาสมุมยกปกติ (พร้อมปฏิบัติ)</span>
            <span class="text-xl sm:text-2xl font-black font-mono text-emerald-400">{{ stats.normal }} รอบ</span>
          </div>
        </div>
      </div>
      <div class="p-4 sm:p-5 rounded-2xl bg-[#0c121e]/90 border border-slate-700/80 shadow-xs flex items-center justify-between font-prompt">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs sm:text-sm font-semibold text-slate-300 block">พาสมุมต่ำ (&lt; 5° แนะนำ Abort)</span>
            <span class="text-xl sm:text-2xl font-black font-mono text-rose-400">{{ stats.lowEl }} รอบ</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Chips Bar (ปุ่มกรองพาสด่วน กระจายตัวสวยงามบนทุกขนาดหน้าจอ) -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none font-prompt flex-wrap w-full">
      <span class="text-zinc-400 flex items-center gap-1.5 mr-1 flex-shrink-0 font-semibold">
        <Filter class="w-4 h-4 text-cyan-400" />
        <span>ตัวกรอง:</span>
      </span>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer"
        :class="filterMode === 'all'
          ? 'bg-zinc-700 border-zinc-500 text-white shadow-sm'
          : 'bg-space-850 border-space-700 text-slate-200 hover:bg-space-800 hover:text-white'"
        @click="filterMode = 'all'"
      >
        ทั้งหมด ({{ stats.total }})
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer"
        :class="filterMode === 'today'
          ? 'bg-zinc-700 border-zinc-500 text-white shadow-sm'
          : 'bg-space-850 border-space-700 text-slate-200 hover:bg-space-800 hover:text-white'"
        @click="filterMode = 'today'"
      >
        <span>📅 เฉพาะวันนี้</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'today' ? 'bg-space-900 text-white' : 'bg-space-800 text-zinc-300'">{{ stats.today }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer"
        :class="filterMode === 'upcoming'
          ? 'bg-zinc-700 border-zinc-500 text-white shadow-sm'
          : 'bg-space-850 border-space-700 text-slate-200 hover:bg-space-800 hover:text-white'"
        @click="filterMode = 'upcoming'"
      >
        <span>⏳ ที่จะมาถึง (Upcoming)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'upcoming' ? 'bg-space-900 text-white' : 'bg-space-800 text-zinc-300'">{{ stats.upcoming }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer"
        :class="filterMode === 'high_el'
          ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-sm'
          : 'bg-space-850 border-space-700 text-slate-200 hover:bg-space-800 hover:text-white'"
        @click="filterMode = 'high_el'"
      >
        <span>🎯 มุมยกสูง (&ge; 20°)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'high_el' ? 'bg-emerald-900 text-emerald-200' : 'bg-space-800 text-zinc-300'">{{ stats.highEl }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer"
        :class="filterMode === 'low_el'
          ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-sm'
          : 'bg-space-850 border-space-700 text-slate-200 hover:bg-space-800 hover:text-white'"
        @click="filterMode = 'low_el'"
      >
        <span>⚠️ มุมต่ำ (&lt; 5° Abort)</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="filterMode === 'low_el' ? 'bg-rose-900 text-rose-200' : 'bg-space-800 text-zinc-300'">{{ stats.lowEl }}</span>
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
        <div class="flex items-center gap-1.5 font-semibold text-xs text-white">
          <Orbit class="w-3.5 h-3.5 text-zinc-300" />
          <span>{{ row.satellite_name }}</span>
        </div>
      </template>

      <template #cell(utc_time)="{ value }">
        <span class="font-mono text-xs text-slate-200 font-medium">
          {{ value }}
        </span>
      </template>

      <template #cell(local_time)="{ value }">
        <span class="font-mono text-xs text-slate-200 font-medium">
          {{ value }}
        </span>
      </template>

      <template #cell(maxEl)="{ value, row }">
        <span
          class="font-mono font-bold text-xs"
          :class="row.isLowElevation ? 'text-rose-400' : 'text-white'"
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
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-500/60 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer font-prompt"
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
