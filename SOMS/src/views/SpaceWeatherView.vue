<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/SpaceWeatherView.vue
 * วัตถุประสงค์: หน้าจอสภาพอวกาศ (Space Weather Monitoring)
 * บันทึกระดับความรุนแรงของพายุแม่เหล็กโลกและพายุสุริยะตามมาตรวัด NOAA
 * ============================================================================
 */
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { SunMedium, ShieldAlert, Info } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const loading = ref(false)
const weatherLogs = ref([])

const columns = [
  { key: 'spaceweather_date', label: 'วันที่ (Date)', sortable: true, width: '130px' },
  { key: 'spaceweather_r', label: 'Radio Blackout (R)', width: '160px', align: 'center' },
  { key: 'spaceweather_s', label: 'Solar Radiation (S)', width: '160px', align: 'center' },
  { key: 'spaceweather_g', label: 'Geomagnetic (G)', width: '160px', align: 'center' },
  { key: 'spaceweather_note', label: 'รายละเอียดสภาพอวกาศ/จุดดับดวงอาทิตย์' }
]

const fetchWeather = async () => {
  loading.value = true
  try {
    const data = await api.get('/space-weather')
    weatherLogs.value = data || []
  } catch (err) {
    console.error('ดึงข้อมูลสภาพอวกาศล้มเหลว:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWeather()
})

const getScaleStatus = (num) => {
  if (num >= 4) return 'danger'
  if (num >= 2) return 'warning'
  return 'normal'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-space-700">
      <div>
        <div class="flex items-center gap-2">
          <SunMedium class="w-6 h-6 text-amber-500" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
            สภาพอวกาศ (Space Weather)
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          การเฝ้าระวังพายุรังสีสุริยะและการรบกวนคลื่นวิทยุสื่อสารดาวเทียมตามมาตรฐาน NOAA
        </p>
      </div>
    </div>

    <!-- NOAA Scale Information Card -->
    <div class="bg-blue-50/50 dark:bg-space-850 p-4 rounded-2xl border border-blue-100 dark:border-space-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">
          R
        </div>
        <div>
          <h4 class="font-bold text-slate-800 dark:text-white">Radio Blackout (R0–R5)</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            การรบกวนชั้นบรรยากาศไอโอโนสเฟียร์จากแสง X-Ray ส่งผลกระทบต่อสัญญาณ UHF/VHF
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
          S
        </div>
        <div>
          <h4 class="font-bold text-slate-800 dark:text-white">Solar Radiation Storm (S0–S5)</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            พายุอนุภาคโปรตอนพลังงานสูง ส่งผลต่อวงจรอิเล็กทรอนิกส์และเซ็นเซอร์ดาวเทียม
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center font-bold flex-shrink-0">
          G
        </div>
        <div>
          <h4 class="font-bold text-slate-800 dark:text-white">Geomagnetic Storm (G0–G5)</h4>
          <p class="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            การเหนี่ยวนำสนามแม่เหล็กโลกแปรปรวน เพิ่มแรงต้านอากาศทำให้ดาวเทียมลดระดับความสูง
          </p>
        </div>
      </div>
    </div>

    <!-- Weather History Table -->
    <DataTable
      :columns="columns"
      :data="weatherLogs"
      search-placeholder="ค้นหาวันที่หรือบันทึก..."
      :default-page-size="25"
    >
      <template #cell(spaceweather_r)="{ value }">
        <StatusBadge
          :label="`R${value !== undefined ? value : '-'}`"
          :status="getScaleStatus(value)"
          size="sm"
        />
      </template>

      <template #cell(spaceweather_s)="{ value }">
        <StatusBadge
          :label="`S${value !== undefined ? value : '-'}`"
          :status="getScaleStatus(value)"
          size="sm"
        />
      </template>

      <template #cell(spaceweather_g)="{ value }">
        <StatusBadge
          :label="`G${value !== undefined ? value : '-'}`"
          :status="getScaleStatus(value)"
          size="sm"
        />
      </template>

      <template #cell(spaceweather_note)="{ value }">
        <span class="text-xs text-slate-600 dark:text-slate-300">
          {{ value || 'ไม่มีข้อสังเกตเพิ่มเติม' }}
        </span>
      </template>
    </DataTable>
  </div>
</template>
