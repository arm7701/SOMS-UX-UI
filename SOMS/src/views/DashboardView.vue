<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/DashboardView.vue
 * วัตถุประสงค์: หน้าจอแดชบอร์ดหลัก (Main Dashboard)
 * ขับเคลื่อนด้วย Interactive Draggable & Resizable Stage Layout Engine
 * สามารถจัดวาง, ลากย้าย, ขยายขนาด, ซ่อน/เพิ่มวิดเจ็ต และบันทึกเลย์เอาต์ได้เหมือนระบบต้นฉบับ
 * ============================================================================
 */
import { ref, onMounted, computed, watch } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import {
  Calendar,
  ClipboardList,
  RefreshCw,
  SlidersHorizontal,
  Plus,
  LayoutGrid
} from 'lucide-vue-next'

import ShiftHandoverModal from '@/components/dashboard/ShiftHandoverModal.vue'
import DashboardStage from '@/components/dashboard/DashboardStage.vue'
import { telemetryCharts } from '@/config'

const appStore = useAppStore()
const loading = ref(true)
const error = ref(null)
const showHandoverModal = ref(false)
const stageRef = ref(null)

const dashboardData = ref({
  satellites: [],
  weather: null,
  passes: [],
  operations: [],
  altitudeHistory: []
})

// ดึงข้อมูล Dashboard
const fetchDashboard = async (silent = false) => {
  if (!silent) loading.value = true
  error.value = null
  try {
    const data = await api.get('/dashboard')
    dashboardData.value = data || {}
  } catch (err) {
    error.value = err.message
  } finally {
    if (!silent) loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})

// เฝ้าติดตามการสั่งรีเฟรชจากระบบ Auto-Refresh ส่วนกลาง
watch(() => appStore.refreshTrigger, () => {
  fetchDashboard(true)
})

// วันที่ปัจจุบันแบบทางการ
const todayFormatted = computed(() => {
  const now = new Date()
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'full'
  }).format(now)
})

// เตรียมข้อมูลซีรีส์ 7 วันสำหรับกราฟ Telemetry
const telemetryList = computed(() => {
  const rows = [...(dashboardData.value.altitudeHistory || [])]
  const labels = rows.map(r => r.epoch_date?.slice(5) || '')

  return telemetryCharts.map(cfg => {
    let data
    if (typeof cfg.customData === 'function') {
      data = cfg.customData(rows)
    } else if (cfg.field) {
      data = rows.map(r => (r[cfg.field] !== undefined && r[cfg.field] !== null ? Number(r[cfg.field]) : null))
    } else {
      data = []
    }

    return {
      ...cfg,
      labels,
      data
    }
  })
})

const handleToggleEdit = () => {
  stageRef.value?.toggleEditMode()
}

const handleOpenLibrary = () => {
  stageRef.value?.openLibrary()
}
</script>

<template>
  <div class="space-y-5 font-prompt">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-500/20">
      <div>
        <div class="flex items-center gap-2">
          <Calendar class="w-5 h-5 text-sky-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            {{ todayFormatted }}
          </h1>
        </div>
        <p class="text-sm font-semibold text-cyan-200 mt-1">
          ระบบสารสนเทศและการปฏิบัติการควบคุมดาวเทียม (SOIS Operations Center)
        </p>
      </div>

      <!-- Header Action Controls -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Edit Layout Toggle Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all shadow-xs cursor-pointer"
          :class="stageRef?.isEditing
            ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
            : 'bg-[#061833] border-sky-400/40 text-cyan-200 hover:text-white hover:bg-sky-500/20'"
          title="เปิดโหมดจัดเรียง ลากย้าย และปรับขนาดวิดเจ็ตบนหน้าจอ"
          @click="handleToggleEdit"
        >
          <SlidersHorizontal class="w-4 h-4 text-cyan-300" />
          <span>{{ stageRef?.isEditing ? 'กำลังปรับแต่งเลย์เอาต์' : 'ปรับแต่งเลย์เอาต์' }}</span>
        </button>

        <!-- Widget Library Drawer Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sky-400/40 bg-[#061833] text-sm font-bold text-cyan-200 hover:text-white hover:bg-sky-500/20 shadow-xs transition-all cursor-pointer"
          title="เปิดคลังวิดเจ็ตเพื่อเลือกเพิ่มวิดเจ็ตลงในแดชบอร์ด"
          @click="handleOpenLibrary"
        >
          <LayoutGrid class="w-4 h-4 text-cyan-300" />
          <span>คลังวิดเจ็ต</span>
        </button>

        <!-- Shift Handover Briefing Modal Button -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-bold shadow-md shadow-sky-500/30 transition-all cursor-pointer"
          title="เปิดเอกสารสรุปสถานะดาวเทียม สภาพอวกาศ และรอบพาสประจำวันเพื่อส่งมอบเวร"
          @click="showHandoverModal = true"
        >
          <ClipboardList class="w-4 h-4" />
          <span>สรุปส่งมอบเวร</span>
        </button>

        <!-- Refresh Data Button -->
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sky-400/40 bg-[#061833] text-sm font-bold text-cyan-200 hover:text-white hover:bg-sky-500/20 transition-colors shadow-xs cursor-pointer"
          @click="fetchDashboard(false)"
        >
          <RefreshCw class="w-4 h-4" :class="loading ? 'animate-spin text-cyan-300' : 'text-sky-300'" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm">
      {{ error }}
    </div>

    <!-- Main Draggable & Resizable Grid Layout Stage -->
    <DashboardStage
      ref="stageRef"
      :dashboard-data="dashboardData"
      :telemetry-list="telemetryList"
    />

    <!-- Shift Handover Briefing Modal -->
    <ShiftHandoverModal
      v-model="showHandoverModal"
      :dashboard-data="dashboardData"
    />
  </div>
</template>
