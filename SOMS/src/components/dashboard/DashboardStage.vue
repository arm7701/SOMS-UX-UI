<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DashboardStage.vue
 * วัตถุประสงค์: สเตจแดชบอร์ดหลักที่สามารถลากย้าย (Drag) และปรับขนาด (Resize) ได้อย่างอิสระ
 * รองรับการย้าย/ปรับขนาด/เพิ่ม/ลบทุกกราฟและทุกส่วนประกอบของแดชบอร์ดแยกรายชิ้น
 * รองรับ Multi-Platform: Desktop, Tablet (Touch), และ Mobile (Auto-stack)
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  GripVertical,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  Sparkles,
  Plus,
  Orbit,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Radio,
  Clock,
  Layers,
  Sun,
  Calendar,
  Users,
  LineChart,
  TrendingUp,
  Zap,
  Compass,
  Gauge,
  Timer,
  AlertTriangle
} from 'lucide-vue-next'

import StatCard from '@/components/common/StatCard.vue'
import SatelliteSummary from './SatelliteSummary.vue'
import SpaceWeatherWidget from './SpaceWeatherWidget.vue'
import TodayPassesWidget from './TodayPassesWidget.vue'
import DutyOperatorsWidget from './DutyOperatorsWidget.vue'
import TelemetryChart from './TelemetryChart.vue'
import NextPassBanner from './NextPassBanner.vue'
import OrbitTrackerWidget from './OrbitTrackerWidget.vue'
import WidgetLibraryDrawer from './WidgetLibraryDrawer.vue'
import DashboardLayoutToolbar from './DashboardLayoutToolbar.vue'

const props = defineProps({
  dashboardData: {
    type: Object,
    required: true
  },
  telemetryList: {
    type: Array,
    default: () => []
  }
})

// ============================================================================
// 1. แคตตาล็อกวิดเจ็ตทั้งหมด (Available Widget Catalog)
// ============================================================================

const AVAILABLE_WIDGET_CATALOG = [
  // --- หมวด: ภาพรวม & KPI ---
  {
    typeId: 'globe',
    title: 'Orbit Tracker (แผนที่และลูกโลก 3 มิติ)',
    category: 'overview',
    categoryName: 'ระบบวงโคจรหลัก',
    description: 'แผนที่ 2D Ground Track และลูกโลก 3D แสดงวิถีโคจรแบบ Real-time SGP4',
    icon: 'Globe2',
    defaultWidth: 1200,
    defaultHeight: 570,
    minWidth: 400,
    minHeight: 420
  },
  {
    typeId: 'nextPass',
    title: 'แบนเนอร์นับถอยหลังรอบพาส (Next Pass Countdown)',
    category: 'overview',
    categoryName: 'รอบพาส',
    description: 'แถบนับถอยหลังเวลาสู่ AOS/LOS และการแจ้งเตือนเสียงขณะผ่านสถานี',
    icon: 'Clock',
    defaultWidth: 1200,
    defaultHeight: 104,
    minWidth: 360,
    minHeight: 80
  },
  {
    typeId: 'kpi-satellites',
    title: 'KPI ดาวเทียมในวงโคจร',
    category: 'overview',
    categoryName: 'ดัชนี KPI',
    description: 'การ์ดสรุปสถานะดาวเทียมในวงโคจร (NAPA-1 N / NAPA-2 N)',
    icon: 'Orbit',
    defaultWidth: 288,
    defaultHeight: 116,
    minWidth: 200,
    minHeight: 96
  },
  {
    typeId: 'kpi-passes',
    title: 'KPI พาสดาวเทียมวันนี้',
    category: 'overview',
    categoryName: 'ดัชนี KPI',
    description: 'การ์ดสรุปจำนวนรอบพาสดาวเทียมผ่านสถานีตลอด 24 ชม.',
    icon: 'Activity',
    defaultWidth: 288,
    defaultHeight: 116,
    minWidth: 200,
    minHeight: 96
  },
  {
    typeId: 'kpi-weather',
    title: 'KPI สภาพอวกาศล่าสุด',
    category: 'overview',
    categoryName: 'ดัชนี KPI',
    description: 'การ์ดสรุประดับสภาพอวกาศ NOAA Scale (R-Scale)',
    icon: 'Sun',
    defaultWidth: 288,
    defaultHeight: 116,
    minWidth: 200,
    minHeight: 96
  },
  {
    typeId: 'kpi-duty',
    title: 'KPI เวรปฏิบัติการ',
    category: 'overview',
    categoryName: 'ดัชนี KPI',
    description: 'การ์ดสรุปสถานะชุดปฏิบัติการ MD, FMO, GSO ประจำสถานี',
    icon: 'ShieldCheck',
    defaultWidth: 288,
    defaultHeight: 116,
    minWidth: 200,
    minHeight: 96
  },
  {
    typeId: 'kpiCards',
    title: 'แถบดัชนีภาพรวมรวม (KPI 4-in-1 Strip)',
    category: 'overview',
    categoryName: 'ดัชนี KPI รวม',
    description: 'แถบรวม 4 การ์ดสรุปดัชนีภาพรวมระบบทั้งหมดในแถบเดียว',
    icon: 'BarChart3',
    defaultWidth: 1200,
    defaultHeight: 120,
    minWidth: 360,
    minHeight: 96
  },

  // --- หมวด: การปฏิบัติการ & วงโคจร ---
  {
    typeId: 'spaceWeather',
    title: 'สภาพอวกาศ (Space Weather - NOAA Scales)',
    category: 'operations',
    categoryName: 'สิ่งแวดล้อมอวกาศ',
    description: 'ค่าดัชนี R, S, G scales รังสี พายุสุริยะ และผลกระทบต่อสัญญาณดาวเทียม',
    icon: 'Sun',
    defaultWidth: 440,
    defaultHeight: 400,
    minWidth: 320,
    minHeight: 300
  },
  {
    typeId: 'todayPasses',
    title: 'ตารางพาสดาวเทียมวันนี้ (Today Scheduled Passes)',
    category: 'operations',
    categoryName: 'รอบพาส',
    description: 'รายการรอบพาสเข้าสถานีโคราชและสถานีเครือข่ายตลอด 24 ชั่วโมง',
    icon: 'Calendar',
    defaultWidth: 744,
    defaultHeight: 400,
    minWidth: 360,
    minHeight: 300
  },
  {
    typeId: 'satelliteSummary',
    title: 'สถานะดาวเทียมในวงโคจร (Satellite Fleet Overview)',
    category: 'operations',
    categoryName: 'ฝูงดาวเทียม',
    description: 'ตารางและสถานะดาวเทียม NAPA-1 N, NAPA-2 N ข้อมูลจำเพาะ และความสูง',
    icon: 'Orbit',
    defaultWidth: 1200,
    defaultHeight: 280,
    minWidth: 400,
    minHeight: 220
  },
  {
    typeId: 'dutyOperators',
    title: 'เจ้าหน้าที่ปฏิบัติหน้าที่ (Duty Operators)',
    category: 'operations',
    categoryName: 'การปฏิบัติงาน',
    description: 'รายชื่อผู้ปฏิบัติหน้าที่ตำแหน่ง MD, FMO, GSO ประจำชุดปฏิบัติการ',
    icon: 'Users',
    defaultWidth: 1200,
    defaultHeight: 260,
    minWidth: 400,
    minHeight: 200
  },

  // --- หมวด: กราฟโทรมาตรแยกรายตัว (Individual Telemetry Charts) ---
  {
    typeId: 'chart-altitude',
    title: 'กราฟ Altitude (ความสูงวงโคจร)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์ระดับความสูงของดาวเทียมในวงโคจร 7 วันย้อนหลัง (km)',
    icon: 'TrendingUp',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'altitude'
  },
  {
    typeId: 'chart-velocity',
    title: 'กราฟ Velocity (ความเร็ว)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์ความเร็วการเคลื่อนที่ของดาวเทียม (km/s)',
    icon: 'Zap',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'velocity'
  },
  {
    typeId: 'chart-inclination',
    title: 'กราฟ Inclination (มุมเอียงวงโคจร)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์มุมเอียงของระนาบวงโคจรเทียบกับเส้นศูนย์สูตร (°)',
    icon: 'Compass',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'inclination'
  },
  {
    typeId: 'chart-period',
    title: 'กราฟ Orbital Period (คาบโคจร)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์เวลาที่ดาวเทียมโคจรรอบโลกครบ 1 รอบ (min)',
    icon: 'Clock',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'period'
  },
  {
    typeId: 'chart-tleAge',
    title: 'กราฟ TLE Age (อายุข้อมูลวงโคจร)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์อายุชุดข้อมูล TLE ล่าสุดนับจาก Epoch (hours)',
    icon: 'Timer',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'tleAge'
  },
  {
    typeId: 'chart-meanMotion',
    title: 'กราฟ Mean Motion (รอบต่อวัน)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์จำนวนรอบการโคจรรอบโลกใน 1 วัน (rev/day)',
    icon: 'Gauge',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'meanMotion'
  },
  {
    typeId: 'chart-eccentricity',
    title: 'กราฟ Eccentricity (ความรี)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'วิเคราะห์ความรีของวงโคจรดาวเทียม (0 = วงกลมสมบูรณ์)',
    icon: 'Orbit',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'eccentricity'
  },
  {
    typeId: 'chart-anomalies',
    title: 'กราฟ Mission Anomalies (ข้อขัดข้อง)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตร',
    description: 'สถิติการเกิดเหตุการณ์ผิดปกติหรือข้อขัดข้องของภารกิจ (ครั้ง)',
    icon: 'AlertTriangle',
    defaultWidth: 288,
    defaultHeight: 220,
    minWidth: 240,
    minHeight: 170,
    chartKey: 'anomalies'
  },
  {
    typeId: 'telemetryCharts',
    title: 'ชุดกราฟโทรมาตรครบชุด (8-in-1 Suite)',
    category: 'telemetry',
    categoryName: 'กราฟโทรมาตรรวม',
    description: 'ชุดรวมกราฟวิเคราะห์โทรมาตร 8 พารามิเตอร์ในกล่องเดียว',
    icon: 'LineChart',
    defaultWidth: 1200,
    defaultHeight: 560,
    minWidth: 400,
    minHeight: 340
  }
]

