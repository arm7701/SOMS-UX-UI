<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/WidgetLibraryModal.vue
 * วัตถุประสงค์: หน้าต่างคลังวิดเจ็ต (Widget Library Modal) สำหรับเลือกเพิ่ม/ปิดวิดเจ็ต
 * สอดคล้องกับ WidgetLibrary ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, computed } from 'vue'
import {
  X,
  Plus,
  Check,
  Search,
  Globe2,
  Clock,
  ArrowUp,
  Sun,
  Users,
  Calendar,
  Compass,
  LineChart,
  RotateCcw,
  Sparkles,
  Orbit,
  ShieldCheck
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  activeWidgetIds: {
    type: Array,
    default: () => []
  },
  activeWidgets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'toggleWidget', 'addWidget', 'resetLayout'])

const activeCategory = ref('all') // 'all' | 'general' | 'satellite'
const searchQuery = ref('')

// รายการวิดเจ็ตทั้งหมดที่มีให้ใช้งานในระบบ
const ALL_WIDGETS = [
  {
    id: 'kpi-overview',
    title: 'KPI Operations Overview (ภาพรวมยุทธการ 4 มิติ)',
    category: 'general',
    description: 'แถบสถิติภาพรวมดาวเทียมในวงโคจร, รอบพาสประจำวัน, สภาพอวกาศ NOAA, และสถานะชุดเวรปฏิบัติการ',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-700/50'
  },
  {
    id: 'satellite-summary',
    title: 'Satellite Summary Cards (สรุปข้อมูลด่วนดาวเทียม)',
    category: 'satellite',
    description: 'การ์ดสรุปโทรมาตรสำคัญของดาวเทียม (NAPA-1, NAPA-2, THEOS-2) ค่าความสูง ความเร็ว แบตเตอรี่ และสถานะ',
    icon: Orbit,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-700/50'
  },
  {
    id: 'orbit-tracker',
    title: 'Orbit Tracker (แผนที่วงโคจรสด)',
    category: 'general',
    description: 'แผนที่ 2D Leaflet ติดตามตำแหน่งพิกัดดาวเทียมแบบเรียลไทม์ สถานีภาคพื้นดิน BMA และรัศมีสัญญาณ',
    icon: Globe2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-700/50'
  },
  {
    id: 'pass-countdown',
    title: 'Pass Countdown (นับถอยหลังรอบพาส)',
    category: 'satellite',
    description: 'นาฬิกาดิจิทัลนับถอยหลังสดเข้าสู่รอบพาสถัดไป หรือนับเวลาคงเหลือในรอบพาส (AOS/LOS)',
    icon: Clock,
    color: 'text-sky-400',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-700/50'
  },
  {
    id: 'altitude',
    title: 'Altitude & Orbital Stats (ความสูงและวงโคจร)',
    category: 'satellite',
    description: 'ระดับความสูงปัจจุบันจากการคำนวณ TLE พร้อมพารามิเตอร์ Apogee, Perigee, และ Inclination',
    icon: ArrowUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-700/50'
  },
  {
    id: 'attitude',
    title: 'Spacecraft Attitude (การทรงตัวของดาวเทียม)',
    category: 'satellite',
    description: 'สถานะโหมดการวางแนวของยานอวกาศ (Nadir-Pointing, Sun-Pointing) และมุม Roll, Pitch, Yaw',
    icon: Compass,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/40',
    borderColor: 'border-yellow-700/50'
  },
  {
    id: 'weather',
    title: 'Space Weather (สภาพอวกาศ)',
    category: 'general',
    description: 'ระดับสภาพอวกาศ NOAA Scales (Radio Blackout, Solar Radiation, Geomagnetic Storm)',
    icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-700/50'
  },
  {
    id: 'passes',
    title: 'Today\'s Passes (ตารางรอบพาสประจำวัน)',
    category: 'satellite',
    description: 'รายการรอบพาสช่วงกลางวันและกลางคืน พร้อมระยะเวลาและมุมยกสูงสุดประจำวัน',
    icon: Calendar,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-700/50'
  },
  {
    id: 'operators',
    title: 'Mission Operators (รายชื่อเจ้าหน้าที่เวร)',
    category: 'general',
    description: 'รายชื่อเจ้าหน้าที่ปฏิบัติหน้าที่ประจำศูนย์: MD, FMO และ GSO',
    icon: Users,
    color: 'text-slate-300',
    bgColor: 'bg-slate-800/60',
    borderColor: 'border-slate-700/60'
  },
  // --- กราฟโทรมาตร 8 กราฟแยกเดี่ยว อิสระ ---
  {
    id: 'chart-altitude',
    title: 'กราฟ Altitude (ระดับความสูงวงโคจร)',
    category: 'telemetry',
    description: 'กราฟแนวโน้มระดับความสูงเฉลี่ย 7 วันย้อนหลังของ NAPA-2 N (กิโลเมตร)',
    icon: LineChart,
    color: 'text-slate-300',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-600/60'
  },
  {
    id: 'chart-velocity',
    title: 'กราฟ Velocity (ความเร็วในการโคจร)',
    category: 'telemetry',
    description: 'กราฟแนวโน้มความเร็วในการโคจรรอบโลก 7 วันย้อนหลัง (km/s)',
    icon: LineChart,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-700/50'
  },
  {
    id: 'chart-inclination',
    title: 'กราฟ Inclination (มุมเอียงของวงโคจร)',
    category: 'telemetry',
    description: 'กราฟการเปลี่ยนแปลงมุมเอียงระนาบวงโคจร 7 วันย้อนหลัง (องศา)',
    icon: LineChart,
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-700/50'
  },
  {
    id: 'chart-period',
    title: 'กราฟ Orbital Period (คาบการโคจร)',
    category: 'telemetry',
    description: 'กราฟเวลาที่ใช้ในการโคจรรอบโลก 1 รอบ 7 วันย้อนหลัง (นาที)',
    icon: LineChart,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-700/50'
  },
  {
    id: 'chart-tleAge',
    title: 'กราฟ TLE Age (อายุชุดข้อมูลวงโคจร)',
    category: 'telemetry',
    description: 'กราฟอายุของชุดข้อมูล TLE ที่นำมาใช้คำนวณวงโคจร (ชั่วโมง)',
    icon: LineChart,
    color: 'text-teal-400',
    bgColor: 'bg-teal-950/40',
    borderColor: 'border-teal-700/50'
  },
  {
    id: 'chart-meanMotion',
    title: 'กราฟ Mean Motion (จำนวนรอบต่อวัน)',
    category: 'telemetry',
    description: 'กราฟค่าเฉลี่ยจำนวนรอบการโคจรรอบโลกในแต่ละวัน (rev/day)',
    icon: LineChart,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-700/50'
  },
  {
    id: 'chart-eccentricity',
    title: 'กราฟ Eccentricity (ความรีของวงโคจร)',
    category: 'telemetry',
    description: 'กราฟค่าความเยื้องศูนย์กลางของวงโคจร (ความรีของวงโคจร)',
    icon: LineChart,
    color: 'text-slate-100',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-600/60'
  },
  {
    id: 'chart-anomalies',
    title: 'กราฟ Mission Anomalies (ข้อขัดข้อง)',
    category: 'telemetry',
    description: 'แผนภูมิแท่งบันทึกจำนวนครั้งของเหตุขัดข้องหรือปัญหาในภารกิจ 7 วันย้อนหลัง',
    icon: LineChart,
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/40',
    borderColor: 'border-rose-700/50'
  }
]

