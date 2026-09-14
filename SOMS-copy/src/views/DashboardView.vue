<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/DashboardView.vue
 * วัตถุประสงค์: หน้าจอแดชบอร์ดหลักแบบ Drag & Drop, Resize และปรับค่า Opacity ได้อิสระทุกชิ้น
 * ทุกวิดเจ็ต (รวมถึงกราฟโทรมาตร 8 กราฟ) สามารถเลื่อน ปรับขนาด เพิ่ม หรือลบได้อย่างอิสระเหมือนต้นฉบับ
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import {
  Orbit,
  Activity,
  ShieldCheck,
  RefreshCw,
  Calendar,
  ClipboardList,
  Sliders,
  Plus,
  Lock,
  Unlock,
  X,
  RotateCcw,
  Sparkles,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  EyeOff,
  Move,
  Trash2,
  LineChart,
  Maximize2
} from 'lucide-vue-next'

import StatCard from '@/components/common/StatCard.vue'
import SatelliteSummary from '@/components/dashboard/SatelliteSummary.vue'
import SpaceWeatherWidget from '@/components/dashboard/SpaceWeatherWidget.vue'
import TodayPassesWidget from '@/components/dashboard/TodayPassesWidget.vue'
import DutyOperatorsWidget from '@/components/dashboard/DutyOperatorsWidget.vue'
import TelemetryChart from '@/components/dashboard/TelemetryChart.vue'
import ShiftHandoverModal from '@/components/dashboard/ShiftHandoverModal.vue'

// วิดเจ็ตใหม่ที่ Adapt มาจากระบบต้นฉบับ (10.225.120.221:1161)
import DashboardWidget from '@/components/dashboard/DashboardWidget.vue'
import OrbitTrackerWidget from '@/components/dashboard/OrbitTrackerWidget.vue'
import PassCountdownWidget from '@/components/dashboard/PassCountdownWidget.vue'
import SatelliteAltitudeWidget from '@/components/dashboard/SatelliteAltitudeWidget.vue'
import AttitudeWidget from '@/components/dashboard/AttitudeWidget.vue'
import WidgetLibraryModal from '@/components/dashboard/WidgetLibraryModal.vue'

import { telemetryCharts } from '@/config'

const appStore = useAppStore()
const loading = ref(true)
const error = ref(null)
const showHandoverModal = ref(false)
const showLibraryModal = ref(false)
const isEditing = ref(false)
const snapToGrid = ref(true)

const stageRef = ref(null)
const stageWidth = ref(1280)
const isCompact = ref(false)
const selectedWidgetId = ref('orbit-tracker')

