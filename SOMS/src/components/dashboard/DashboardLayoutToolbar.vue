<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DashboardLayoutToolbar.vue
 * วัตถุประสงค์: แถบเครื่องมือควบคุมการปรับแต่งเลย์เอาต์แดชบอร์ด (Layout Toolbar)
 * แสดงเฉพาะขณะเปิดโหมดปรับแต่ง (Edit Mode) เพื่อให้เจ้าหน้าที่:
 * - บันทึก, ยกเลิก, หรือรีเซ็ตเลย์เอาต์
 * - เปิดคลังวิดเจ็ต (Widget Library)
 * - จัดเรียงอัตโนมัติ (Auto Arrange)
 * - ปรับแต่งความทึบแสง (Opacity), ล็อกตำแหน่ง (Lock), ลำดับเลเยอร์ (Layer)
 * - เปิด/ปิดการยึดเส้นกริด (Snap to Grid 16px)
 * ============================================================================
 */
import {
  SlidersHorizontal,
  Plus,
  Save,
  RotateCcw,
  X,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Grid,
  Sparkles,
  LayoutGrid
} from 'lucide-vue-next'

const props = defineProps({
  selectedWidget: {
    type: Object,
    default: null
  },
  snapToGrid: {
    type: Boolean,
    default: true
  },
  isSaving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:snapToGrid',
  'updateOpacity',
  'save',
  'cancel',
  'reset',
  'autoArrange',
  'fitFullWidth',
  'openLibrary',
  'bringForward',
  'sendBackward',
  'toggleLock',
  'removeWidget'
])

const handleOpacityChange = (e) => {
  const val = Number(e.target.value)
  emit('updateOpacity', val)
}
</script>