const filteredWidgets = computed(() => {
  let list = ALL_WIDGETS
  if (activeCategory.value !== 'all') {
    list = list.filter(w => w.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(w => w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
  }
  return list
})

const getWidgetCount = (id) => {
  if (props.activeWidgets && props.activeWidgets.length > 0) {
    return props.activeWidgets.filter(w => (w.baseType || w.id.split('-instance-')[0]) === id).length
  }
  return props.activeWidgetIds.filter(wId => wId === id || wId.startsWith(id + '-instance-')).length
}

const isWidgetActive = (id) => getWidgetCount(id) > 0
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all"
    @click.self="emit('update:modelValue', false)"
  >
    <div class="w-full max-w-2xl bg-space-850 rounded-3xl border border-space-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-[#0e2b50] border-b border-sky-700/50 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#1a4175] border border-sky-500/40 flex items-center justify-center text-white shadow-xs">
            <Sparkles class="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold font-prompt text-white">
              Widget Library (คลังวิดเจ็ต)
            </h2>
            <p class="text-xs sm:text-sm text-sky-200 font-prompt font-medium">
              เลือกเปิด/ปิด หรือปรับแต่งวิดเจ็ตที่ต้องการให้แสดงบนหน้าแดชบอร์ด
            </p>
          </div>
        </div>

        <button
          type="button"
          class="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-[#1a4175] transition-colors cursor-pointer"
          @click="emit('update:modelValue', false)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Controls: Category Pills & Search -->
      <div class="px-6 py-3 bg-[#0a2342] border-b border-sky-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Category Selector -->
        <div class="inline-flex rounded-xl bg-[#0e2b50] p-1 border border-sky-600/40 flex-wrap">
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-prompt rounded-lg transition-colors cursor-pointer"
            :class="activeCategory === 'all' ? 'bg-[#1a4175] text-white font-bold border border-cyan-400/60 shadow-xs' : 'text-sky-200 hover:text-white'"
            @click="activeCategory = 'all'"
          >
            ทั้งหมด (All)
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-prompt rounded-lg transition-colors cursor-pointer"
            :class="activeCategory === 'general' ? 'bg-[#1a4175] text-white font-bold border border-cyan-400/60 shadow-xs' : 'text-sky-200 hover:text-white'"
            @click="activeCategory = 'general'"
          >
            ทั่วไป (General)
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-prompt rounded-lg transition-colors cursor-pointer"
            :class="activeCategory === 'satellite' ? 'bg-[#1a4175] text-white font-bold border border-cyan-400/60 shadow-xs' : 'text-sky-200 hover:text-white'"
            @click="activeCategory = 'satellite'"
          >
            ดาวเทียม (Satellite)
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-prompt rounded-lg transition-colors cursor-pointer"
            :class="activeCategory === 'telemetry' ? 'bg-[#1a4175] text-white font-bold border border-cyan-400/60 shadow-xs' : 'text-sky-200 hover:text-white'"
            @click="activeCategory = 'telemetry'"
          >
            กราฟโทรมาตร (Telemetry)
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-300" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาวิดเจ็ต..."
            class="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-sky-600/40 bg-[#0e2b50] text-white placeholder-sky-300/60 font-prompt focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <!-- Widgets List (Scrollable) -->
      <div class="p-6 overflow-y-auto space-y-3 flex-1">
        <div
          v-for="widget in filteredWidgets"
          :key="widget.id"
          class="p-4 rounded-2xl border transition-all flex items-start justify-between gap-4"
          :class="isWidgetActive(widget.id) ? 'bg-[#1a4175] border-sky-400/60 shadow-md' : 'bg-[#133560]/80 border-sky-600/30 opacity-90 hover:opacity-100'"
        >
          <div class="flex items-start gap-3.5">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5"
              :class="[widget.bgColor, widget.borderColor, widget.color]"
            >
              <component :is="widget.icon" class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm sm:text-base font-bold font-prompt text-white">
                  {{ widget.title }}
                </h4>
                <span
                  class="text-xs px-2.5 py-0.5 rounded-full font-prompt font-bold uppercase tracking-wider"
                  :class="widget.category === 'satellite' ? 'bg-sky-950/90 text-sky-300 border border-sky-600' : 'bg-[#133560] text-sky-200 border border-sky-500/40'"
                >
                  {{ widget.category }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-sky-100 font-prompt mt-1 leading-relaxed font-medium">
                {{ widget.description }}
              </p>
            </div>
          </div>

          <!-- Actions: Add duplicates / status / remove -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Counter Badge -->
            <span
              v-if="getWidgetCount(widget.id) > 0"
              class="px-2.5 py-1 rounded-lg text-xs font-bold font-prompt bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-xs whitespace-nowrap"
            >
              {{ getWidgetCount(widget.id) }} ชิ้น
            </span>

            <!-- Add Instance Button (Can be clicked repeatedly to spawn duplicate instances) -->
            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold font-prompt flex items-center gap-1.5 transition-all cursor-pointer bg-[#0e2b50] hover:bg-[#1a4175] text-cyan-200 hover:text-white border border-sky-500/40 hover:border-cyan-400 shadow-xs whitespace-nowrap"
              title="เพิ่มวิดเจ็ตนี้ลงบนกระดาน (สามารถเพิ่มซ้ำหลายชิ้นเพื่อดูคนละข้อมูลได้)"
              @click="emit('addWidget', widget.id)"
            >
              <Plus class="w-4 h-4 text-cyan-400" />
              <span>{{ getWidgetCount(widget.id) > 0 ? '+ เพิ่มอีกชิ้น' : '+ เพิ่มลงจอ' }}</span>
            </button>

            <!-- Toggle/Remove All of this type -->
            <button
              v-if="getWidgetCount(widget.id) > 0"
              type="button"
              class="p-2 rounded-xl text-xs font-prompt flex items-center justify-center transition-all cursor-pointer bg-rose-950/40 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60"
              title="ลบวิดเจ็ตประเภทนี้ออกจากกระดาน"
              @click="emit('toggleWidget', widget.id)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="px-6 py-4 bg-[#0e2b50] border-t border-sky-700/50 flex items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs sm:text-sm text-sky-200 hover:text-white font-prompt font-semibold transition-colors cursor-pointer"
          @click="emit('resetLayout')"
        >
          <RotateCcw class="w-4 h-4" />
          <span>คืนค่าเริ่มต้นแดชบอร์ด</span>
        </button>

        <button
          type="button"
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold font-prompt border border-sky-400/60 shadow-md shadow-sky-500/30 transition-all cursor-pointer"
          @click="emit('update:modelValue', false)"
        >
          เรียบร้อย
        </button>
      </div>
    </div>
  </div>
</template>
