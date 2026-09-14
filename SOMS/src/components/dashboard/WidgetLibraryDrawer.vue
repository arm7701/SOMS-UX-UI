<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/WidgetLibraryDrawer.vue
 * วัตถุประสงค์: สไลด์ดาวเวอร์คลังวิดเจ็ต (Widget Library Slide-over Panel)
 * ช่วยให้เจ้าหน้าที่สามารถเลือก เพิ่ม หรือซ่อนวิดเจ็ตบนแดชบอร์ดได้อย่างอิสระ
 * โดยไม่ทับซ้อนหน้าจอเดิมเหมือนดรอปดาวน์แบบเดิม
 * ============================================================================
 */
import { ref, computed } from 'vue'
import {
  X,
  Plus,
  Trash2,
  Eye,
  Check,
  Search,
  LayoutGrid,
  Globe2,
  Clock,
  BarChart3,
  Sun,
  Calendar,
  Orbit,
  Users,
  LineChart,
  TrendingUp,
  Zap,
  Compass,
  Layers,
  Activity,
  ShieldCheck,
  Gauge,
  Timer,
  AlertTriangle
} from 'lucide-vue-next'

const iconMap = {
  Globe2,
  Clock,
  BarChart3,
  Sun,
  Calendar,
  Orbit,
  Users,
  LineChart,
  TrendingUp,
  Zap,
  Compass,
  Layers,
  Activity,
  ShieldCheck,
  Gauge,
  Timer,
  AlertTriangle
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  catalog: {
    type: Array,
    required: true
  },
  activeWidgets: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'addWidget', 'removeWidget', 'locateWidget'])

const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = [
  { id: 'all', label: 'ทั้งหมด (All)' },
  { id: 'overview', label: 'ภาพรวม & KPI' },
  { id: 'operations', label: 'การปฏิบัติการ & วงโคจร' },
  { id: 'telemetry', label: 'กราฟโทรมาตร (Telemetry)' }
]

const filteredCatalog = computed(() => {
  return props.catalog.filter(item => {
    // กรองตามหมวดหมู่
    if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
      return false
    }
    // กรองตามคำค้นหา
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q))
      )
    }
    return true
  })
})

const isWidgetActive = (typeId, id) => {
  return props.activeWidgets.some(w => !w.hidden && (w.id === id || w.typeId === typeId))
}

const getActiveWidgetInstance = (typeId, id) => {
  return props.activeWidgets.find(w => !w.hidden && (w.id === id || w.typeId === typeId))
}

const close = () => {
  emit('update:modelValue', false)
}

const handleAdd = (item) => {
  emit('addWidget', item)
}

const handleRemove = (widgetId) => {
  emit('removeWidget', widgetId)
}

const handleLocate = (widgetId) => {
  emit('locateWidget', widgetId)
  close()
}
</script>