<template>
  <div class="sticky top-[68px] z-40 mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d264c]/95 via-[#0a1e3b]/95 to-[#07162c]/95 border border-sky-400/40 shadow-2xl shadow-sky-950/80 backdrop-blur-md font-prompt text-slate-200">
    <!-- Main Toolbar Row -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-sky-500/20">
      <!-- Left: Title & Hint -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-cyan-300 shrink-0">
          <SlidersHorizontal class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-white tracking-wide">
              โหมดปรับแต่งหน้าจอ (Edit Layout Mode)
            </h3>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/25 border border-sky-400/50 text-cyan-300">
              ACTIVE
            </span>
          </div>
          <p class="text-sm font-semibold text-cyan-200 mt-0.5">
            คลิกค้างที่หัวการ์ดเพื่อย้ายตำแหน่ง • ลากมุมล่างขวาเพื่อปรับขนาด • รองรับการยึดเส้นกริด Snap
          </p>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Add Widget from Library -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/50 hover:bg-sky-900 text-cyan-200 hover:text-white text-sm font-bold transition-colors shadow-xs"
          @click="emit('openLibrary')"
        >
          <Plus class="w-4 h-4 text-cyan-300" />
          <span>+ คลังวิดเจ็ต</span>
        </button>

        <!-- Fit Full Width -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-400/40 hover:bg-sky-900 text-sky-200 hover:text-white text-sm font-bold transition-colors shadow-xs"
          title="ขยายวิดเจ็ตให้เต็มพื้นที่ขอบจออัตโนมัติ (ไม่เหลือช่องว่างด้านขวา)"
          @click="emit('fitFullWidth')"
        >
          <Maximize2 class="w-4 h-4 text-cyan-300" />
          <span>ขยายเต็มพื้นที่</span>
        </button>

        <!-- Auto Arrange / Compact -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-500/40 hover:bg-sky-900 text-white text-sm font-bold transition-colors"
          title="จัดเรียงวิดเจ็ตให้กระชับและลบช่องว่างแนวตั้งโดยอัตโนมัติ"
          @click="emit('autoArrange')"
        >
          <Sparkles class="w-4 h-4 text-amber-300" />
          <span>จัดเรียงอัตโนมัติ</span>
        </button>

        <!-- Reset Default -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-600 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-bold transition-colors"
          title="คืนค่าเลย์เอาต์เริ่มต้นของระบบ"
          @click="emit('reset')"
        >
          <RotateCcw class="w-4 h-4 text-sky-300" />
          <span>รีเซ็ตค่าเริ่มต้น</span>
        </button>

        <!-- Cancel -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-600 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-bold transition-colors"
          title="ยกเลิกการแก้ไขและคืนค่าเดิม"
          @click="emit('cancel')"
        >
          <X class="w-4 h-4" />
          <span>ยกเลิก</span>
        </button>

        <!-- Save Layout Button -->
        <button
          type="button"
          :disabled="isSaving"
          class="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-extrabold shadow-md shadow-sky-500/30 transition-all disabled:opacity-50"
          @click="emit('save')"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSaving ? 'กำลังบันทึก...' : '💾 บันทึกเลย์เอาต์' }}</span>
        </button>
      </div>
    </div>

    <!-- Inspector Row: Controls for Selected Widget -->
    <div class="pt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div v-if="selectedWidget" class="flex flex-wrap items-center gap-3">
        <!-- Selected Widget Name -->
        <div class="flex items-center gap-1.5 font-bold text-white">
          <span class="text-cyan-300">วิดเจ็ตที่เลือก:</span>
          <span class="px-2.5 py-0.5 rounded bg-sky-950 border border-sky-400/40 text-white">
            {{ selectedWidget.title }}
          </span>
          <span class="text-xs font-mono font-bold text-sky-200">
            ({{ selectedWidget.width }} × {{ selectedWidget.height }} px)
          </span>
        </div>

        <!-- Lock / Unlock Position -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors font-bold text-xs sm:text-sm"
          :class="selectedWidget.locked
            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
            : 'bg-slate-900/80 border-sky-500/40 text-slate-200 hover:text-white'"
          @click="emit('toggleLock', selectedWidget.id)"
        >
          <component :is="selectedWidget.locked ? Lock : Unlock" class="w-3.5 h-3.5" />
          <span>{{ selectedWidget.locked ? 'ปลดล็อกตำแหน่ง' : 'ล็อกตำแหน่ง' }}</span>
        </button>

        <!-- Layer Ordering (Z-Index) -->
        <div class="flex items-center gap-1 bg-slate-900/80 border border-sky-500/30 rounded-lg p-1">
          <button
            type="button"
            class="px-2 py-1 rounded hover:bg-sky-800/60 text-slate-200 hover:text-white transition-colors"
            title="นำมาไว้หน้าสุด"
            @click="emit('bringForward', selectedWidget.id)"
          >
            <ArrowUp class="w-3.5 h-3.5" />
          </button>
          <span class="text-xs font-mono font-bold text-sky-200 px-1.5">ลำดับ</span>
          <button
            type="button"
            class="px-2 py-1 rounded hover:bg-sky-800/60 text-slate-200 hover:text-white transition-colors"
            title="ส่งไปหลังสุด"
            @click="emit('sendBackward', selectedWidget.id)"
          >
            <ArrowDown class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Background Opacity Slider -->
        <div class="flex items-center gap-2 bg-slate-900/80 border border-sky-500/30 rounded-lg px-3 py-1.5">
          <span class="text-xs sm:text-sm font-bold text-white">ความทึบแสง:</span>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            :value="selectedWidget.backgroundOpacity ?? 95"
            class="w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            @input="handleOpacityChange"
          />
          <span class="text-xs font-mono font-bold text-cyan-200 w-9">
            {{ selectedWidget.backgroundOpacity ?? 95 }}%
          </span>
        </div>

        <!-- Remove Widget Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-200 hover:text-white text-xs sm:text-sm font-bold transition-colors"
          title="ซ่อนวิดเจ็ตนี้จากหน้าจอ"
          @click="emit('removeWidget', selectedWidget.id)"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>นำออกจากหน้าจอ</span>
        </button>
      </div>

      <!-- If no widget selected -->
      <div v-else class="text-sm text-cyan-200/80 font-medium flex items-center gap-1.5">
        <span>คลิกที่การ์ดวิดเจ็ตเพื่อเลือกและปรับแต่งความทึบแสง ลำดับเลเยอร์ หรือล็อกตำแหน่ง</span>
      </div>

      <!-- Snap to Grid Toggle -->
      <label class="flex items-center gap-2 cursor-pointer select-none ml-auto text-sm font-bold text-white hover:text-cyan-200">
        <input
          type="checkbox"
          :checked="snapToGrid"
          class="rounded accent-sky-400 w-4 h-4"
          @change="emit('update:snapToGrid', $event.target.checked)"
        />
        <Grid class="w-4 h-4 text-cyan-300" />
        <span>ยึดเส้นกริด Snap (16px)</span>
      </label>
    </div>
  </div>
</template>