// ฟังก์ชันคำนวณการจัดวางวิดเจ็ตให้เต็มความกว้างสเตจ 100% ไม่เหลือพื้นที่ว่างด้านข้าง
const buildFullWidthLayout = (stageW = 1400) => {
  const W = Math.max(920, stageW)
  const GAP = 16

  // Row 1: Orbit Tracker (60%) + Pass Countdown (40%)
  const orbitW = Math.round((W - GAP) * 0.60)
  const passW = W - orbitW - GAP
  const row1H = 540

  // Row 2: 3 คอลัมน์ (Altitude, Attitude, Space Weather)
  const col3W = Math.floor((W - GAP * 2) / 3)
  const row2Y = row1H + GAP
  const row2H = 260

  // Row 3: 2 คอลัมน์ (Today Passes, Duty Operators)
  const col2W = Math.floor((W - GAP) / 2)
  const row3Y = row2Y + row2H + GAP
  const row3H = 300

  // Row 4: 4 คอลัมน์ Telemetry Charts 1-4 (Altitude, Velocity, Inclination, Period)
  const col4W = Math.floor((W - GAP * 3) / 4)
  const row4Y = row3Y + row3H + GAP
  const row4H = 260

  // Row 5: 4 คอลัมน์ Telemetry Charts 5-8 (TLE Age, Mean Motion, Eccentricity, Anomalies)
  const row5Y = row4Y + row4H + GAP
  const row5H = 260

  return [
    // 1. Orbit Tracker (แผนที่วงโคจรสด)
    {
      id: 'orbit-tracker',
      title: 'Orbit Tracker (แผนที่วงโคจรสด)',
      category: 'general',
      satelliteColor: '#60a5fa',
      x: 0,
      y: 0,
      width: orbitW,
      height: row1H,
      minWidth: 420,
      minHeight: 380,
      z: 1,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 2. Pass Countdown (นับถอยหลังรอบพาส)
    {
      id: 'pass-countdown',
      title: 'Pass Countdown (นับถอยหลังรอบพาส)',
      category: 'satellite',
      satelliteColor: '#38bdf8',
      x: orbitW + GAP,
      y: 0,
      width: passW,
      height: row1H,
      minWidth: 320,
      minHeight: 380,
      z: 2,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 3. Altitude & Orbital Stats (ระดับความสูง TLE)
    {
      id: 'altitude',
      title: 'Altitude & Orbital Stats (ความสูง TLE)',
      category: 'satellite',
      satelliteColor: '#34d399',
      x: 0,
      y: row2Y,
      width: col3W,
      height: row2H,
      minWidth: 280,
      minHeight: 200,
      z: 3,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 4. Spacecraft Attitude (การทรงตัว)
    {
      id: 'attitude',
      title: 'Spacecraft Attitude (การทรงตัว)',
      category: 'satellite',
      satelliteColor: '#fbbf24',
      x: col3W + GAP,
      y: row2Y,
      width: col3W,
      height: row2H,
      minWidth: 280,
      minHeight: 200,
      z: 4,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 5. Space Weather (สภาพอวกาศ NOAA)
    {
      id: 'weather',
      title: 'Space Weather (สภาพอวกาศ NOAA)',
      category: 'general',
      satelliteColor: '#f97316',
      x: (col3W + GAP) * 2,
      y: row2Y,
      width: W - (col3W + GAP) * 2,
      height: row2H,
      minWidth: 280,
      minHeight: 200,
      z: 5,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 6. Today Passes (รอบพาสวันนี้)
    {
      id: 'passes',
      title: 'Today Passes (รอบพาสวันนี้)',
      category: 'general',
      satelliteColor: '#38bdf8',
      x: 0,
      y: row3Y,
      width: col2W,
      height: row3H,
      minWidth: 320,
      minHeight: 240,
      z: 6,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 7. Duty Operators (เวรปฏิบัติการ)
    {
      id: 'operators',
      title: 'Duty Operators (เวรปฏิบัติการ)',
      category: 'general',
      satelliteColor: '#a78bfa',
      x: col2W + GAP,
      y: row3Y,
      width: W - col2W - GAP,
      height: row3H,
      minWidth: 320,
      minHeight: 240,
      z: 7,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 8. Telemetry Chart: Altitude
    {
      id: 'chart-altitude',
      chartKey: 'altitude',
      title: 'Orbital Altitude (ความสูงวงโคจร)',
      category: 'telemetry',
      satelliteColor: '#38bdf8',
      x: 0,
      y: row4Y,
      width: col4W,
      height: row4H,
      minWidth: 220,
      minHeight: 180,
      z: 8,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 9. Telemetry Chart: Velocity
    {
      id: 'chart-velocity',
      chartKey: 'velocity',
      title: 'Orbital Velocity (ความเร็วการโคจร)',
      category: 'telemetry',
      satelliteColor: '#f43f5e',
      x: col4W + GAP,
      y: row4Y,
      width: col4W,
      height: row4H,
      minWidth: 220,
      minHeight: 180,
      z: 9,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 10. Telemetry Chart: Inclination
    {
      id: 'chart-inclination',
      chartKey: 'inclination',
      title: 'Orbital Inclination (มุมเอียง)',
      category: 'telemetry',
      satelliteColor: '#eab308',
      x: (col4W + GAP) * 2,
      y: row4Y,
      width: col4W,
      height: row4H,
      minWidth: 220,
      minHeight: 180,
      z: 10,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 11. Telemetry Chart: Orbital Period
    {
      id: 'chart-period',
      chartKey: 'period',
      title: 'Orbital Period (คาบการโคจร)',
      category: 'telemetry',
      satelliteColor: '#3b82f6',
      x: (col4W + GAP) * 3,
      y: row4Y,
      width: W - (col4W + GAP) * 3,
      height: row4H,
      minWidth: 220,
      minHeight: 180,
      z: 11,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 12. Telemetry Chart: TLE Age
    {
      id: 'chart-tleAge',
      chartKey: 'tleAge',
      title: 'TLE Age (อายุข้อมูล TLE)',
      category: 'telemetry',
      satelliteColor: '#10b981',
      x: 0,
      y: row5Y,
      width: col4W,
      height: row5H,
      minWidth: 220,
      minHeight: 180,
      z: 12,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 13. Telemetry Chart: Mean Motion
    {
      id: 'chart-meanMotion',
      chartKey: 'meanMotion',
      title: 'Mean Motion (จำนวนรอบต่อวัน)',
      category: 'telemetry',
      satelliteColor: '#a78bfa',
      x: col4W + GAP,
      y: row5Y,
      width: col4W,
      height: row5H,
      minWidth: 220,
      minHeight: 180,
      z: 13,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 14. Telemetry Chart: Eccentricity
    {
      id: 'chart-eccentricity',
      chartKey: 'eccentricity',
      title: 'Eccentricity (ความรีของวงโคจร)',
      category: 'telemetry',
      satelliteColor: '#f1f5f9',
      x: (col4W + GAP) * 2,
      y: row5Y,
      width: col4W,
      height: row5H,
      minWidth: 220,
      minHeight: 180,
      z: 14,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 15. Telemetry Chart: Mission Anomalies
    {
      id: 'chart-anomalies',
      chartKey: 'anomalies',
      title: 'Mission Anomalies (ข้อขัดข้อง)',
      category: 'telemetry',
      satelliteColor: '#fb7185',
      x: (col4W + GAP) * 3,
      y: row5Y,
      width: W - (col4W + GAP) * 3,
      height: row5H,
      minWidth: 220,
      minHeight: 180,
      z: 15,
      backgroundOpacity: 94,
      contentOpacity: 100,
      borderOpacity: 100,
      locked: false,
      hidden: false
    }
  ]
}

const DEFAULT_WIDGET_LAYOUT = buildFullWidthLayout(1400)

// โหลดการจัดวางที่บันทึกไว้ใน LocalStorage (เวอร์ชัน v6 รองรับเต็มหน้าจออัตโนมัติ)
const savedLayout = ref((() => {
  try {
    const raw = localStorage.getItem('soms_dashboard_layout_v6')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.some(w => w.id === 'chart-altitude')) {
        return parsed
      }
    }
  } catch (e) {}
  const initialWidth = typeof window !== 'undefined' ? Math.max(920, window.innerWidth - 80) : 1400
  return buildFullWidthLayout(initialWidth)
})())

// Draft layout ขณะอยู่ในโหมดแก้ไข (Edit mode)
const draftLayout = ref(JSON.parse(JSON.stringify(savedLayout.value)))

// รายการวิดเจ็ตที่กำลังแสดงผล (สลับระหว่าง draft และ saved)
const activeWidgetList = computed(() => {
  const current = isEditing.value ? draftLayout.value : savedLayout.value
  return current.filter(w => !w.hidden)
})

// วิดเจ็ตที่ถูกเลือกอยู่ในขณะนี้
const currentSelectedWidget = computed(() => {
  const current = isEditing.value ? draftLayout.value : savedLayout.value
  return current.find(w => w.id === selectedWidgetId.value) || current[0] || null
})

// คำนวณความสูงรวมของสเตจบนเดสก์ท็อป
const stageHeightPx = computed(() => {
  if (isCompact.value) return 'auto'
  const visible = activeWidgetList.value
  if (!visible.length) return '600px'
  const maxBottom = Math.max(600, ...visible.map(w => (w.y || 0) + (w.height || 250)))
  return `${maxBottom + 60}px`
})

// อัปเดตขนาดของสเตจเมื่อหน้าจอเปลี่ยน
const updateStageDimensions = () => {
  if (typeof window === 'undefined') return
  if (stageRef.value) {
    const rect = stageRef.value.getBoundingClientRect()
    stageWidth.value = Math.max(320, Math.floor(rect.width))
  } else {
    stageWidth.value = Math.max(320, window.innerWidth - 64)
  }
  isCompact.value = window.innerWidth < 768 || stageWidth.value < 640
}

let stageResizeObs = null

// ปรับขยายและจัดวางวิดเจ็ตให้เต็มความกว้างหน้าจออัตโนมัติ (Fit Full Width)
const fitLayoutToFullWidth = (silent = false) => {
  const currentW = stageWidth.value || (typeof window !== 'undefined' ? window.innerWidth - 64 : 1400)
  const newLayout = buildFullWidthLayout(currentW)
  
  if (isEditing.value) {
    draftLayout.value = newLayout
  } else {
    savedLayout.value = newLayout
    try {
      localStorage.setItem('soms_dashboard_layout_v6', JSON.stringify(newLayout))
    } catch (e) {}
  }
  if (!silent) {
    appStore.showToast('จัดเรียงเต็มจอ', 'ปรับขนาดและจัดวางวิดเจ็ตทุกส่วนเต็มความกว้างหน้าจอเรียบร้อยแล้ว')
  }
}

onMounted(() => {
  updateStageDimensions()
  if (stageRef.value) {
    stageResizeObs = new ResizeObserver(updateStageDimensions)
    stageResizeObs.observe(stageRef.value)
  }
  window.addEventListener('resize', updateStageDimensions)

  // หากเปิดครั้งแรกในเวอร์ชัน v6 ให้ขยายจัดเต็มความกว้างหน้าจออัตโนมัติ
  if (!localStorage.getItem('soms_dashboard_layout_v6')) {
    nextTick(() => {
      fitLayoutToFullWidth(true)
    })
  }

  fetchDashboard()
})

onUnmounted(() => {
  if (stageResizeObs) stageResizeObs.disconnect()
  window.removeEventListener('resize', updateStageDimensions)
})

// เข้าสู่โหมดแก้ไข (Edit Mode)
const enterEditMode = () => {
  draftLayout.value = JSON.parse(JSON.stringify(savedLayout.value))
  isEditing.value = true
  if (activeWidgetList.value.length > 0) {
    selectedWidgetId.value = activeWidgetList.value[0].id
  }
}

// บันทึกการแก้ไขลง LocalStorage
const saveDashboardLayout = () => {
  savedLayout.value = JSON.parse(JSON.stringify(draftLayout.value))
  try {
    localStorage.setItem('soms_dashboard_layout_v6', JSON.stringify(savedLayout.value))
  } catch (e) {}
  isEditing.value = false
  appStore.showToast('บันทึกสำเร็จ', 'บันทึกการจัดวางและตำแหน่งวิดเจ็ตลงในระบบแล้ว')
}

// ยกเลิกการแก้ไข
const cancelEditMode = () => {
  draftLayout.value = JSON.parse(JSON.stringify(savedLayout.value))
  isEditing.value = false
}

// รีเซ็ตการจัดวางเป็นค่าเริ่มต้นเต็มจอ
const resetToDefault = () => {
  const currentW = stageWidth.value || 1400
  const def = buildFullWidthLayout(currentW)
  draftLayout.value = JSON.parse(JSON.stringify(def))
  savedLayout.value = JSON.parse(JSON.stringify(def))
  try {
    localStorage.setItem('soms_dashboard_layout_v6', JSON.stringify(def))
  } catch (e) {}
  appStore.showToast('คืนค่าสำเร็จ', 'รีเซ็ตการจัดวางแดชบอร์ดเต็มหน้าจอเรียบร้อยแล้ว')
}

// อัปเดตวิดเจ็ตเมื่อมีการลากหรือปรับขนาด
const onWidgetChange = (updated) => {
  const list = isEditing.value ? draftLayout.value : savedLayout.value
  const idx = list.findIndex(w => w.id === updated.id)
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updated }
  }
}

// เลือกล็อก / ปลดล็อกวิดเจ็ต
const toggleLockSelectedWidget = () => {
  if (!currentSelectedWidget.value) return
  currentSelectedWidget.value.locked = !currentSelectedWidget.value.locked
}

// นำขึ้นหน้าสุด (Bring to front)
const bringToFront = () => {
  if (!currentSelectedWidget.value) return
  const list = draftLayout.value
  const maxZ = Math.max(0, ...list.map(w => w.z || 1))
  currentSelectedWidget.value.z = maxZ + 1
}

// ส่งไปหลังสุด (Send to back)
const sendToBack = () => {
  if (!currentSelectedWidget.value) return
  const list = draftLayout.value
  const minZ = Math.min(...list.map(w => w.z || 1))
  currentSelectedWidget.value.z = Math.max(1, minZ - 1)
}

// รีเซ็ตค่า Opacity รูปลักษณ์ของการ์ดที่เลือก
const resetAppearance = () => {
  if (!currentSelectedWidget.value) return
  currentSelectedWidget.value.backgroundOpacity = 94
  currentSelectedWidget.value.contentOpacity = 100
  currentSelectedWidget.value.borderOpacity = 100
  currentSelectedWidget.value.locked = false
}

// ลบ/ซ่อนวิดเจ็ต
const removeSelectedWidget = () => {
  if (!currentSelectedWidget.value) return
  currentSelectedWidget.value.hidden = true
  const visible = activeWidgetList.value.filter(w => !w.hidden)
  selectedWidgetId.value = visible[0]?.id || ''
  appStore.showToast('ซ่อนวิดเจ็ต', 'นำวิดเจ็ตออกจากหน้าจอเรียบร้อยแล้ว')
}

// สลับเปิด/ปิดวิดเจ็ตจากคลัง (Library)
const toggleWidgetFromLibrary = (widgetId) => {
  const list = isEditing.value ? draftLayout.value : savedLayout.value
  const item = list.find(w => w.id === widgetId)
  if (item) {
    item.hidden = !item.hidden
  } else {
    const def = DEFAULT_WIDGET_LAYOUT.find(w => w.id === widgetId)
    if (def) {
      list.push({ ...def, hidden: false, x: 0, y: 0 })
    }
  }
  if (!isEditing.value) {
    try {
      localStorage.setItem('soms_dashboard_layout_v6', JSON.stringify(savedLayout.value))
    } catch (e) {}
  }
}

// ดึงข้อมูล Dashboard
const dashboardData = ref({
  satellites: [],
  weather: null,
  passes: [],
  operations: [],
  altitudeHistory: []
})

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

// ข้อมูลสำหรับกราฟ Telemetry
const chartLabels = computed(() => {
  const rows = dashboardData.value.altitudeHistory || []
  return rows.map(r => r.epoch_date?.slice(5) || '')
})

const getChartConfig = (widgetId) => {
  const chartKey = widgetId.replace('chart-', '')
  return telemetryCharts.find(c => c.key === chartKey) || null
}

const getChartData = (widgetId) => {
  const cfg = getChartConfig(widgetId)
  if (!cfg) return []
  const rows = dashboardData.value.altitudeHistory || []
  if (typeof cfg.customData === 'function') {
    return cfg.customData(rows)
  } else if (cfg.field) {
    return rows.map(r => (r[cfg.field] !== undefined && r[cfg.field] !== null ? Number(r[cfg.field]) : null))
  }
  return []
}
</script>

<template>
  <div class="dashboard-workspace space-y-5" :class="{ 'is-editing': isEditing }">
    <!-- Top Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-700">
      <div>
        <div class="flex items-center gap-2.5">
          <Calendar class="w-6 h-6 text-cyan-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white tracking-wide">
            {{ todayFormatted }}
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 font-semibold font-prompt">
          ระบบสารสนเทศและการปฏิบัติการควบคุมดาวเทียม (SOIS Operations Center)
        </p>
      </div>

      <!-- Action Controls -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Add Widget Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 text-slate-100 hover:text-white border border-space-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer font-prompt"
          @click="showLibraryModal = true"
        >
          <Plus class="w-4 h-4 text-cyan-400" />
          <span>+ เพิ่มวิดเจ็ต</span>
        </button>

        <!-- Fit Full Width Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 text-slate-100 hover:text-white border border-space-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer font-prompt"
          title="ปรับขนาดและจัดวางวิดเจ็ตเต็มความกว้างหน้าจออัตโนมัติ"
          @click="fitLayoutToFullWidth(false)"
        >
          <Maximize2 class="w-4 h-4 text-emerald-400" />
          <span>จัดเต็มจอ (Fit Width)</span>
        </button>

        <!-- Edit Layout Toggle Button -->
        <button
          v-if="!isEditing"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer font-prompt"
          title="จัดวาง ขยับเลื่อน และปรับขนาดวิดเจ็ตได้อย่างอิสระเหมือนต้นฉบับ"
          @click="enterEditMode"
        >
          <Sliders class="w-4 h-4 text-amber-300" />
          <span>ปรับแต่งแดชบอร์ด (Edit layout)</span>
        </button>

        <!-- Handover Modal Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 text-slate-100 hover:text-white border border-space-600 text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer font-prompt"
          @click="showHandoverModal = true"
        >
          <ClipboardList class="w-4 h-4 text-cyan-400" />
          <span>สรุปส่งมอบเวร</span>
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-space-600 bg-space-850 hover:bg-space-800 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer font-prompt disabled:opacity-50"
          @click="fetchDashboard"
        >
          <RefreshCw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
          <span>รีเฟรช</span>
        </button>
      </div>
    </div>

    <!-- STICKY LAYOUT INSPECTOR TOOLBAR (เหมือนต้นฉบับ เมื่อเปิด Edit Mode) -->
    <div
      v-if="isEditing"
      class="dashboard-layout-toolbar sticky top-4 z-50 p-4 rounded-2xl bg-[#0f1522] border border-cyan-700/80 shadow-2xl text-xs sm:text-sm font-prompt space-y-3.5"
    >
      <!-- Toolbar Main Row: Title & Save/Cancel Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-700">
        <div>
          <div class="flex items-center gap-2">
            <Sliders class="w-4 h-4 text-cyan-400" />
            <strong class="text-base font-bold text-white tracking-wide">
              จัดวางและปรับแต่งแดชบอร์ด (Arrange Dashboard)
            </strong>
          </div>
          <p class="text-slate-300 text-xs sm:text-sm font-medium mt-0.5">
            คลิกลากที่หัววิดเจ็ตเพื่อย้ายตำแหน่ง · ลากที่ขอบขวา/ขอบล่าง/มุมเพื่อปรับขนาด · ลบหรือเพิ่มกราฟและวิดเจ็ตได้อิสระ
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            @click="saveDashboardLayout"
          >
            <Check class="w-4 h-4" />
            <span>บันทึกแดชบอร์ด (Save)</span>
          </button>

          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white border border-zinc-600 font-semibold transition-colors cursor-pointer"
            @click="cancelEditMode"
          >
            ยกเลิก
          </button>
        </div>
      </div>

      <!-- Toolbar Widget Controls: Select, Lock, Z-Index, Opacity Sliders -->
      <div class="flex flex-wrap items-center gap-3 pt-1">
        <!-- Widget Picker Dropdown -->
        <div class="flex items-center gap-1.5">
          <span class="text-slate-200 text-xs font-bold whitespace-nowrap">วิดเจ็ต:</span>
          <select
            v-model="selectedWidgetId"
            class="px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-space-700 bg-[#090b0f] text-white font-semibold font-prompt focus:outline-none focus:border-cyan-500 min-w-[200px]"
          >
            <option
              v-for="w in activeWidgetList"
              :key="w.id"
              :value="w.id"
            >
              {{ w.title }}
            </option>
          </select>
        </div>

        <!-- Lock / Unlock Position Toggle Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
          :class="currentSelectedWidget?.locked ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-xs' : 'bg-zinc-800 border-zinc-700 text-slate-100 hover:text-white'"
          @click="toggleLockSelectedWidget"
        >
          <Lock v-if="currentSelectedWidget?.locked" class="w-3.5 h-3.5 text-amber-400" />
          <Unlock v-else class="w-3.5 h-3.5" />
          <span>{{ currentSelectedWidget?.locked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่ง' }}</span>
        </button>

        <!-- Bring to Front / Send to Back -->
        <div class="inline-flex rounded-xl bg-[#090b0f] p-0.5 border border-space-700">
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-bold text-slate-100 hover:text-white transition-colors cursor-pointer"
            title="นำการ์ดขึ้นมาอยู่หน้าสุด"
            @click="bringToFront"
          >
            หน้าสุด (Front)
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-bold text-slate-100 hover:text-white transition-colors cursor-pointer"
            title="ส่งการ์ดไปอยู่หลังสุด"
            @click="sendToBack"
          >
            หลังสุด (Back)
          </button>
        </div>

        <!-- Opacity Sliders (Background, Content, Border) เหมือนต้นฉบับ -->
        <div v-if="currentSelectedWidget" class="flex items-center gap-4 bg-[#090b0f] px-3 py-1.5 rounded-xl border border-space-700">
          <!-- Background Opacity -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-200 font-bold whitespace-nowrap">
              พื้นหลัง: {{ currentSelectedWidget.backgroundOpacity ?? 94 }}%
            </span>
            <input
              v-model.number="currentSelectedWidget.backgroundOpacity"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>

          <!-- Content Opacity -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-200 font-bold whitespace-nowrap">
              เนื้อหา: {{ currentSelectedWidget.contentOpacity ?? 100 }}%
            </span>
            <input
              v-model.number="currentSelectedWidget.contentOpacity"
              type="range"
              min="10"
              max="100"
              step="1"
              class="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>

          <!-- Border Opacity -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-200 font-bold whitespace-nowrap">
              ขอบ: {{ currentSelectedWidget.borderOpacity ?? 100 }}%
            </span>
            <input
              v-model.number="currentSelectedWidget.borderOpacity"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        <!-- Snap to Grid Checkbox -->
        <label class="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white">
          <input
            v-model="snapToGrid"
            type="checkbox"
            class="rounded border-zinc-700 bg-zinc-800 text-cyan-400 w-3.5 h-3.5"
          />
          <span class="text-xs font-semibold">Snap to grid (8px)</span>
        </label>

        <!-- Reset Appearance Button -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 hover:text-white border border-zinc-700 transition-colors cursor-pointer text-xs font-semibold"
          @click="resetAppearance"
        >
          รีเซ็ตรูปลักษณ์
        </button>

        <!-- Remove Selected Widget -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          @click="removeSelectedWidget"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>ซ่อนวิดเจ็ต</span>
        </button>

        <!-- Fit Full Width in Toolbar -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          title="จัดเรียงและขยายทุกวิดเจ็ตให้เต็มขอบซ้ายขวาพอดี"
          @click="fitLayoutToFullWidth(false)"
        >
          <Maximize2 class="w-3.5 h-3.5" />
          <span>จัดเต็มจอ (Fit Width)</span>
        </button>

        <!-- Reset Layout to Default -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold ml-auto"
          @click="resetToDefault"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>คืนค่าเริ่มต้น</span>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-sm font-prompt">
      {{ error }}
    </div>

    <!-- Top KPI Stats (Fixed Overview Bar - เติมเต็มพื้นที่ด้วยข้อมูลทางยุทธการ) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="ดาวเทียมในวงโคจร"
        value="2"
        unit="ดวง"
        subtitle="NAPA-1 N / NAPA-2 N"
        :icon="Orbit"
        color="slate"
        badge="ONLINE"
        badge-type="success"
        :items="['NAPA-1 N (495.2 km)', 'NAPA-2 N (508.8 km)', 'สถานะ: ปกติ 100%']"
      />
      <StatCard
        title="พาสดาวเทียมวันนี้"
        :value="dashboardData.passes.length"
        unit="รอบ"
        subtitle="Day & Night Passes"
        :icon="Activity"
        color="slate"
        badge="SCHEDULED"
        badge-type="info"
        :items="['พาสถัดไป: NAPA-2 N (82.5° El)', 'AOS: 06:10 UTC', 'BMA Ground Station']"
      />
      <StatCard
        title="สภาพอวกาศล่าสุด"
        :value="dashboardData.weather ? `R${dashboardData.weather.spaceweather_r || 0}` : '—'"
        subtitle="NOAA Scale (Radio)"
        :icon="ShieldCheck"
        color="amber"
        badge="MONITORING"
        badge-type="warning"
        :items="['Radio: R1 (Minor)', 'Geomagnetic: G0', 'Solar Radiation: S0', 'Kp: 2.3']"
      />
      <StatCard
        title="เวรปฏิบัติการ"
        value="ACTIVE"
        subtitle="MD / FMO / GSO ประจำสถานี"
        :icon="ShieldCheck"
        color="emerald"
        badge="ON DUTY"
        badge-type="success"
        :items="['ชุดปฏิบัติการที่ 1 (Day Shift)', 'MD: น.ต. สมชาย', 'FMO: ร.อ. ธีระศักดิ์', 'GSO: ร.ท. อนันต์']"
      />
    </div>

    <!-- SATELLITE SUMMARY BAR -->
    <SatelliteSummary :satellites="dashboardData.satellites" />

    <!-- INTERACTIVE DASHBOARD STAGE (รองรับลาก ขยับเลื่อน ปรับขนาด และปรับค่าต่างๆ ได้อิสระทุกชิ้น) -->
    <div
      ref="stageRef"
      class="dashboard-stage relative transition-all"
      :class="{
        'is-editing': isEditing,
        'min-h-[800px]': !isCompact
      }"
      :style="{
        height: stageHeightPx
      }"
    >
      <!-- All Active Draggable & Resizable Widgets -->
      <DashboardWidget
        v-for="widget in activeWidgetList"
        :key="widget.id"
        :item="widget"
        :title="widget.title"
        :satellite-color="widget.satelliteColor"
        :editing="isEditing"
        :selected="selectedWidgetId === widget.id"
        :compact="isCompact"
        :stage-width="stageWidth"
        :snap="snapToGrid"
        @change="onWidgetChange"
        @select="selectedWidgetId = widget.id"
      >
        <!-- 1. ORBIT TRACKER -->
        <OrbitTrackerWidget
          v-if="widget.id === 'orbit-tracker'"
          :satellites="dashboardData.satellites"
          :passes="dashboardData.passes"
        />

        <!-- 2. PASS COUNTDOWN -->
        <PassCountdownWidget
          v-else-if="widget.id === 'pass-countdown'"
          :passes="dashboardData.passes"
          :editing="isEditing"
        />

        <!-- 3. ALTITUDE & ORBITAL STATS -->
        <SatelliteAltitudeWidget
          v-else-if="widget.id === 'altitude'"
          :satellites="dashboardData.satellites"
        />

        <!-- 4. SPACECRAFT ATTITUDE -->
        <AttitudeWidget
          v-else-if="widget.id === 'attitude'"
        />

        <!-- 5. SPACE WEATHER -->
        <SpaceWeatherWidget
          v-else-if="widget.id === 'weather'"
          :weather="dashboardData.weather"
          class="h-full"
        />

        <!-- 6. TODAY'S PASSES -->
        <TodayPassesWidget
          v-else-if="widget.id === 'passes'"
          :passes="dashboardData.passes"
          class="h-full"
        />

        <!-- 7. MISSION OPERATORS -->
        <DutyOperatorsWidget
          v-else-if="widget.id === 'operators'"
          :operations="dashboardData.operations"
          class="h-full"
        />

        <!-- 8. INDIVIDUAL TELEMETRY CHARTS (แต่ละกราฟเป็นอิสระต่อกัน) -->
        <TelemetryChart
          v-else-if="widget.id.startsWith('chart-')"
          :title="getChartConfig(widget.id)?.title || widget.title"
          :labels="chartLabels"
          :data="getChartData(widget.id)"
          :unit="getChartConfig(widget.id)?.unit || ''"
          :color="getChartConfig(widget.id)?.color || '#38bdf8'"
          :fill-color="getChartConfig(widget.id)?.fillColor || 'rgba(56, 189, 248, 0.08)'"
          :type="getChartConfig(widget.id)?.type || 'line'"
        />
      </DashboardWidget>
    </div>

    <!-- Shift Handover Briefing Modal -->
    <ShiftHandoverModal
      v-model="showHandoverModal"
      :dashboard-data="dashboardData"
    />

    <!-- Widget Library Modal -->
    <WidgetLibraryModal
      v-model="showLibraryModal"
      :active-widget-ids="activeWidgetList.map(w => w.id)"
      @toggle-widget="toggleWidgetFromLibrary"
      @reset-layout="resetToDefault"
    />
  </div>
</template>

<style scoped>
.dashboard-stage {
  isolation: isolate;
  width: 100%;
  position: relative;
}

.is-editing .dashboard-stage {
  background-image: radial-gradient(#687b9640 1.2px, transparent 1.2px);
  background-size: 16px 16px;
  border-radius: 16px;
  border: 1px dashed rgba(56, 189, 248, 0.35);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5);
}
</style>