<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50"
        @click="close"
      />
    </Transition>

    <!-- Slide-over Drawer Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
        class="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-gradient-to-b from-[#0e274a] via-[#091b34] to-[#061224] border-l border-sky-500/30 shadow-2xl shadow-sky-950/80 z-50 flex flex-col font-prompt text-slate-200"
      >
        <!-- Drawer Header -->
        <div class="px-5 py-4 border-b border-sky-500/30 bg-[#08182e]/90 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-cyan-300">
              <LayoutGrid class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white tracking-wide">คลังวิดเจ็ต (Widget Library)</h2>
              <p class="text-xs font-semibold text-cyan-200">เลือกและจัดวางวิดเจ็ตลงบนหน้าจอแดชบอร์ด</p>
            </div>
          </div>

          <button
            type="button"
            class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-sky-900/60 transition-colors"
            title="ปิดหน้าต่างคลังวิดเจ็ต"
            @click="close"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Search & Filter Controls -->
        <div class="p-4 border-b border-sky-500/20 space-y-3 bg-[#0a1f3c]/70 shrink-0">
          <!-- Search Box -->
          <div class="relative">
            <Search class="w-4 h-4 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อวิดเจ็ต หรือคำอธิบาย..."
              class="w-full pl-9 pr-8 py-2.5 bg-[#06152a] border border-sky-500/40 rounded-xl text-sm text-white placeholder-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white text-sm"
              @click="searchQuery = ''"
            >
              ✕
            </button>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              class="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all font-bold"
              :class="selectedCategory === cat.id
                ? 'bg-sky-500 text-slate-950 font-bold shadow-xs shadow-sky-500/30'
                : 'bg-sky-950/80 text-sky-200 hover:bg-sky-900 hover:text-white border border-sky-500/30'"
              @click="selectedCategory = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Widgets List (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div
            v-for="item in filteredCatalog"
            :key="item.typeId"
            class="p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3"
            :class="isWidgetActive(item.typeId, item.id)
              ? 'bg-sky-950/60 border-sky-500/40 hover:border-cyan-400/60'
              : 'bg-[#091b34]/90 border-slate-700/80 hover:border-sky-500/60'"
          >
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/40 text-cyan-300 shrink-0">
                  <component :is="iconMap[item.icon] || LayoutGrid" class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm sm:text-base font-bold text-white truncate">{{ item.title }}</h3>
                  </div>
                  <span class="inline-block px-2 py-0.5 rounded text-xs bg-sky-500/20 text-cyan-200 font-mono font-bold mt-0.5 border border-sky-400/30">
                    {{ item.categoryName || item.category }}
                  </span>
                </div>
              </div>

              <!-- Status Badge -->
              <span
                v-if="isWidgetActive(item.typeId, item.id)"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shrink-0"
              >
                <Check class="w-3.5 h-3.5" /> แสดงอยู่
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
              {{ item.description }}
            </p>

            <!-- Card Footer / Action Buttons -->
            <div class="flex items-center justify-between pt-2 border-t border-sky-500/20">
              <span class="text-xs font-mono font-bold text-sky-200">
                ขนาดแนะนำ: {{ item.defaultWidth }} × {{ item.defaultHeight }} px
              </span>

              <div class="flex items-center gap-2">
                <!-- If already active -->
                <template v-if="isWidgetActive(item.typeId, item.id)">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-cyan-200 hover:text-white bg-sky-900/60 hover:bg-sky-800 border border-sky-500/40 transition-colors"
                    title="เลื่อนหน้าจอไปยังตำแหน่งวิดเจ็ตนี้"
                    @click="handleLocate(getActiveWidgetInstance(item.typeId, item.id)?.id)"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>ดูตำแหน่ง</span>
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-rose-200 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 transition-colors"
                    title="นำวิดเจ็ตนี้ออกจากหน้าจอ"
                    @click="handleRemove(getActiveWidgetInstance(item.typeId, item.id)?.id)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>นำออก</span>
                  </button>
                </template>

                <!-- If not active -->
                <template v-else>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-xs shadow-sky-500/25 transition-all"
                    @click="handleAdd(item)"
                  >
                    <Plus class="w-4 h-4" />
                    <span>+ เพิ่มลงหน้าจอ</span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Empty Search State -->
          <div v-if="filteredCatalog.length === 0" class="py-12 text-center text-slate-300">
            <LayoutGrid class="w-10 h-10 text-cyan-300/50 mx-auto mb-2" />
            <p class="text-sm font-semibold">ไม่พบวิดเจ็ตที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        </div>

        <!-- Drawer Footer Note -->
        <div class="p-4 border-t border-sky-500/30 bg-[#061427] shrink-0 text-xs sm:text-sm font-semibold text-cyan-200 flex items-center justify-between">
          <span>วิดเจ็ตที่เพิ่มจะถูกจัดวางในพื้นที่ว่างถัดไปโดยอัตโนมัติ</span>
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg border border-sky-500/40 text-sm font-bold text-white hover:bg-sky-900/60 transition-colors"
            @click="close"
          >
            ปิด
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
