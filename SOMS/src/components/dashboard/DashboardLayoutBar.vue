<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DashboardLayoutBar.vue
 * วัตถุประสงค์: แถบเครื่องมือและเมนูปรับแต่งการแสดงผลวิดเจ็ตบน Dashboard
 * (Dashboard Layout & Widget Customization)
 * ช่วยให้เจ้าหน้าที่สามารถเปิด/ปิดวิดเจ็ตที่ต้องการดู และบันทึกไว้ใน LocalStorage
 * ============================================================================
 */
import { ref } from 'vue'
import {
  LayoutGrid,
  Check,
  RotateCcw,
  Globe2,
  Clock,
  BarChart3,
  Orbit,
  CloudSun,
  Users,
  LineChart,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-vue-next'

const props = defineProps({
  visibleWidgets: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visibleWidgets', 'reset'])

const isOpen = ref(false)

const widgetDefinitions = [
  {
    id: 'orbitTracker',
    label: 'Orbit Tracker (ลูกโลก 3D และแผนที่ 2D)',
    desc: 'แสดงพิกัดและเส้นทางโคจรดาวเทียมแบบเรียลไทม์',
    icon: Globe2,
    color: 'text-sky-400'
  },
  {
    id: 'nextPassBanner',
    label: 'แบนเนอร์นับถอยหลังรอบพาส (Next Pass Countdown)',
    desc: 'สรุปเวลานับถอยหลังสู่พาสถัดไปและสถานะการติดต่อ',
    icon: Clock,
    color: 'text-amber-400'
  },
  {
    id: 'kpiCards',
    label: 'การ์ดดัชนีสรุปหลัก (KPI Quick Stats)',
    desc: 'จำนวนดาวเทียม, รอบพาสวันนี้, สภาพอวกาศ, เวรปฏิบัติการ',
    icon: BarChart3,
    color: 'text-emerald-400'
  },
  {
    id: 'satelliteSummary',
    label: 'สถานะดาวเทียมในวงโคจร (Satellite Fleet)',
    desc: 'ข้อมูลจำเพาะ ค่าความสูง และสถานะระบบแต่ละดวง',
    icon: Orbit,
    color: 'text-cyan-400'
  },
  {
    id: 'spaceWeather',
    label: 'สภาพอวกาศและตารางพาส (Space Weather & Passes)',
    desc: 'NOAA Scales (R, S, G) และรายการรอบพาสประจำวัน',
    icon: CloudSun,
    color: 'text-indigo-400'
  },
  {
    id: 'dutyOperators',
    label: 'เจ้าหน้าที่ปฏิบัติหน้าที่ (Duty Operators)',
    desc: 'รายชื่อ MD, FMO, GSO ประจำชุดปฏิบัติการ',
    icon: Users,
    color: 'text-purple-400'
  },
  {
    id: 'telemetryCharts',
    label: 'กราฟแนวโน้มโทรมาตร 7 วัน (Telemetry Trends)',
    desc: 'กราฟความสูง ความเร็ว มุมเอียง และคาบการโคจร',
    icon: LineChart,
    color: 'text-rose-400'
  }
]

const toggleWidget = (id) => {
  const updated = { ...props.visibleWidgets, [id]: !props.visibleWidgets[id] }
  emit('update:visibleWidgets', updated)
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <div class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-sky-500/30 bg-[#0b213f] text-xs font-semibold text-sky-200 hover:text-white hover:bg-sky-900/60 shadow-xs transition-all"
      :class="{ 'ring-2 ring-sky-400 border-sky-400': isOpen }"
      title="ปรับแต่งวิดเจ็ตที่ต้องการแสดงผลบนหน้าจอแดชบอร์ด"
      @click="isOpen = !isOpen"
    >
      <SlidersHorizontal class="w-3.5 h-3.5 text-sky-400" />
      <span>ปรับแต่งวิดเจ็ต</span>
      <ChevronDown class="w-3 h-3 text-slate-400 transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>

    <!-- Dropdown Menu / Settings Panel -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-gradient-to-b from-[#0e274a] to-[#0a1b33] border border-sky-500/30 shadow-2xl shadow-sky-950/80 p-4 z-40 animate-fade-in"
    >
      <div class="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-3">
        <div class="flex items-center gap-2">
          <LayoutGrid class="w-4 h-4 text-sky-400" />
          <h4 class="text-xs font-bold font-prompt text-white">เลือกวิดเจ็ตที่ต้องการแสดง</h4>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-[11px] text-sky-300 hover:text-white transition-colors"
          @click="handleReset"
        >
          <RotateCcw class="w-3 h-3" />
          <span>รีเซ็ตค่าเริ่มต้น</span>
        </button>
      </div>

      <!-- Widget List Toggles -->
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <div
          v-for="widget in widgetDefinitions"
          :key="widget.id"
          class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none"
          :class="visibleWidgets[widget.id] ? 'bg-sky-950/40 border-sky-500/30 hover:border-sky-400/60' : 'bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-80'"
          @click="toggleWidget(widget.id)"
        >
          <div class="flex items-center gap-2.5 min-w-0 pr-2">
            <div class="p-1.5 rounded-lg bg-slate-900 border border-sky-500/20" :class="widget.color">
              <component :is="widget.icon" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <span class="block text-xs font-semibold text-white truncate">{{ widget.label }}</span>
              <span class="block text-[10px] text-slate-400 truncate">{{ widget.desc }}</span>
            </div>
          </div>

          <!-- Checkbox Switch -->
          <div
            class="w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0"
            :class="visibleWidgets[widget.id] ? 'bg-sky-500 border-sky-400 text-slate-950' : 'border-slate-600 bg-slate-900'"
          >
            <Check v-if="visibleWidgets[widget.id]" class="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      </div>

      <div class="pt-3 mt-3 border-t border-sky-500/20 flex justify-between items-center text-[11px] text-slate-400">
        <span>บันทึกการตั้งค่าลงเบราว์เซอร์อัตโนมัติ</span>
        <button
          type="button"
          class="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
          @click="isOpen = false"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>
