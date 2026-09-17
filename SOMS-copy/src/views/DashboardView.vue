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
  Maximize2,
  Copy,
  Monitor
} from 'lucide-vue-next'

import StatCard from '@/components/common/StatCard.vue'
import SatelliteSummary from '@/components/dashboard/SatelliteSummary.vue'
import KpiOverviewWidget from '@/components/dashboard/KpiOverviewWidget.vue'
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

// ฟังก์ชันคำนวณการจัดวางวิดเจ็ตอัจฉริยะ (Multi-Tier Smart Layout Engine)
// รองรับตั้งแต่จอแท็บเล็ต/เดสก์ท็อป ไปจนถึง Ultrawide, 4K, และ Video Wall ขนาดใหญ่ (10+ จอต่อกันในห้องศูนย์ปฏิบัติการ)
const buildSmartLayout = (stageW = 1400) => {
  const W = Math.max(920, stageW)
  const GAP = 16

  if (W >= 4200) {
    // =========================================================================
    // TIER 1: OPERATOR VIDEO WALL (สำหรับต่อจอ 10+ จอ เช่น 7680x2160, 11520x2160)
    // จัดเรียงแบบ 3 แถวพาโนรามากว้างขวางเต็มผนัง ไม่ต้องเลื่อนสกอร์บาร์
    // =========================================================================
    // Row 0: KPI Overview (42%) + Satellite Summaries (58%)
    const r0_kpiW = Math.round((W - GAP) * 0.42)
    const r0_sumW = W - r0_kpiW - GAP
    const r0_y = 0
    const r0_h = 240

    // Row 1: Orbit Tracker (36%) + Pass Countdown (22%) + Altitude (14%) + Attitude (14%) + Weather (14%)
    const r1_y = r0_y + r0_h + GAP
    const r1_h = 560
    const r1_orbitW = Math.round((W - GAP * 4) * 0.36)
    const r1_passW = Math.round((W - GAP * 4) * 0.22)
    const r1_subW = Math.floor((W - GAP * 4 - r1_orbitW - r1_passW) / 3)
    const r1_weatherW = W - r1_orbitW - r1_passW - r1_subW * 2 - GAP * 4

    // Row 2: Today Passes (16%) + Duty Operators (16%) + 8 Telemetry Charts (68% / 2 rows of 4)
    const r2_y = r1_y + r1_h + GAP
    const r2_h = 420
    const r2_passW = Math.round((W - GAP * 5) * 0.16)
    const r2_opsW = Math.round((W - GAP * 5) * 0.16)
    const chartsTotalW = W - r2_passW - r2_opsW - GAP * 2
    const chartColW = Math.floor((chartsTotalW - GAP * 3) / 4)
    const chartSubH = Math.floor((r2_h - GAP) / 2)

    return [
      { id: 'kpi-overview', baseType: 'kpi-overview', title: 'KPI Operations Overview (ภาพรวมภารกิจยุทธการ)', category: 'general', satelliteColor: '#10b981', x: 0, y: r0_y, width: r0_kpiW, height: r0_h, minWidth: 420, minHeight: 130, z: 1, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'satellite-summary', baseType: 'satellite-summary', title: 'Satellite Telemetry Summaries (ข้อมูลด่วนดาวเทียม)', category: 'satellite', satelliteId: 'all', satelliteColor: '#38bdf8', x: r0_kpiW + GAP, y: r0_y, width: r0_sumW, height: r0_h, minWidth: 360, minHeight: 180, z: 2, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'orbit-tracker', baseType: 'orbit-tracker', title: 'Orbit Tracker (แผนที่วงโคจรสด)', category: 'general', satelliteColor: '#60a5fa', x: 0, y: r1_y, width: r1_orbitW, height: r1_h, minWidth: 420, minHeight: 380, z: 3, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'pass-countdown', baseType: 'pass-countdown', title: 'Pass Countdown (นับถอยหลังรอบพาส)', category: 'satellite', satelliteColor: '#38bdf8', x: r1_orbitW + GAP, y: r1_y, width: r1_passW, height: r1_h, minWidth: 320, minHeight: 380, z: 4, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'altitude', baseType: 'altitude', title: 'Altitude & Orbital Stats (ความสูง TLE)', category: 'satellite', satelliteColor: '#34d399', x: r1_orbitW + r1_passW + GAP * 2, y: r1_y, width: r1_subW, height: r1_h, minWidth: 280, minHeight: 200, z: 5, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'attitude', baseType: 'attitude', title: 'Spacecraft Attitude (การทรงตัว)', category: 'satellite', satelliteColor: '#fbbf24', x: r1_orbitW + r1_passW + r1_subW + GAP * 3, y: r1_y, width: r1_subW, height: r1_h, minWidth: 280, minHeight: 200, z: 6, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'weather', baseType: 'weather', title: 'Space Weather (สภาพอวกาศ NOAA)', category: 'general', satelliteColor: '#f97316', x: r1_orbitW + r1_passW + r1_subW * 2 + GAP * 4, y: r1_y, width: r1_weatherW, height: r1_h, minWidth: 280, minHeight: 200, z: 7, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'passes', baseType: 'passes', title: 'Today Passes (รอบพาสวันนี้)', category: 'general', satelliteColor: '#38bdf8', x: 0, y: r2_y, width: r2_passW, height: r2_h, minWidth: 320, minHeight: 240, z: 8, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'operators', baseType: 'operators', title: 'Duty Operators (เวรปฏิบัติการ)', category: 'general', satelliteColor: '#a78bfa', x: r2_passW + GAP, y: r2_y, width: r2_opsW, height: r2_h, minWidth: 320, minHeight: 240, z: 9, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'chart-altitude', baseType: 'chart-altitude', chartKey: 'altitude', title: 'Orbital Altitude (ความสูงวงโคจร)', category: 'telemetry', satelliteColor: '#38bdf8', x: r2_passW + r2_opsW + GAP * 2, y: r2_y, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 10, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-velocity', baseType: 'chart-velocity', chartKey: 'velocity', title: 'Velocity (ความเร็ว)', category: 'telemetry', satelliteColor: '#06b6d4', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP), y: r2_y, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 11, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-inclination', baseType: 'chart-inclination', chartKey: 'inclination', title: 'Inclination (มุมเอียงวงโคจร)', category: 'telemetry', satelliteColor: '#34d399', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 2, y: r2_y, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 12, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-period', baseType: 'chart-period', chartKey: 'period', title: 'Orbital Period (คาบการโคจร)', category: 'telemetry', satelliteColor: '#3b82f6', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 3, y: r2_y, width: W - (r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 3), height: chartSubH, minWidth: 200, minHeight: 160, z: 13, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'chart-tleAge', baseType: 'chart-tleAge', chartKey: 'tleAge', title: 'TLE Age (อายุข้อมูล TLE)', category: 'telemetry', satelliteColor: '#10b981', x: r2_passW + r2_opsW + GAP * 2, y: r2_y + chartSubH + GAP, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 14, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-meanMotion', baseType: 'chart-meanMotion', chartKey: 'meanMotion', title: 'Mean Motion (จำนวนรอบต่อวัน)', category: 'telemetry', satelliteColor: '#a78bfa', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP), y: r2_y + chartSubH + GAP, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 15, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-eccentricity', baseType: 'chart-eccentricity', chartKey: 'eccentricity', title: 'Eccentricity (ความรีของวงโคจร)', category: 'telemetry', satelliteColor: '#f1f5f9', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 2, y: r2_y + chartSubH + GAP, width: chartColW, height: chartSubH, minWidth: 200, minHeight: 160, z: 16, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-anomalies', baseType: 'chart-anomalies', chartKey: 'anomalies', title: 'Mission Anomalies (ข้อขัดข้อง)', category: 'telemetry', satelliteColor: '#fb7185', x: r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 3, y: r2_y + chartSubH + GAP, width: W - (r2_passW + r2_opsW + GAP * 2 + (chartColW + GAP) * 3), height: chartSubH, minWidth: 200, minHeight: 160, z: 17, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false }
    ]
  }

  if (W >= 2400) {
    // =========================================================================
    // TIER 2: ULTRAWIDE / 4K / DUAL MONITOR (2400px - 4200px)
    // =========================================================================
    const halfW = Math.floor((W - GAP) / 2)
    const r0_y = 0
    const r0_h = 240

    const r1_y = r0_y + r0_h + GAP
    const r1_h = 520
    const r1_orbitW = Math.round((W - GAP * 2) * 0.48)
    const r1_passW = Math.round((W - GAP * 2) * 0.28)
    const r1_weatherW = W - r1_orbitW - r1_passW - GAP * 2

    const r2_y = r1_y + r1_h + GAP
    const r2_h = 280
    const col4W = Math.floor((W - GAP * 3) / 4)

    const r3_y = r2_y + r2_h + GAP
    const r3_h = 250

    const r4_y = r3_y + r3_h + GAP
    const r4_h = 250

    return [
      { id: 'kpi-overview', baseType: 'kpi-overview', title: 'KPI Operations Overview (ภาพรวมภารกิจยุทธการ)', category: 'general', satelliteColor: '#10b981', x: 0, y: r0_y, width: halfW, height: r0_h, minWidth: 420, minHeight: 130, z: 1, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'satellite-summary', baseType: 'satellite-summary', title: 'Satellite Telemetry Summaries (ข้อมูลด่วนดาวเทียม)', category: 'satellite', satelliteId: 'all', satelliteColor: '#38bdf8', x: halfW + GAP, y: r0_y, width: W - halfW - GAP, height: r0_h, minWidth: 360, minHeight: 180, z: 2, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'orbit-tracker', baseType: 'orbit-tracker', title: 'Orbit Tracker (แผนที่วงโคจรสด)', category: 'general', satelliteColor: '#60a5fa', x: 0, y: r1_y, width: r1_orbitW, height: r1_h, minWidth: 420, minHeight: 380, z: 3, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'pass-countdown', baseType: 'pass-countdown', title: 'Pass Countdown (นับถอยหลังรอบพาส)', category: 'satellite', satelliteColor: '#38bdf8', x: r1_orbitW + GAP, y: r1_y, width: r1_passW, height: r1_h, minWidth: 320, minHeight: 380, z: 4, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'weather', baseType: 'weather', title: 'Space Weather (สภาพอวกาศ NOAA)', category: 'general', satelliteColor: '#f97316', x: r1_orbitW + r1_passW + GAP * 2, y: r1_y, width: r1_weatherW, height: r1_h, minWidth: 280, minHeight: 200, z: 7, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'altitude', baseType: 'altitude', title: 'Altitude & Orbital Stats (ความสูง TLE)', category: 'satellite', satelliteColor: '#34d399', x: 0, y: r2_y, width: col4W, height: r2_h, minWidth: 280, minHeight: 200, z: 5, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'attitude', baseType: 'attitude', title: 'Spacecraft Attitude (การทรงตัว)', category: 'satellite', satelliteColor: '#fbbf24', x: col4W + GAP, y: r2_y, width: col4W, height: r2_h, minWidth: 280, minHeight: 200, z: 6, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'passes', baseType: 'passes', title: 'Today Passes (รอบพาสวันนี้)', category: 'general', satelliteColor: '#38bdf8', x: (col4W + GAP) * 2, y: r2_y, width: col4W, height: r2_h, minWidth: 320, minHeight: 240, z: 8, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'operators', baseType: 'operators', title: 'Duty Operators (เวรปฏิบัติการ)', category: 'general', satelliteColor: '#a78bfa', x: (col4W + GAP) * 3, y: r2_y, width: W - (col4W + GAP) * 3, height: r2_h, minWidth: 320, minHeight: 240, z: 9, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'chart-altitude', baseType: 'chart-altitude', chartKey: 'altitude', title: 'Orbital Altitude (ความสูงวงโคจร)', category: 'telemetry', satelliteColor: '#38bdf8', x: 0, y: r3_y, width: col4W, height: r3_h, minWidth: 200, minHeight: 160, z: 10, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-velocity', baseType: 'chart-velocity', chartKey: 'velocity', title: 'Velocity (ความเร็ว)', category: 'telemetry', satelliteColor: '#06b6d4', x: col4W + GAP, y: r3_y, width: col4W, height: r3_h, minWidth: 200, minHeight: 160, z: 11, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-inclination', baseType: 'chart-inclination', chartKey: 'inclination', title: 'Inclination (มุมเอียงวงโคจร)', category: 'telemetry', satelliteColor: '#34d399', x: (col4W + GAP) * 2, y: r3_y, width: col4W, height: r3_h, minWidth: 200, minHeight: 160, z: 12, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-period', baseType: 'chart-period', chartKey: 'period', title: 'Orbital Period (คาบการโคจร)', category: 'telemetry', satelliteColor: '#3b82f6', x: (col4W + GAP) * 3, y: r3_y, width: W - (col4W + GAP) * 3, height: r3_h, minWidth: 200, minHeight: 160, z: 13, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

      { id: 'chart-tleAge', baseType: 'chart-tleAge', chartKey: 'tleAge', title: 'TLE Age (อายุข้อมูล TLE)', category: 'telemetry', satelliteColor: '#10b981', x: 0, y: r4_y, width: col4W, height: r4_h, minWidth: 200, minHeight: 160, z: 14, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-meanMotion', baseType: 'chart-meanMotion', chartKey: 'meanMotion', title: 'Mean Motion (จำนวนรอบต่อวัน)', category: 'telemetry', satelliteColor: '#a78bfa', x: col4W + GAP, y: r4_y, width: col4W, height: r4_h, minWidth: 200, minHeight: 160, z: 15, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-eccentricity', baseType: 'chart-eccentricity', chartKey: 'eccentricity', title: 'Eccentricity (ความรีของวงโคจร)', category: 'telemetry', satelliteColor: '#f1f5f9', x: (col4W + GAP) * 2, y: r4_y, width: col4W, height: r4_h, minWidth: 200, minHeight: 160, z: 16, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
      { id: 'chart-anomalies', baseType: 'chart-anomalies', chartKey: 'anomalies', title: 'Mission Anomalies (ข้อขัดข้อง)', category: 'telemetry', satelliteColor: '#fb7185', x: (col4W + GAP) * 3, y: r4_y, width: W - (col4W + GAP) * 3, height: r4_h, minWidth: 200, minHeight: 160, z: 17, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false }
    ]
  }

  // =========================================================================
  // TIER 3: STANDARD DESKTOP (W < 2400)
  // =========================================================================
  const row0Y = 0
  const row0H = 180

  const row1Y = row0Y + row0H + GAP
  const row1H = 340

  const orbitW = Math.round((W - GAP) * 0.60)
  const passW = W - orbitW - GAP
  const row2Y = row1Y + row1H + GAP
  const row2H = 540

  const col3W = Math.floor((W - GAP * 2) / 3)
  const row3Y = row2Y + row2H + GAP
  const row3H = 260

  const col2W = Math.floor((W - GAP) / 2)
  const row4Y = row3Y + row3H + GAP
  const row4H = 300

  const col4W = Math.floor((W - GAP * 3) / 4)
  const row5Y = row4Y + row4H + GAP
  const row5H = 260

  const row6Y = row5Y + row5H + GAP
  const row6H = 260

  return [
    { id: 'kpi-overview', baseType: 'kpi-overview', title: 'KPI Operations Overview (ภาพรวมภารกิจยุทธการ)', category: 'general', satelliteColor: '#10b981', x: 0, y: row0Y, width: W, height: row0H, minWidth: 420, minHeight: 130, z: 1, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'satellite-summary', baseType: 'satellite-summary', title: 'Satellite Telemetry Summaries (ข้อมูลด่วนดาวเทียม)', category: 'satellite', satelliteId: 'all', satelliteColor: '#38bdf8', x: 0, y: row1Y, width: W, height: row1H, minWidth: 360, minHeight: 180, z: 2, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'orbit-tracker', baseType: 'orbit-tracker', title: 'Orbit Tracker (แผนที่วงโคจรสด)', category: 'general', satelliteColor: '#60a5fa', x: 0, y: row2Y, width: orbitW, height: row2H, minWidth: 420, minHeight: 380, z: 3, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'pass-countdown', baseType: 'pass-countdown', title: 'Pass Countdown (นับถอยหลังรอบพาส)', category: 'satellite', satelliteColor: '#38bdf8', x: orbitW + GAP, y: row2Y, width: passW, height: row2H, minWidth: 320, minHeight: 380, z: 4, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'altitude', baseType: 'altitude', title: 'Altitude & Orbital Stats (ความสูง TLE)', category: 'satellite', satelliteColor: '#34d399', x: 0, y: row3Y, width: col3W, height: row3H, minWidth: 280, minHeight: 200, z: 5, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'attitude', baseType: 'attitude', title: 'Spacecraft Attitude (การทรงตัว)', category: 'satellite', satelliteColor: '#fbbf24', x: col3W + GAP, y: row3Y, width: col3W, height: row3H, minWidth: 280, minHeight: 200, z: 6, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'weather', baseType: 'weather', title: 'Space Weather (สภาพอวกาศ NOAA)', category: 'general', satelliteColor: '#f97316', x: (col3W + GAP) * 2, y: row3Y, width: W - (col3W + GAP) * 2, height: row3H, minWidth: 280, minHeight: 200, z: 7, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'passes', baseType: 'passes', title: 'Today Passes (รอบพาสวันนี้)', category: 'general', satelliteColor: '#38bdf8', x: 0, y: row4Y, width: col2W, height: row4H, minWidth: 320, minHeight: 240, z: 8, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'operators', baseType: 'operators', title: 'Duty Operators (เวรปฏิบัติการ)', category: 'general', satelliteColor: '#a78bfa', x: col2W + GAP, y: row4Y, width: W - col2W - GAP, height: row4H, minWidth: 320, minHeight: 240, z: 9, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

    { id: 'chart-altitude', baseType: 'chart-altitude', chartKey: 'altitude', title: 'Orbital Altitude (ความสูงวงโคจร)', category: 'telemetry', satelliteColor: '#38bdf8', x: 0, y: row5Y, width: col4W, height: row5H, minWidth: 220, minHeight: 180, z: 10, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-velocity', baseType: 'chart-velocity', chartKey: 'velocity', title: 'Velocity (ความเร็ว)', category: 'telemetry', satelliteColor: '#06b6d4', x: col4W + GAP, y: row5Y, width: col4W, height: row5H, minWidth: 220, minHeight: 180, z: 11, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-inclination', baseType: 'chart-inclination', chartKey: 'inclination', title: 'Inclination (มุมเอียงวงโคจร)', category: 'telemetry', satelliteColor: '#34d399', x: (col4W + GAP) * 2, y: row5Y, width: col4W, height: row5H, minWidth: 220, minHeight: 180, z: 12, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-period', baseType: 'chart-period', chartKey: 'period', title: 'Orbital Period (คาบการโคจร)', category: 'telemetry', satelliteColor: '#3b82f6', x: (col4W + GAP) * 3, y: row5Y, width: W - (col4W + GAP) * 3, height: row5H, minWidth: 220, minHeight: 180, z: 13, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },

    { id: 'chart-tleAge', baseType: 'chart-tleAge', chartKey: 'tleAge', title: 'TLE Age (อายุข้อมูล TLE)', category: 'telemetry', satelliteColor: '#10b981', x: 0, y: row6Y, width: col4W, height: row6H, minWidth: 220, minHeight: 180, z: 14, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-meanMotion', baseType: 'chart-meanMotion', chartKey: 'meanMotion', title: 'Mean Motion (จำนวนรอบต่อวัน)', category: 'telemetry', satelliteColor: '#a78bfa', x: col4W + GAP, y: row6Y, width: col4W, height: row6H, minWidth: 220, minHeight: 180, z: 15, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-eccentricity', baseType: 'chart-eccentricity', chartKey: 'eccentricity', title: 'Eccentricity (ความรีของวงโคจร)', category: 'telemetry', satelliteColor: '#f1f5f9', x: (col4W + GAP) * 2, y: row6Y, width: col4W, height: row6H, minWidth: 220, minHeight: 180, z: 16, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false },
    { id: 'chart-anomalies', baseType: 'chart-anomalies', chartKey: 'anomalies', title: 'Mission Anomalies (ข้อขัดข้อง)', category: 'telemetry', satelliteColor: '#fb7185', x: (col4W + GAP) * 3, y: row6Y, width: W - (col4W + GAP) * 3, height: row6H, minWidth: 220, minHeight: 180, z: 17, backgroundOpacity: 94, contentOpacity: 100, borderOpacity: 100, locked: false, hidden: false }
  ]
}

const DEFAULT_WIDGET_LAYOUT = buildSmartLayout(1400)

// โหลดการจัดวางที่บันทึกไว้ใน LocalStorage (เวอร์ชัน v8 รองรับ Operator Video Wall เต็มรูปแบบ)
const savedLayout = ref((() => {
  try {
    const raw = localStorage.getItem('soms_dashboard_layout_v8') || localStorage.getItem('soms_dashboard_layout_v7')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.some(w => (w.baseType || w.id) === 'kpi-overview')) {
        return parsed
      }
    }
  } catch (e) {}
  const initialWidth = typeof window !== 'undefined' ? Math.max(920, window.innerWidth - 80) : 1400
  return buildSmartLayout(initialWidth)
})())

// โหมดจอผนังขนาดใหญ่ (Operator Video Wall Scale Mode)
const isVideoWallMode = ref(false)
const toggleVideoWallMode = () => {
  isVideoWallMode.value = !isVideoWallMode.value
  if (isVideoWallMode.value) {
    appStore.showToast('โหมดผนังจอขนาดใหญ่ (Video Wall)', 'เปิดการขยายขนาดข้อความและปรับแต่งเพื่อการแสดงผลบนจอห้องปฏิบัติการขนาดใหญ่')
  } else {
    appStore.showToast('โหมดหน้าจอปกติ', 'ปรับกลับสู่ขนาดมาตรฐาน')
  }
}

// ขยายวิดเจ็ตเต็มจอ (Maximize to Fullscreen Modal)
const maximizedWidget = ref(null)
const openMaximizeModal = (widget) => {
  maximizedWidget.value = widget
}
const closeMaximizeModal = () => {
  maximizedWidget.value = null
}
const onKeyDown = (e) => {
  if (e.key === 'Escape' && maximizedWidget.value) {
    closeMaximizeModal()
  }
}

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

// ปรับขยายและจัดวางวิดเจ็ตให้เต็มความกว้างหน้าจออัตโนมัติ (Fit Full Width / Multi-Tier Smart Layout)
const fitLayoutToFullWidth = (silent = false) => {
  const currentW = stageWidth.value || (typeof window !== 'undefined' ? window.innerWidth - 64 : 1400)
  const newLayout = buildSmartLayout(currentW)
  
  if (isEditing.value) {
    draftLayout.value = newLayout
  } else {
    savedLayout.value = newLayout
    try {
      localStorage.setItem('soms_dashboard_layout_v8', JSON.stringify(newLayout))
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
  window.addEventListener('keydown', onKeyDown)

  // หากเปิดครั้งแรกในเวอร์ชัน v8 ให้ขยายจัดเต็มความกว้างหน้าจออัตโนมัติ
  if (!localStorage.getItem('soms_dashboard_layout_v8')) {
    nextTick(() => {
      fitLayoutToFullWidth(true)
    })
  }

  fetchDashboard()
})

onUnmounted(() => {
  if (stageResizeObs) stageResizeObs.disconnect()
  window.removeEventListener('resize', updateStageDimensions)
  window.removeEventListener('keydown', onKeyDown)
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
    localStorage.setItem('soms_dashboard_layout_v8', JSON.stringify(savedLayout.value))
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
  const def = buildSmartLayout(currentW)
  draftLayout.value = JSON.parse(JSON.stringify(def))
  savedLayout.value = JSON.parse(JSON.stringify(def))
  try {
    localStorage.setItem('soms_dashboard_layout_v8', JSON.stringify(def))
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

// เพิ่มวิดเจ็ตชิ้นใหม่จากคลัง (รองรับการเพิ่มซ้ำหลายชิ้น Duplicate Widgets ได้อิสระ)
const addWidgetFromLibrary = (baseId) => {
  const list = isEditing.value ? draftLayout.value : savedLayout.value
  const def = DEFAULT_WIDGET_LAYOUT.find(w => (w.baseType || w.id) === baseId) || {
    id: baseId,
    baseType: baseId,
    title: baseId,
    category: 'general',
    satelliteColor: '#38bdf8',
    x: 16,
    y: 16,
    width: 480,
    height: 320,
    minWidth: 280,
    minHeight: 180,
    z: 10,
    backgroundOpacity: 94,
    contentOpacity: 100,
    borderOpacity: 100,
    locked: false,
    hidden: false
  }

  const existingCount = list.filter(w => (w.baseType || w.id.split('-instance-')[0]) === baseId).length
  const newInstanceId = existingCount === 0 && !list.some(w => w.id === baseId)
    ? baseId
    : `${baseId}-instance-${Date.now()}`

  const offset = (existingCount % 5) * 28
  const newWidget = {
    ...def,
    id: newInstanceId,
    baseType: baseId,
    title: existingCount > 0 ? `${def.title} #${existingCount + 1}` : def.title,
    x: Math.min(Math.max(0, stageWidth.value - (def.width || 480)), 24 + offset),
    y: 32 + offset,
    z: Math.max(1, ...list.map(w => w.z || 1)) + 1,
    hidden: false
  }

  list.push(newWidget)
  selectedWidgetId.value = newInstanceId

  if (!isEditing.value) {
    try {
      localStorage.setItem('soms_dashboard_layout_v8', JSON.stringify(savedLayout.value))
    } catch (e) {}
  }
  appStore.showToast('เพิ่มวิดเจ็ตสำเร็จ', `เพิ่ม ${newWidget.title} ลงบนกระดานเรียบร้อยแล้ว`)
}

// สลับเปิด/ปิดวิดเจ็ตจากคลัง (Library)
const toggleWidgetFromLibrary = (widgetId) => {
  const list = isEditing.value ? draftLayout.value : savedLayout.value
  const matching = list.filter(w => (w.baseType || w.id.split('-instance-')[0]) === widgetId)
  if (matching.length > 0) {
    const allVisible = matching.every(w => !w.hidden)
    matching.forEach(w => {
      w.hidden = allVisible
    })
  } else {
    addWidgetFromLibrary(widgetId)
  }
  if (!isEditing.value) {
    try {
      localStorage.setItem('soms_dashboard_layout_v8', JSON.stringify(savedLayout.value))
    } catch (e) {}
  }
}

// โคลนวิดเจ็ตที่เลือกอยู่ในโหมดแก้ไข (Clone/Duplicate Selected Widget)
const duplicateCurrentWidget = () => {
  if (!currentSelectedWidget.value) return
  const src = currentSelectedWidget.value
  const base = src.baseType || src.id.split('-instance-')[0]
  const list = draftLayout.value
  const count = list.filter(w => (w.baseType || w.id.split('-instance-')[0]) === base).length
  const newId = `${base}-instance-${Date.now()}`
  const cloned = {
    ...src,
    id: newId,
    baseType: base,
    title: `${src.title} (สำเนา #${count + 1})`,
    x: Math.min(stageWidth.value - src.width, src.x + 24),
    y: src.y + 24,
    z: Math.max(1, ...list.map(w => w.z || 1)) + 1
  }
  list.push(cloned)
  selectedWidgetId.value = newId
  appStore.showToast('โคลนวิดเจ็ตสำเร็จ', `คัดลอก ${cloned.title} เรียบร้อยแล้ว`)
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
  <div
    class="dashboard-workspace space-y-5"
    :class="{
      'is-editing': isEditing,
      'video-wall-mode': isVideoWallMode
    }"
  >
    <!-- Top Header Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-750/80">
      <div>
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-600/50 text-cyan-300 shadow-xs shadow-cyan-950/60">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white tracking-normal">
              {{ todayFormatted }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-300 font-normal font-prompt mt-1 tracking-normal">
              ระบบสารสนเทศและการปฏิบัติการควบคุมดาวเทียม (SOIS Operations Center)
            </p>
          </div>
        </div>
      </div>

      <!-- Action Controls (จัดระยะช่องไฟและสีสันให้สว่างตา สบายตา มองเห็นชัดเจน) -->
      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Operator Video Wall Scale Toggle Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-prompt"
          :class="isVideoWallMode ? 'bg-indigo-900/80 border-indigo-400 text-white shadow-indigo-900/60' : 'bg-[#142137] hover:bg-[#1c2d4a] border-slate-600/70 text-slate-100 hover:text-white'"
          title="สลับโหมดการแสดงผลสำหรับจอผนังขนาดใหญ่ (10+ จอต่อกันในห้องศูนย์ปฏิบัติการ)"
          @click="toggleVideoWallMode"
        >
          <Monitor class="w-4 h-4" :class="isVideoWallMode ? 'text-indigo-300' : 'text-slate-300'" />
          <span>{{ isVideoWallMode ? 'โหมดผนังจอ (Active)' : 'โหมดผนังจอ (Video Wall)' }}</span>
        </button>

        <!-- Add Widget Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#132747] hover:bg-[#1c3661] text-cyan-200 hover:text-white border border-cyan-500/60 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-prompt"
          @click="showLibraryModal = true"
        >
          <Plus class="w-4 h-4 text-cyan-300" />
          <span>+ เพิ่มวิดเจ็ต</span>
        </button>

        <!-- Fit Full Width Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#102d2c] hover:bg-[#184240] text-emerald-200 hover:text-white border border-emerald-500/60 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-prompt"
          title="ปรับขนาดและจัดวางวิดเจ็ตเต็มความกว้างหน้าจออัตโนมัติ"
          @click="fitLayoutToFullWidth(false)"
        >
          <Maximize2 class="w-4 h-4 text-emerald-300" />
          <span>จัดเต็มจอ (Fit Width)</span>
        </button>

        <!-- Edit Layout Toggle Button -->
        <button
          v-if="!isEditing"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2b2210] hover:bg-[#3d3117] text-amber-200 hover:text-white border border-amber-500/70 text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer font-prompt"
          title="จัดวาง ขยับเลื่อน และปรับขนาดวิดเจ็ตได้อย่างอิสระเหมือนต้นฉบับ"
          @click="enterEditMode"
        >
          <Sliders class="w-4 h-4 text-amber-300" />
          <span>ปรับแต่งแดชบอร์ด (Edit layout)</span>
        </button>

        <!-- Handover Modal Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#142137] hover:bg-[#1c2d4a] text-slate-100 hover:text-white border border-slate-600/70 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-prompt"
          @click="showHandoverModal = true"
        >
          <ClipboardList class="w-4 h-4 text-cyan-400" />
          <span>สรุปส่งมอบเวร</span>
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#142137] hover:bg-[#1c2d4a] text-slate-100 hover:text-white border border-slate-600/70 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer font-prompt"
          title="ดึงข้อมูลสถานะล่าสุดทันที"
          @click="fetchDashboard"
        >
          <RefreshCw class="w-4 h-4 text-slate-300" :class="loading ? 'animate-spin' : ''" />
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

        <!-- Clone / Duplicate Widget Button -->
        <button
          v-if="currentSelectedWidget"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          title="โคลน/คัดลอกวิดเจ็ตนี้เพิ่มอีกชิ้นบนกระดาน เพื่อดูข้อมูลดาวเทียมหรือพารามิเตอร์คนละชุด"
          @click="duplicateCurrentWidget"
        >
          <Copy class="w-3.5 h-3.5" />
          <span>โคลนวิดเจ็ต (+ Duplicate)</span>
        </button>

        <!-- Satellite Target Selector for Satellite-based Widgets -->
        <div
          v-if="currentSelectedWidget && ['satellite-summary', 'altitude'].includes(currentSelectedWidget.baseType || currentSelectedWidget.id.split('-instance-')[0])"
          class="flex items-center gap-2 bg-[#090b0f] px-3 py-1.5 rounded-xl border border-space-700"
        >
          <span class="text-xs text-slate-300 font-bold whitespace-nowrap">ดาวเทียมเป้าหมาย:</span>
          <select
            v-model="currentSelectedWidget.satelliteId"
            class="bg-[#0f1522] text-xs text-cyan-300 font-bold rounded-lg px-2 py-1 border border-space-700 focus:outline-none focus:border-cyan-500 cursor-pointer font-prompt"
          >
            <option value="all">ทั้งหมด (All Satellites)</option>
            <option value="46320">NAPA-1 N (46320)</option>
            <option value="48963">NAPA-2 N (48963)</option>
            <option value="58016">THEOS-2 (58016)</option>
          </select>
        </div>

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

    <!-- INTERACTIVE DASHBOARD STAGE (100% โมดูลาร์ - ขยับเลื่อน ย้าย ปรับขนาด และเพิ่มซ้ำได้ทุกส่วนไม่มีข้อยกเว้น) -->
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
        @maximize="openMaximizeModal"
      >
        <!-- 0. KPI OPERATIONAL OVERVIEW -->
        <KpiOverviewWidget
          v-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'kpi-overview'"
          :dashboard-data="dashboardData"
          class="h-full p-2.5"
        />

        <!-- 0.1 SATELLITE SUMMARY CARDS -->
        <SatelliteSummary
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'satellite-summary'"
          :satellites="dashboardData.satellites"
          :satellite-id="widget.satelliteId || 'all'"
          class="h-full p-2.5"
        />

        <!-- 1. ORBIT TRACKER -->
        <OrbitTrackerWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'orbit-tracker'"
          :satellites="dashboardData.satellites"
          :passes="dashboardData.passes"
        />

        <!-- 2. PASS COUNTDOWN -->
        <PassCountdownWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'pass-countdown'"
          :passes="dashboardData.passes"
          :editing="isEditing"
        />

        <!-- 3. ALTITUDE & ORBITAL STATS -->
        <SatelliteAltitudeWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'altitude'"
          :satellites="dashboardData.satellites"
          :satellite-id="widget.satelliteId"
        />

        <!-- 4. SPACECRAFT ATTITUDE -->
        <AttitudeWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'attitude'"
        />

        <!-- 5. SPACE WEATHER -->
        <SpaceWeatherWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'weather'"
          :weather="dashboardData.weather"
          class="h-full"
        />

        <!-- 6. TODAY'S PASSES -->
        <TodayPassesWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'passes'"
          :passes="dashboardData.passes"
          class="h-full"
        />

        <!-- 7. MISSION OPERATORS -->
        <DutyOperatorsWidget
          v-else-if="(widget.baseType || widget.id.split('-instance-')[0]) === 'operators'"
          :operations="dashboardData.operations"
          class="h-full"
        />

        <!-- 8. INDIVIDUAL TELEMETRY CHARTS (แต่ละกราฟเป็นอิสระต่อกัน) -->
        <TelemetryChart
          v-else-if="(widget.baseType || widget.id).startsWith('chart-')"
          :title="getChartConfig(widget.baseType || widget.id)?.title || widget.title"
          :labels="chartLabels"
          :data="getChartData(widget.baseType || widget.id)"
          :unit="getChartConfig(widget.baseType || widget.id)?.unit || ''"
          :color="getChartConfig(widget.baseType || widget.id)?.color || '#38bdf8'"
          :fill-color="getChartConfig(widget.baseType || widget.id)?.fillColor || 'rgba(56, 189, 248, 0.08)'"
          :type="getChartConfig(widget.baseType || widget.id)?.type || 'line'"
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
      :active-widgets="activeWidgetList"
      :active-widget-ids="activeWidgetList.map(w => w.id)"
      @add-widget="addWidgetFromLibrary"
      @toggle-widget="toggleWidgetFromLibrary"
      @reset-layout="resetToDefault"
    />

    <!-- Maximize Modal (ขยายวิดเจ็ตเต็มจอเพื่อดูรายละเอียดสูงและภาพรวมคมชัด) -->
    <Teleport to="body">
      <div
        v-if="maximizedWidget"
        class="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
        @click.self="closeMaximizeModal"
      >
        <div
          class="relative w-full max-w-7xl h-[92vh] flex flex-col rounded-2xl border border-slate-700 bg-[#0e1625] shadow-2xl shadow-black/95 overflow-hidden"
          :style="{
            boxShadow: `0 0 50px ${(maximizedWidget.satelliteColor || '#38bdf8')}35`
          }"
        >
          <!-- Modal Header -->
          <header class="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#111c2e] to-[#0c1422] border-b border-slate-700/80 flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-3.5 h-3.5 rounded-full flex-shrink-0 animate-pulse"
                :style="{
                  backgroundColor: maximizedWidget.satelliteColor || '#38bdf8',
                  boxShadow: `0 0 12px ${maximizedWidget.satelliteColor || '#38bdf8'}`
                }"
              ></div>
              <div class="min-w-0">
                <h3 class="text-base sm:text-lg font-black font-prompt text-white tracking-wide truncate">
                  {{ maximizedWidget.title }}
                </h3>
                <span class="text-xs text-slate-300 font-mono hidden sm:inline">
                  [FULLSCREEN HIGH-DEFINITION OPERATOR VIEW] · กด ESC หรือคลิกปุ่มปิดเพื่อกลับสู่แดชบอร์ด
                </span>
              </div>
            </div>

            <button
              type="button"
              class="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title="ปิดหน้าต่างเต็มจอ (Esc)"
              @click="closeMaximizeModal"
            >
              <X class="w-4 h-4" />
            </button>
          </header>

          <!-- Modal Body with Expanded Component -->
          <div class="flex-1 min-h-0 overflow-auto p-4 bg-[#0a0f18]">
            <!-- 0. KPI OPERATIONAL OVERVIEW -->
            <KpiOverviewWidget
              v-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'kpi-overview'"
              :dashboard-data="dashboardData"
              class="h-full"
            />

            <!-- 0.1 SATELLITE SUMMARY CARDS -->
            <SatelliteSummary
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'satellite-summary'"
              :satellites="dashboardData.satellites"
              :satellite-id="maximizedWidget.satelliteId || 'all'"
              class="h-full"
            />

            <!-- 1. ORBIT TRACKER -->
            <OrbitTrackerWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'orbit-tracker'"
              :satellites="dashboardData.satellites"
              :passes="dashboardData.passes"
            />

            <!-- 2. PASS COUNTDOWN -->
            <PassCountdownWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'pass-countdown'"
              :passes="dashboardData.passes"
              :editing="false"
            />

            <!-- 3. ALTITUDE & ORBITAL STATS -->
            <SatelliteAltitudeWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'altitude'"
              :satellites="dashboardData.satellites"
              :satellite-id="maximizedWidget.satelliteId"
            />

            <!-- 4. SPACECRAFT ATTITUDE -->
            <AttitudeWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'attitude'"
            />

            <!-- 5. SPACE WEATHER -->
            <SpaceWeatherWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'weather'"
              :weather="dashboardData.weather"
              class="h-full"
            />

            <!-- 6. TODAY'S PASSES -->
            <TodayPassesWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'passes'"
              :passes="dashboardData.passes"
              class="h-full"
            />

            <!-- 7. MISSION OPERATORS -->
            <DutyOperatorsWidget
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id.split('-instance-')[0]) === 'operators'"
              :operations="dashboardData.operations"
              class="h-full"
            />

            <!-- 8. INDIVIDUAL TELEMETRY CHARTS -->
            <TelemetryChart
              v-else-if="(maximizedWidget.baseType || maximizedWidget.id).startsWith('chart-')"
              :title="getChartConfig(maximizedWidget.baseType || maximizedWidget.id)?.title || maximizedWidget.title"
              :labels="chartLabels"
              :data="getChartData(maximizedWidget.baseType || maximizedWidget.id)"
              :unit="getChartConfig(maximizedWidget.baseType || maximizedWidget.id)?.unit || ''"
              :color="getChartConfig(maximizedWidget.baseType || maximizedWidget.id)?.color || '#38bdf8'"
              :fill-color="getChartConfig(maximizedWidget.baseType || maximizedWidget.id)?.fillColor || 'rgba(56, 189, 248, 0.08)'"
              :type="getChartConfig(maximizedWidget.baseType || maximizedWidget.id)?.type || 'line'"
            />
          </div>
        </div>
      </div>
    </Teleport>
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