// ============================================================================
// 2. โครงสร้างเลย์เอาต์เริ่มต้นของแดชบอร์ด (Default Stage Layout)
// ทุกกราฟและทุกส่วนแยกเป็นอิสระต่อกันอย่างสมบูรณ์
// ============================================================================

const DEFAULT_STAGE_LAYOUT = [
  // 1. Orbit Tracker (ลูกโลก 3D และแผนที่ 2D)
  {
    id: 'globe',
    typeId: 'globe',
    title: 'Orbit Tracker (แผนที่และลูกโลก 3 มิติ)',
    category: 'overview',
    x: 0,
    y: 0,
    width: 1200,
    height: 570,
    minWidth: 400,
    minHeight: 420,
    z: 1,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 2. Next Pass Banner
  {
    id: 'nextPass',
    typeId: 'nextPass',
    title: 'แบนเนอร์นับถอยหลังรอบพาส (Next Pass Countdown)',
    category: 'overview',
    x: 0,
    y: 586,
    width: 1200,
    height: 104,
    minWidth: 360,
    minHeight: 80,
    z: 2,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 3. KPI การ์ดเดี่ยว 4 ใบเรียงแถวหน้ากว้าง 288px (รวมระยะเว้น 16px = 1200px พอดี)
  {
    id: 'kpi-satellites',
    typeId: 'kpi-satellites',
    title: 'KPI ดาวเทียมในวงโคจร',
    category: 'overview',
    x: 0,
    y: 706,
    width: 288,
    height: 116,
    minWidth: 200,
    minHeight: 96,
    z: 3,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'kpi-passes',
    typeId: 'kpi-passes',
    title: 'KPI พาสดาวเทียมวันนี้',
    category: 'overview',
    x: 304,
    y: 706,
    width: 288,
    height: 116,
    minWidth: 200,
    minHeight: 96,
    z: 4,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'kpi-weather',
    typeId: 'kpi-weather',
    title: 'KPI สภาพอวกาศล่าสุด',
    category: 'overview',
    x: 608,
    y: 706,
    width: 288,
    height: 116,
    minWidth: 200,
    minHeight: 96,
    z: 5,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'kpi-duty',
    typeId: 'kpi-duty',
    title: 'KPI เวรปฏิบัติการ',
    category: 'overview',
    x: 912,
    y: 706,
    width: 288,
    height: 116,
    minWidth: 200,
    minHeight: 96,
    z: 6,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 4. สภาพอวกาศ และ ตารางพาสวันนี้ วางเคียงข้างกัน
  {
    id: 'spaceWeather',
    typeId: 'spaceWeather',
    title: 'สภาพอวกาศ (Space Weather - NOAA Scales)',
    category: 'operations',
    x: 0,
    y: 838,
    width: 440,
    height: 400,
    minWidth: 320,
    minHeight: 300,
    z: 7,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'todayPasses',
    typeId: 'todayPasses',
    title: 'ตารางพาสดาวเทียมวันนี้ (Today Scheduled Passes)',
    category: 'operations',
    x: 456,
    y: 838,
    width: 744,
    height: 400,
    minWidth: 360,
    minHeight: 300,
    z: 8,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 5. สรุปฝูงดาวเทียม NAPA-1 N / NAPA-2 N
  {
    id: 'satelliteSummary',
    typeId: 'satelliteSummary',
    title: 'สถานะดาวเทียมในวงโคจร (Satellite Fleet Overview)',
    category: 'operations',
    x: 0,
    y: 1254,
    width: 1200,
    height: 280,
    minWidth: 400,
    minHeight: 220,
    z: 9,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 6. เจ้าหน้าที่ประจำเวรปฏิบัติการ
  {
    id: 'dutyOperators',
    typeId: 'dutyOperators',
    title: 'เจ้าหน้าที่ปฏิบัติหน้าที่ (Duty Operators)',
    category: 'operations',
    x: 0,
    y: 1550,
    width: 1200,
    height: 260,
    minWidth: 400,
    minHeight: 200,
    z: 10,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 7. แถวกราฟโทรมาตรแถวที่ 1 (4 กราฟอิสระ)
  {
    id: 'chart-altitude',
    typeId: 'chart-altitude',
    title: 'Altitude (ความสูงวงโคจร)',
    category: 'telemetry',
    chartKey: 'altitude',
    x: 0,
    y: 1826,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 11,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-velocity',
    typeId: 'chart-velocity',
    title: 'Velocity (ความเร็ว)',
    category: 'telemetry',
    chartKey: 'velocity',
    x: 304,
    y: 1826,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 12,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-inclination',
    typeId: 'chart-inclination',
    title: 'Inclination (มุมเอียงวงโคจร)',
    category: 'telemetry',
    chartKey: 'inclination',
    x: 608,
    y: 1826,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 13,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-period',
    typeId: 'chart-period',
    title: 'Orbital Period (คาบโคจร)',
    category: 'telemetry',
    chartKey: 'period',
    x: 912,
    y: 1826,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 14,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  // 8. แถวกราฟโทรมาตรแถวที่ 2 (อีก 4 กราฟอิสระ)
  {
    id: 'chart-tleAge',
    typeId: 'chart-tleAge',
    title: 'TLE Age (อายุข้อมูลวงโคจร)',
    category: 'telemetry',
    chartKey: 'tleAge',
    x: 0,
    y: 2062,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 15,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-meanMotion',
    typeId: 'chart-meanMotion',
    title: 'Mean Motion (รอบต่อวัน)',
    category: 'telemetry',
    chartKey: 'meanMotion',
    x: 304,
    y: 2062,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 16,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-eccentricity',
    typeId: 'chart-eccentricity',
    title: 'Eccentricity (ความรี)',
    category: 'telemetry',
    chartKey: 'eccentricity',
    x: 608,
    y: 2062,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 17,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  },
  {
    id: 'chart-anomalies',
    typeId: 'chart-anomalies',
    title: 'Mission Anomalies (ข้อขัดข้อง)',
    category: 'telemetry',
    chartKey: 'anomalies',
    x: 912,
    y: 2062,
    width: 288,
    height: 220,
    minWidth: 240,
    minHeight: 170,
    z: 18,
    backgroundOpacity: 95,
    borderOpacity: 100,
    locked: false,
    hidden: false
  }
]

// ============================================================================
// 3. State และการจัดการ LocalStorage
// ============================================================================

const STORAGE_KEY = 'soms_dashboard_stage_layout_v5'
const BASE_WIDTH = 1200
const baseWidthRef = ref(BASE_WIDTH)

const loadInitialLayout = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed?.widgets && Array.isArray(parsed.widgets)) {
        if (parsed.baseWidth) baseWidthRef.value = parsed.baseWidth
        return parsed.widgets
      } else if (Array.isArray(parsed)) {
        return parsed
      }
    } catch (e) {
      console.warn('Could not parse saved layout, using default layout.', e)
    }
  }

  // คำนวณความกว้างหน้าจอจริงล่วงหน้า (หักลบ Sidebar 260px และ Padding)
  const estWidth = typeof window !== 'undefined'
    ? Math.max(900, window.innerWidth - (window.innerWidth >= 1024 ? 290 : 48))
    : 1200

  baseWidthRef.value = estWidth
  const gap = 16
  const col4W = Math.floor((estWidth - (gap * 3)) / 4)
  const col4Rem = estWidth - ((col4W * 3) + (gap * 3))
  const col2W_1 = Math.floor((estWidth - gap) * 0.38)
  const col2W_2 = estWidth - gap - col2W_1

  // คืนค่าโครงสร้างเต็มความกว้างหน้าจอแบบ 100% Edge-to-Edge
  const full = JSON.parse(JSON.stringify(DEFAULT_STAGE_LAYOUT))
  full.forEach(w => {
    if (['globe', 'nextPass', 'satelliteSummary', 'dutyOperators'].includes(w.id)) {
      w.width = estWidth
    } else if (w.id === 'spaceWeather') {
      w.width = col2W_1
    } else if (w.id === 'todayPasses') {
      w.x = col2W_1 + gap
      w.width = col2W_2
    } else if (w.id.startsWith('kpi-') || w.id.startsWith('chart-')) {
      const colIdx = Math.round(w.x / 304)
      w.x = (col4W + gap) * colIdx
      w.width = (colIdx === 3) ? col4Rem : col4W
    }
  })

  return full
}

const widgets = ref(loadInitialLayout())
const draftWidgets = ref([])
const isEditing = ref(false)
const showLibrary = ref(false)
const snapToGrid = ref(true)
const selectedWidgetId = ref(null)
const activeDragId = ref(null)
const activeResizeId = ref(null)
const isSaving = ref(false)
const toastMessage = ref('')

const stageRef = ref(null)
const stageWidth = ref(1200)
const isMobile = ref(false)
let stageResizeObserver = null

// วิดเจ็ตที่กำลังเลือกอยู่
const selectedWidget = computed(() => {
  return widgets.value.find(w => w.id === selectedWidgetId.value) || null
})

// วิดเจ็ตที่มองเห็นได้บนหน้าจอ
const visibleWidgets = computed(() => {
  return widgets.value.filter(w => !w.hidden)
})

// คำนวณความสูงรวมของสเตจแดชบอร์ด
const computedStageHeight = computed(() => {
  if (isMobile.value) return 'auto'
  const active = widgets.value.filter(w => !w.hidden)
  if (active.length === 0) return '450px'
  const maxBottom = Math.max(500, ...active.map(w => w.y + w.height))
  return `${maxBottom + (isEditing.value ? 140 : 40)}px`
})

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

// ============================================================================
// 4. ระบบ Drag & Drop Engine (Multi-Platform รองรับทั้ง Mouse และ Touch)
// ============================================================================

let isDragging = false
let activeDragWidget = null
let dragStartX = 0
let dragStartY = 0
let widgetStartX = 0
let widgetStartY = 0

const startDrag = (e, widget) => {
  if (widget.locked || isMobile.value) return
  if (e.target.closest('button, select, input, a, .no-drag')) return

  e.preventDefault()
  isDragging = true
  activeDragWidget = widget
  activeDragId.value = widget.id
  selectedWidgetId.value = widget.id

  dragStartX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
  dragStartY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0
  widgetStartX = widget.x
  widgetStartY = widget.y

  window.addEventListener('pointermove', onDragMove, { passive: false })
  window.addEventListener('pointerup', onDragEnd)
  window.addEventListener('pointercancel', onDragEnd)
}

const onDragMove = (e) => {
  if (!isDragging || !activeDragWidget) return
  e.preventDefault()

  const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
  const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0
  const dx = curX - dragStartX
  const dy = curY - dragStartY

  let nextX = widgetStartX + dx
  let nextY = widgetStartY + dy

  if (snapToGrid.value) {
    nextX = Math.round(nextX / 16) * 16
    nextY = Math.round(nextY / 16) * 16
  }

  const maxX = Math.max(0, stageWidth.value - activeDragWidget.width)
  nextX = Math.max(0, Math.min(maxX, nextX))
  nextY = Math.max(0, nextY)

  activeDragWidget.x = nextX
  activeDragWidget.y = nextY
}

const onDragEnd = () => {
  isDragging = false
  activeDragWidget = null
  activeDragId.value = null
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  window.removeEventListener('pointercancel', onDragEnd)
}

// ============================================================================
// 5. ระบบ Resize Engine (Multi-Platform)
// ============================================================================

let isResizing = false
let activeResizeWidget = null
let resizeDirection = 'se'
let resizeStartX = 0
let resizeStartY = 0
let widgetStartW = 0
let widgetStartH = 0

const startResize = (e, widget, direction) => {
  if (widget.locked || isMobile.value) return
  e.preventDefault()
  e.stopPropagation()

  isResizing = true
  activeResizeWidget = widget
  resizeDirection = direction
  activeResizeId.value = widget.id
  selectedWidgetId.value = widget.id

  resizeStartX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
  resizeStartY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0
  widgetStartW = widget.width
  widgetStartH = widget.height

  window.addEventListener('pointermove', onResizeMove, { passive: false })
  window.addEventListener('pointerup', onResizeEnd)
  window.addEventListener('pointercancel', onResizeEnd)
}

const onResizeMove = (e) => {
  if (!isResizing || !activeResizeWidget) return
  e.preventDefault()

  const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
  const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0
  const dx = curX - resizeStartX
  const dy = curY - resizeStartY

  if (resizeDirection.includes('e')) {
    let nextW = widgetStartW + dx
    if (snapToGrid.value) {
      nextW = Math.round(nextW / 16) * 16
    }
    const minW = activeResizeWidget.minWidth || 200
    const maxW = stageWidth.value - activeResizeWidget.x
    nextW = Math.max(minW, Math.min(maxW, nextW))
    activeResizeWidget.width = nextW
  }

  if (resizeDirection.includes('s')) {
    let nextH = widgetStartH + dy
    if (snapToGrid.value) {
      nextH = Math.round(nextH / 16) * 16
    }
    const minH = activeResizeWidget.minHeight || 90
    nextH = Math.max(minH, nextH)
    activeResizeWidget.height = nextH
  }
}

const onResizeEnd = () => {
  isResizing = false
  activeResizeWidget = null
  activeResizeId.value = null
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
  window.removeEventListener('pointercancel', onResizeEnd)
}

// ============================================================================
// ============================================================================
// 6. ฟังก์ชันควบคุมเลย์เอาต์ (Layout Control & Responsive Calculations)
// ============================================================================

// ปรับขนาดวิดเจ็ตทั้งหมดให้ขยายหรือย่อตามขนาดคอนเทนเนอร์หน้าจอจริง (Edge-to-Edge)
const scaleWidgetsToWidth = (newWidth, oldWidth) => {
  if (!oldWidth || oldWidth <= 0 || !newWidth || newWidth <= 0) return
  const ratio = newWidth / oldWidth

  widgets.value.forEach(w => {
    // หากเป็นการ์ดที่ตั้งใจให้กว้างเต็มจอ (Full-width card เช่น Orbit Tracker, Next Pass, Fleet, Operators)
    const isFullWidthType = ['globe', 'nextPass', 'satelliteSummary', 'dutyOperators'].includes(w.typeId)
    const wasFull = isFullWidthType || (w.x <= 16 && w.width >= oldWidth - 48)
    if (wasFull) {
      w.x = 0
      w.width = newWidth
    } else {
      const newX = Math.round(w.x * ratio)
      let newW = Math.round(w.width * ratio)
      // ชิดขอบขวาเดิมหรือไม่
      if (w.x + w.width >= oldWidth - 48) {
        newW = newWidth - newX
      }
      w.x = Math.max(0, Math.min(newWidth - (w.minWidth || 180), newX))
      w.width = Math.max(w.minWidth || 180, Math.min(newWidth - w.x, newW))
    }
  })
}

// ขยายและจัดเรียงวิดเจ็ตทุกตัวให้เต็มพื้นที่ขอบจอ 100% ไม่เหลือช่องว่างฝั่งขวา
const handleFitFullWidth = () => {
  if (isMobile.value || stageWidth.value <= 0) return
  const W = stageWidth.value
  const gap = 16

  // จัดกลุ่มวิดเจ็ตตามระดับแถว (พิกัด Y ใกล้เคียงกัน)
  const rowsMap = new Map()
  const visible = widgets.value.filter(w => !w.hidden)

  visible.forEach(w => {
    let foundRowKey = null
    for (const key of rowsMap.keys()) {
      if (Math.abs(w.y - key) < 40) {
        foundRowKey = key
        break
      }
    }
    if (foundRowKey !== null) {
      rowsMap.get(foundRowKey).push(w)
    } else {
      rowsMap.set(w.y, [w])
    }
  })

  // จัดแต่ละแถวให้แผ่เต็มความกว้าง W เสมอ
  rowsMap.forEach((rowWidgets) => {
    rowWidgets.sort((a, b) => a.x - b.x)
    const count = rowWidgets.length

    if (count === 1) {
      // แถวเดี่ยว: กว้างเต็มหน้าจอ 100%
      rowWidgets[0].x = 0
      rowWidgets[0].width = W
    } else if (count === 2) {
      // แถวคู่: สัดส่วนตามเดิม หรือแบ่งสัดส่วน Space Weather (38%) + Today Passes (62%)
      const totalGaps = gap
      const availableW = W - totalGaps
      const w1 = rowWidgets[0].typeId === 'spaceWeather'
        ? Math.round(availableW * 0.38)
        : Math.round(availableW * 0.5)
      const w2 = availableW - w1
      rowWidgets[0].x = 0
      rowWidgets[0].width = w1
      rowWidgets[1].x = w1 + gap
      rowWidgets[1].width = w2
    } else if (count >= 3) {
      // แถว 3 หรือ 4 ใบ (เช่น การ์ด KPI หรือ แถวกราฟ 4 ช่อง): แบ่งเฉลี่ยเต็มจอเป๊ะ
      const totalGaps = gap * (count - 1)
      const colW = Math.floor((W - totalGaps) / count)
      let curX = 0
      rowWidgets.forEach((w, idx) => {
        w.x = curX
        w.width = (idx === count - 1) ? (W - curX) : colW
        curX += w.width + gap
      })
    }
  })

  showToast('ขยายวิดเจ็ตทุกส่วนให้เต็มพื้นที่หน้าจอเรียบร้อย')
}

const toggleEditMode = () => {
  if (!isEditing.value) {
    // ก่อนเข้าโหมดปรับแต่ง ตรวจสอบว่าหน้าจอขยายกว้างกว่าเดิมหรือไม่
    if (!isMobile.value && stageWidth.value > 640) {
      const maxRight = Math.max(...widgets.value.filter(w => !w.hidden).map(w => w.x + w.width))
      if (maxRight < stageWidth.value - 48) {
        scaleWidgetsToWidth(stageWidth.value, maxRight || 1200)
        baseWidthRef.value = stageWidth.value
      }
    }
    draftWidgets.value = JSON.parse(JSON.stringify(widgets.value))
    isEditing.value = true
    selectedWidgetId.value = widgets.value.find(w => !w.hidden)?.id || null
  } else {
    handleSave()
  }
}

const handleSave = () => {
  isSaving.value = true
  setTimeout(() => {
    const payload = {
      version: 3,
      baseWidth: stageWidth.value,
      widgets: widgets.value
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    isEditing.value = false
    selectedWidgetId.value = null
    isSaving.value = false
    showToast('บันทึกรูปแบบเลย์เอาต์แดชบอร์ดสำเร็จ')
  }, 200)
}

const handleCancel = () => {
  if (draftWidgets.value.length > 0) {
    widgets.value = JSON.parse(JSON.stringify(draftWidgets.value))
  }
  isEditing.value = false
  selectedWidgetId.value = null
  showToast('ยกเลิกการปรับแต่งแล้ว')
}

const handleReset = () => {
  const W = Math.max(360, stageWidth.value || 1200)
  const gap = 16
  const col4W = Math.floor((W - (gap * 3)) / 4)
  const col4Rem = W - ((col4W * 3) + (gap * 3))
  const col2W_1 = Math.floor((W - gap) * 0.38)
  const col2W_2 = W - gap - col2W_1

  const fresh = [
    // 1. Orbit Tracker (Full Width)
    {
      id: 'globe',
      typeId: 'globe',
      title: 'Orbit Tracker (แผนที่และลูกโลก 3 มิติ)',
      category: 'overview',
      x: 0,
      y: 0,
      width: W,
      height: 570,
      minWidth: 400,
      minHeight: 420,
      z: 1,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 2. Next Pass Banner (Full Width)
    {
      id: 'nextPass',
      typeId: 'nextPass',
      title: 'แบนเนอร์นับถอยหลังรอบพาส (Next Pass Countdown)',
      category: 'overview',
      x: 0,
      y: 586,
      width: W,
      height: 104,
      minWidth: 360,
      minHeight: 80,
      z: 2,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 3. KPI การ์ดเดี่ยว 4 ใบ ขยายเต็มความกว้างหน้าจอ
    {
      id: 'kpi-satellites',
      typeId: 'kpi-satellites',
      title: 'KPI ดาวเทียมในวงโคจร',
      category: 'overview',
      x: 0,
      y: 706,
      width: col4W,
      height: 116,
      minWidth: 180,
      minHeight: 96,
      z: 3,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'kpi-passes',
      typeId: 'kpi-passes',
      title: 'KPI พาสดาวเทียมวันนี้',
      category: 'overview',
      x: col4W + gap,
      y: 706,
      width: col4W,
      height: 116,
      minWidth: 180,
      minHeight: 96,
      z: 4,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'kpi-weather',
      typeId: 'kpi-weather',
      title: 'KPI สภาพอวกาศล่าสุด',
      category: 'overview',
      x: (col4W + gap) * 2,
      y: 706,
      width: col4W,
      height: 116,
      minWidth: 180,
      minHeight: 96,
      z: 5,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'kpi-duty',
      typeId: 'kpi-duty',
      title: 'KPI เวรปฏิบัติการ',
      category: 'overview',
      x: (col4W + gap) * 3,
      y: 706,
      width: col4Rem,
      height: 116,
      minWidth: 180,
      minHeight: 96,
      z: 6,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 4. สภาพอวกาศ และ ตารางพาสวันนี้ (2 คอลัมน์ เต็มความกว้างหน้าจอ)
    {
      id: 'spaceWeather',
      typeId: 'spaceWeather',
      title: 'สภาพอวกาศ (Space Weather - NOAA Scales)',
      category: 'operations',
      x: 0,
      y: 838,
      width: col2W_1,
      height: 400,
      minWidth: 300,
      minHeight: 300,
      z: 7,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'todayPasses',
      typeId: 'todayPasses',
      title: 'ตารางพาสดาวเทียมวันนี้ (Today Scheduled Passes)',
      category: 'operations',
      x: col2W_1 + gap,
      y: 838,
      width: col2W_2,
      height: 400,
      minWidth: 340,
      minHeight: 300,
      z: 8,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 5. สรุปฝูงดาวเทียม (Full Width)
    {
      id: 'satelliteSummary',
      typeId: 'satelliteSummary',
      title: 'สถานะดาวเทียมในวงโคจร (Satellite Fleet Overview)',
      category: 'operations',
      x: 0,
      y: 1254,
      width: W,
      height: 280,
      minWidth: 400,
      minHeight: 220,
      z: 9,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 6. เจ้าหน้าที่ประจำเวรปฏิบัติการ (Full Width)
    {
      id: 'dutyOperators',
      typeId: 'dutyOperators',
      title: 'เจ้าหน้าที่ปฏิบัติหน้าที่ (Duty Operators)',
      category: 'operations',
      x: 0,
      y: 1550,
      width: W,
      height: 260,
      minWidth: 400,
      minHeight: 200,
      z: 10,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 7. แถวกราฟโทรมาตรแถวที่ 1 (4 คอลัมน์ เต็มความกว้างหน้าจอ)
    {
      id: 'chart-altitude',
      typeId: 'chart-altitude',
      title: 'Altitude (ความสูงวงโคจร)',
      category: 'telemetry',
      chartKey: 'altitude',
      x: 0,
      y: 1826,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 11,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-velocity',
      typeId: 'chart-velocity',
      title: 'Velocity (ความเร็ว)',
      category: 'telemetry',
      chartKey: 'velocity',
      x: col4W + gap,
      y: 1826,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 12,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-inclination',
      typeId: 'chart-inclination',
      title: 'Inclination (มุมเอียงวงโคจร)',
      category: 'telemetry',
      chartKey: 'inclination',
      x: (col4W + gap) * 2,
      y: 1826,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 13,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-period',
      typeId: 'chart-period',
      title: 'Orbital Period (คาบโคจร)',
      category: 'telemetry',
      chartKey: 'period',
      x: (col4W + gap) * 3,
      y: 1826,
      width: col4Rem,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 14,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    // 8. แถวกราฟโทรมาตรแถวที่ 2 (4 คอลัมน์ เต็มความกว้างหน้าจอ)
    {
      id: 'chart-tleAge',
      typeId: 'chart-tleAge',
      title: 'TLE Age (อายุข้อมูลวงโคจร)',
      category: 'telemetry',
      chartKey: 'tleAge',
      x: 0,
      y: 2062,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 15,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-meanMotion',
      typeId: 'chart-meanMotion',
      title: 'Mean Motion (รอบต่อวัน)',
      category: 'telemetry',
      chartKey: 'meanMotion',
      x: col4W + gap,
      y: 2062,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 16,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-eccentricity',
      typeId: 'chart-eccentricity',
      title: 'Eccentricity (ความรี)',
      category: 'telemetry',
      chartKey: 'eccentricity',
      x: (col4W + gap) * 2,
      y: 2062,
      width: col4W,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 17,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    },
    {
      id: 'chart-anomalies',
      typeId: 'chart-anomalies',
      title: 'Mission Anomalies (ข้อขัดข้อง)',
      category: 'telemetry',
      chartKey: 'anomalies',
      x: (col4W + gap) * 3,
      y: 2062,
      width: col4Rem,
      height: 220,
      minWidth: 200,
      minHeight: 170,
      z: 18,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    }
  ]

  baseWidthRef.value = W
  widgets.value = fresh
  selectedWidgetId.value = fresh[0]?.id || null
  showToast('คืนค่าเลย์เอาต์เริ่มต้นแบบเต็มพื้นที่หน้าจอเรียบร้อย')
}

const handleAutoArrange = () => {
  if (isMobile.value) return
  // จัดเรียงแบบเต็มความกว้าง
  handleFitFullWidth()
}

const toggleLock = (widgetId) => {
  const w = widgets.value.find(item => item.id === widgetId)
  if (w) {
    w.locked = !w.locked
  }
}

const bringForward = (widgetId) => {
  const maxZ = Math.max(...widgets.value.map(w => w.z || 1))
  const w = widgets.value.find(item => item.id === widgetId)
  if (w) {
    w.z = maxZ + 1
  }
}

const sendBackward = (widgetId) => {
  const minZ = Math.min(...widgets.value.map(w => w.z || 1))
  const w = widgets.value.find(item => item.id === widgetId)
  if (w) {
    w.z = Math.max(1, minZ - 1)
  }
}

const moveWidgetOrderMobile = (widgetId, direction) => {
  const idx = widgets.value.findIndex(w => w.id === widgetId)
  if (idx === -1) return
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1
  if (targetIdx >= 0 && targetIdx < widgets.value.length) {
    const temp = widgets.value[idx]
    widgets.value[idx] = widgets.value[targetIdx]
    widgets.value[targetIdx] = temp
  }
}

const updateOpacity = (val) => {
  if (selectedWidget.value) {
    selectedWidget.value.backgroundOpacity = val
  }
}

const removeWidget = (widgetId) => {
  const w = widgets.value.find(item => item.id === widgetId)
  if (w) {
    w.hidden = true
    if (selectedWidgetId.value === widgetId) {
      selectedWidgetId.value = widgets.value.find(item => !item.hidden)?.id || null
    }
    showToast(`ลบ ${w.title} ออกจากหน้าจอแล้ว (เรียกคืนได้จากคลังวิดเจ็ต)`)
  }
}

const addWidgetFromLibrary = (item) => {
  const existing = widgets.value.find(w => w.id === item.id || w.typeId === item.typeId)
  const maxBottom = widgets.value.filter(w => !w.hidden).length > 0
    ? Math.max(...widgets.value.filter(w => !w.hidden).map(w => w.y + w.height)) + 16
    : 0

  if (existing) {
    existing.hidden = false
    existing.x = 0
    existing.y = maxBottom
    existing.width = Math.min(stageWidth.value, existing.width || item.defaultWidth)
    selectedWidgetId.value = existing.id
  } else {
    const newWidget = {
      id: item.typeId,
      typeId: item.typeId,
      title: item.title,
      category: item.category,
      chartKey: item.chartKey,
      x: 0,
      y: maxBottom,
      width: Math.min(stageWidth.value, item.defaultWidth),
      height: item.defaultHeight,
      minWidth: item.minWidth,
      minHeight: item.minHeight,
      z: widgets.value.length + 1,
      backgroundOpacity: 95,
      borderOpacity: 100,
      locked: false,
      hidden: false
    }
    widgets.value.push(newWidget)
    selectedWidgetId.value = newWidget.id
  }

  showToast(`เพิ่ม ${item.title} ลงบนหน้าจอแล้ว`)
}

const locateWidget = (widgetId) => {
  selectedWidgetId.value = widgetId
  const el = stageRef.value?.querySelector(`[data-widget-id="${widgetId}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const getChartByKey = (key) => {
  return props.telemetryList?.find(c => c.key === key) || null
}

// คำนวณ Style รายการการ์ดให้สมบูรณ์และเต็มพื้นที่หน้าจอเสมอ
const getWidgetStyle = (widget) => {
  if (isMobile.value) {
    return {
      position: 'relative',
      left: '0px',
      top: '0px',
      width: '100%',
      height: widget.typeId.startsWith('kpi-') ? '110px' : (widget.height ? `${widget.height}px` : 'auto'),
      marginBottom: '16px',
      zIndex: widget.z || 1,
      backgroundColor: `rgba(7, 21, 41, ${(widget.backgroundOpacity ?? 95) / 100})`,
      borderColor: `rgba(56, 189, 248, ${(widget.borderOpacity ?? 100) / 100 * 0.28})`,
      boxShadow: '0 8px 30px -4px rgba(1, 6, 20, 0.75), 0 0 1px 1px rgba(56, 189, 248, 0.12)'
    }
  }

  return {
    position: 'absolute',
    left: `${widget.x}px`,
    top: `${widget.y}px`,
    width: `${widget.width}px`,
    height: `${widget.height}px`,
    zIndex: widget.z || 1,
    backgroundColor: `rgba(7, 21, 41, ${(widget.backgroundOpacity ?? 95) / 100})`,
    borderColor: `rgba(56, 189, 248, ${(widget.borderOpacity ?? 100) / 100 * 0.28})`,
    boxShadow: '0 8px 30px -4px rgba(1, 6, 20, 0.75), 0 0 1px 1px rgba(56, 189, 248, 0.12)'
  }
}

// ============================================================================
// 7. Lifecycle & Responsive ResizeObserver
// ============================================================================

let hasInitializedFullWidth = false

const updateDimensions = () => {
  if (stageRef.value) {
    const rect = stageRef.value.getBoundingClientRect()
    if (rect.width > 0) {
      const newW = Math.floor(rect.width)
      const prevW = baseWidthRef.value || 1200
      isMobile.value = window.innerWidth < 768 || rect.width < 640

      stageWidth.value = newW

      if (!isMobile.value) {
        // หากเป็นการโหลดครั้งแรก หรือหน้าจอกว้างกว่าวิดเจ็ตเดิม ให้ขยายเต็มหน้าจอทันที
        if (!hasInitializedFullWidth) {
          hasInitializedFullWidth = true
          const maxRight = Math.max(...widgets.value.filter(w => !w.hidden).map(w => w.x + w.width))
          if (maxRight < newW - 48 || prevW !== newW) {
            handleFitFullWidth()
            baseWidthRef.value = newW
          }
        } else if (Math.abs(newW - prevW) > 16) {
          // หากผู้ใช้ย่อ/ขยายหน้าต่างเบราว์เซอร์ ให้ปรับสัดส่วนตาม
          scaleWidgetsToWidth(newW, prevW)
          baseWidthRef.value = newW
        }
      }
    }
  }
}

onMounted(() => {
  updateDimensions()
  if (window.ResizeObserver && stageRef.value) {
    stageResizeObserver = new ResizeObserver(updateDimensions)
    stageResizeObserver.observe(stageRef.value)
  }
  window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
  if (stageResizeObserver) stageResizeObserver.disconnect()
  window.removeEventListener('resize', updateDimensions)
})

defineExpose({
  toggleEditMode,
  openLibrary: () => { showLibrary.value = true },
  isEditing
})
</script>

<template>
  <div class="space-y-4">
    <!-- Success Toast Notification -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="toastMessage"
        class="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-sky-950/95 border border-sky-400 text-sky-200 text-xs font-semibold shadow-2xl shadow-sky-950 flex items-center gap-2 backdrop-blur-md"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Layout Toolbar (Docked at top when Edit Mode is active) -->
    <DashboardLayoutToolbar
      v-if="isEditing"
      v-model:snap-to-grid="snapToGrid"
      :selected-widget="selectedWidget"
      :is-saving="isSaving"
      @save="handleSave"
      @cancel="handleCancel"
      @reset="handleReset"
      @auto-arrange="handleAutoArrange"
      @fit-full-width="handleFitFullWidth"
      @open-library="showLibrary = true"
      @bring-forward="bringForward"
      @send-backward="sendBackward"
      @toggle-lock="toggleLock"
      @update-opacity="updateOpacity"
      @remove-widget="removeWidget"
    />

    <!-- Main Dashboard Stage -->
    <div
      ref="stageRef"
      class="dashboard-stage relative w-full transition-all duration-200 rounded-2xl"
      :class="[
        isEditing
          ? 'p-2 min-h-[600px] border border-dashed border-sky-500/30'
          : 'p-0 border-0'
      ]"
      :style="{
        height: computedStageHeight,
        backgroundImage: isEditing
          ? 'radial-gradient(rgba(56, 189, 248, 0.25) 1.5px, transparent 1.5px)'
          : 'none',
        backgroundSize: isEditing ? '16px 16px' : 'auto'
      }"
    >
      <!-- Widgets Render Loop -->
      <div
        v-for="widget in visibleWidgets"
        :key="widget.id"
        :data-widget-id="widget.id"
        class="dashboard-widget rounded-2xl border transition-all duration-150 select-none flex flex-col group overflow-hidden"
        :class="[
          isEditing ? 'cursor-default ring-1 ring-sky-500/30 shadow-lg' : '',
          selectedWidgetId === widget.id && isEditing
            ? 'ring-2 ring-cyan-400 shadow-[0_0_24px_rgba(0,229,255,0.35)] z-50'
            : '',
          activeDragId === widget.id
            ? 'opacity-90 shadow-2xl z-[999] scale-[1.002]'
            : ''
        ]"
        :style="getWidgetStyle(widget)"
        @pointerdown="selectedWidgetId = widget.id"
      >
        <!-- Widget Header (Drag handle in Edit Mode) -->
        <div
          v-if="isEditing"
          class="widget-drag flex items-center justify-between px-4 py-2.5 bg-[#0c2343]/95 border-b border-sky-500/30 text-sm font-bold text-sky-100 select-none cursor-grab active:cursor-grabbing shrink-0"
          @pointerdown="startDrag($event, widget)"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <GripVertical class="w-4 h-4 text-cyan-300 shrink-0" />
            <span class="truncate font-bold text-white text-sm sm:text-base">{{ widget.title }}</span>
            <span v-if="widget.locked" class="px-2 py-0.5 rounded bg-amber-500/25 text-amber-200 text-xs font-bold flex items-center gap-1 shrink-0 border border-amber-400/40">
              <Lock class="w-3 h-3" /> ล็อก
            </span>
          </div>

          <!-- Header Quick Controls -->
          <div class="flex items-center gap-1.5 shrink-0" @pointerdown.stop>
            <!-- Mobile Up/Down controls -->
            <template v-if="isMobile">
              <button
                type="button"
                class="p-1.5 rounded hover:bg-sky-800/60 text-slate-300 hover:text-white"
                title="เลื่อนขึ้น"
                @click="moveWidgetOrderMobile(widget.id, 'up')"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 rounded hover:bg-sky-800/60 text-slate-300 hover:text-white"
                title="เลื่อนลง"
                @click="moveWidgetOrderMobile(widget.id, 'down')"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
            </template>

            <button
              type="button"
              class="p-1.5 rounded hover:bg-sky-800/60 transition-colors"
              :class="widget.locked ? 'text-amber-300' : 'text-slate-300 hover:text-white'"
              :title="widget.locked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่ง'"
              @click="toggleLock(widget.id)"
            >
              <component :is="widget.locked ? Lock : Unlock" class="w-4 h-4" />
            </button>

            <!-- Desktop layer controls -->
            <template v-if="!isMobile">
              <button
                type="button"
                class="p-1.5 rounded hover:bg-sky-800/60 text-slate-300 hover:text-white transition-colors"
                title="นำมาไว้ข้างหน้า"
                @click="bringForward(widget.id)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 rounded hover:bg-sky-800/60 text-slate-300 hover:text-white transition-colors"
                title="ส่งไปข้างหลัง"
                @click="sendBackward(widget.id)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
            </template>

            <!-- Delete / Remove Widget button -->
            <button
              type="button"
              class="p-1.5 rounded hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 transition-colors"
              title="ลบวิดเจ็ตนี้ (ย้ายไปคลังวิดเจ็ต)"
              @click="removeWidget(widget.id)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Widget Body (Inner Content Rendering) -->
        <div class="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <!-- 1. Orbit Tracker (2D Map / 3D Globe) -->
          <OrbitTrackerWidget
            v-if="widget.typeId === 'globe'"
            class="w-full h-full border-0 rounded-none"
          />

          <!-- 2. Next Pass Live Countdown Banner -->
          <div v-else-if="widget.typeId === 'nextPass'" class="h-full flex items-center">
            <NextPassBanner :passes="dashboardData.passes" class="w-full h-full border-0 rounded-none shadow-none" />
          </div>

          <!-- 3. Individual KPI Cards -->
          <div v-else-if="widget.typeId === 'kpi-satellites'" class="h-full p-2 flex items-center">
            <StatCard
              title="ดาวเทียมในวงโคจร"
              value="2"
              unit="ดวง"
              subtitle="NAPA-1 N / NAPA-2 N"
              :icon="Orbit"
              color="blue"
              badge="ONLINE"
              badge-type="success"
              class="h-full w-full border-0 rounded-none bg-transparent"
            />
          </div>

          <div v-else-if="widget.typeId === 'kpi-passes'" class="h-full p-2 flex items-center">
            <StatCard
              title="พาสดาวเทียมวันนี้"
              :value="dashboardData.passes?.length || 0"
              unit="รอบ"
              subtitle="Day & Night Passes"
              :icon="Activity"
              color="purple"
              badge="SCHEDULED"
              badge-type="info"
              class="h-full w-full border-0 rounded-none bg-transparent"
            />
          </div>

          <div v-else-if="widget.typeId === 'kpi-weather'" class="h-full p-2 flex items-center">
            <StatCard
              title="สภาพอวกาศล่าสุด"
              :value="dashboardData.weather ? `R${dashboardData.weather.spaceweather_r || 0}` : '—'"
              subtitle="NOAA Scale (Radio)"
              :icon="ShieldCheck"
              color="amber"
              badge="MONITORING"
              badge-type="warning"
              class="h-full w-full border-0 rounded-none bg-transparent"
            />
          </div>

          <div v-else-if="widget.typeId === 'kpi-duty'" class="h-full p-2 flex items-center">
            <StatCard
              title="เวรปฏิบัติการ"
              value="ACTIVE"
              subtitle="MD / FMO / GSO ประจำสถานี"
              :icon="ShieldCheck"
              color="emerald"
              badge="ON DUTY"
              badge-type="success"
              class="h-full w-full border-0 rounded-none bg-transparent"
            />
          </div>

          <!-- 4. Grouped KPI Cards (4-in-1 Strip) -->
          <div v-else-if="widget.typeId === 'kpiCards'" class="h-full p-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="ดาวเทียมในวงโคจร"
              value="2"
              unit="ดวง"
              subtitle="NAPA-1 N / NAPA-2 N"
              :icon="Orbit"
              color="blue"
              badge="ONLINE"
              badge-type="success"
              class="h-full border-0 bg-slate-900/40"
            />
            <StatCard
              title="พาสดาวเทียมวันนี้"
              :value="dashboardData.passes?.length || 0"
              unit="รอบ"
              subtitle="Day & Night Passes"
              :icon="Activity"
              color="purple"
              badge="SCHEDULED"
              badge-type="info"
              class="h-full border-0 bg-slate-900/40"
            />
            <StatCard
              title="สภาพอวกาศล่าสุด"
              :value="dashboardData.weather ? `R${dashboardData.weather.spaceweather_r || 0}` : '—'"
              subtitle="NOAA Scale (Radio)"
              :icon="ShieldCheck"
              color="amber"
              badge="MONITORING"
              badge-type="warning"
              class="h-full border-0 bg-slate-900/40"
            />
            <StatCard
              title="เวรปฏิบัติการ"
              value="ACTIVE"
              subtitle="MD / FMO / GSO ประจำสถานี"
              :icon="ShieldCheck"
              color="emerald"
              badge="ON DUTY"
              badge-type="success"
              class="h-full border-0 bg-slate-900/40"
            />
          </div>

          <!-- 5. Space Weather Widget -->
          <SpaceWeatherWidget
            v-else-if="widget.typeId === 'spaceWeather'"
            :weather="dashboardData.weather"
            class="w-full h-full border-0 rounded-none"
          />

          <!-- 6. Today Scheduled Passes Widget -->
          <TodayPassesWidget
            v-else-if="widget.typeId === 'todayPasses'"
            :passes="dashboardData.passes"
            class="w-full h-full border-0 rounded-none"
          />

          <!-- 7. Satellite Fleet Summary -->
          <SatelliteSummary
            v-else-if="widget.typeId === 'satelliteSummary'"
            :satellites="dashboardData.satellites"
            class="w-full h-full border-0 rounded-none"
          />

          <!-- 8. Duty Operators Widget -->
          <DutyOperatorsWidget
            v-else-if="widget.typeId === 'dutyOperators'"
            :operations="dashboardData.operations"
            class="w-full h-full border-0 rounded-none"
          />

          <!-- 9. Individual Telemetry Chart (ความสูง, ความเร็ว, มุมเอียง, คาบโคจร, TLE, ฯลฯ) -->
          <div v-else-if="widget.typeId.startsWith('chart-')" class="h-full w-full flex flex-col">
            <TelemetryChart
              v-if="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', ''))"
              class="flex-1 h-full w-full border-0 rounded-none bg-transparent"
              :title="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).title"
              :labels="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).labels"
              :data="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).data"
              :unit="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).unit"
              :color="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).color"
              :fill-color="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).fillColor"
              :type="getChartByKey(widget.chartKey || widget.typeId.replace('chart-', '')).type || 'line'"
            />
          </div>

          <!-- 10. Combined Telemetry Trend Graphs Suite (8 Charts) -->
          <div v-else-if="widget.typeId === 'telemetryCharts'" class="h-full flex flex-col p-3 overflow-auto">
            <div class="mb-2 shrink-0">
              <h3 class="text-xs font-bold font-prompt text-white">
                แนวโน้มค่าโทรมาตรและวงโคจร 7 วันย้อนหลัง (NAPA-2 N Telemetry)
              </h3>
              <p class="text-[10px] text-slate-400">
                การวิเคราะห์ค่าความสูง, ความเร็ว, มุมเอียง และคาบการโคจรครบชุด
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <TelemetryChart
                v-for="chart in telemetryList"
                :key="chart.key"
                :title="chart.title"
                :labels="chart.labels"
                :data="chart.data"
                :unit="chart.unit"
                :color="chart.color"
                :fill-color="chart.fillColor"
                :type="chart.type || 'line'"
              />
            </div>
          </div>
        </div>

        <!-- Resize Handles (Only in Edit Mode & if not locked & not mobile) -->
        <template v-if="isEditing && !widget.locked && !isMobile">
          <!-- Right edge handle -->
          <div
            class="widget-resize widget-resize-e"
            title="ลากเพื่อปรับความกว้าง"
            @pointerdown.stop="startResize($event, widget, 'e')"
          />
          <!-- Bottom edge handle -->
          <div
            class="widget-resize widget-resize-s"
            title="ลากเพื่อปรับความสูง"
            @pointerdown.stop="startResize($event, widget, 's')"
          />
          <!-- Corner SE handle -->
          <div
            class="widget-resize widget-resize-se group/handle"
            title="ลากเพื่อปรับขนาด (กว้าง / สูง)"
            @pointerdown.stop="startResize($event, widget, 'se')"
          >
            <svg class="w-3.5 h-3.5 text-cyan-400 group-hover/handle:scale-125 transition-transform rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="21 15 21 21 15 21" />
              <line x1="21" y1="21" x2="14" y2="14" />
            </svg>
          </div>
        </template>
      </div>

      <!-- Empty State if all widgets hidden -->
      <div
        v-if="visibleWidgets.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center"
      >
        <Sparkles class="w-10 h-10 text-sky-400/40 mb-3" />
        <h3 class="text-sm font-bold text-white mb-1">ไม่มีวิดเจ็ตแสดงบนหน้าจอ</h3>
        <p class="text-xs text-slate-400 mb-4">เปิดคลังวิดเจ็ตเพื่อเลือกเพิ่มวิดเจ็ตลงในแดชบอร์ด</p>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white text-xs font-bold transition-all shadow-lg"
          @click="showLibrary = true"
        >
          + เปิดคลังวิดเจ็ต
        </button>
      </div>
    </div>

    <!-- Widget Library Slide-over Drawer -->
    <WidgetLibraryDrawer
      v-model="showLibrary"
      :catalog="AVAILABLE_WIDGET_CATALOG"
      :active-widgets="widgets"
      @add-widget="addWidgetFromLibrary"
      @remove-widget="removeWidget"
      @locate-widget="locateWidget"
    />
  </div>
</template>

<style scoped>
.widget-resize {
  touch-action: none;
  position: absolute;
  z-index: 30;
}
.widget-resize-e {
  cursor: ew-resize;
  width: 10px;
  top: 36px;
  bottom: 24px;
  right: -5px;
}
.widget-resize-s {
  cursor: ns-resize;
  height: 10px;
  bottom: -5px;
  left: 8px;
  right: 24px;
}
.widget-resize-se {
  cursor: nwse-resize;
  width: 28px;
  height: 28px;
  bottom: 0px;
  right: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px 0 14px 0;
  background: rgba(12, 35, 67, 0.95);
  border-top: 1px solid rgba(56, 189, 248, 0.4);
  border-left: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: -2px -2px 8px rgba(0, 0, 0, 0.3);
}
</style>
