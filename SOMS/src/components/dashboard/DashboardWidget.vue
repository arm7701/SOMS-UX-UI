<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/DashboardWidget.vue
 * วัตถุประสงค์: กรอบวิดเจ็ตแบบ Drag & Drop และ Resize ได้อย่างอิสระบนสเตจ
 * สอดคล้องกับ DashboardWidget ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, computed, onUnmounted, watch } from 'vue'
import {
  GripVertical,
  Lock,
  ChevronDown,
  CornerDownRight,
  Maximize2,
  Activity,
  Radio,
  Orbit,
  Timer,
  Compass,
  Layers,
  Sun,
  Clock,
  ShieldCheck,
  LineChart
} from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  satelliteColor: {
    type: String,
    default: ''
  },
  editing: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  stageWidth: {
    type: Number,
    default: 1280
  },
  snap: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['change', 'select', 'resizeEnd', 'maximize'])

// ข้อมูลจำแนกหมวดหมู่และสีเด่นชัดประจำวิดเจ็ต (High-Visibility Thematic Category)
const categoryMeta = computed(() => {
  const base = (props.item.baseType || props.item.id.split('-instance-')[0] || '').toLowerCase()
  if (base === 'kpi-overview') {
    return {
      tag: 'KPI OVERVIEW',
      color: '#10b981',
      icon: Activity,
      isLive: true
    }
  }
  if (base === 'satellite-summary') {
    return {
      tag: 'FLEET TELEMETRY',
      color: '#38bdf8',
      icon: Radio,
      isLive: true
    }
  }
  if (base === 'orbit-tracker') {
    return {
      tag: 'ORBIT TRACKER',
      color: '#06b6d4',
      icon: Orbit,
      isLive: true
    }
  }
  if (base === 'pass-countdown') {
    return {
      tag: 'AOS COUNTDOWN',
      color: '#f59e0b',
      icon: Timer,
      isLive: true
    }
  }
  if (base === 'altitude') {
    return {
      tag: 'ALTITUDE TLE',
      color: '#34d399',
      icon: Compass,
      isLive: false
    }
  }
  if (base === 'attitude') {
    return {
      tag: 'ATTITUDE',
      color: '#fbbf24',
      icon: Layers,
      isLive: false
    }
  }
  if (base === 'weather') {
    return {
      tag: 'SPACE WEATHER',
      color: '#f97316',
      icon: Sun,
      isLive: true
    }
  }
  if (base === 'passes') {
    return {
      tag: 'PASS SCHEDULE',
      color: '#3b82f6',
      icon: Clock,
      isLive: false
    }
  }
  if (base === 'operators') {
    return {
      tag: 'DUTY ROSTER',
      color: '#a855f7',
      icon: ShieldCheck,
      isLive: false
    }
  }
  if (base.startsWith('chart-')) {
    return {
      tag: 'TELEMETRY GRAPH',
      color: '#818cf8',
      icon: LineChart,
      isLive: true
    }
  }
  return {
    tag: 'SYSTEM WIDGET',
    color: props.satelliteColor || '#38bdf8',
    icon: Orbit,
    isLive: false
  }
})

const isInteracting = ref(false)
const previewItem = ref(null)

let activePointer = null
let startPos = { x: 0, y: 0, scrollY: 0 }
let initialItem = null
let interactKind = null // 'move' | 'resize-x' | 'resize-y' | 'resize'

const roundVal = (v) => (props.snap ? Math.round(v / 8) * 8 : v)
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const calculateTransform = (item, kind, dx, dy, stageW) => {
  if (item.locked) return { ...item }

  if (kind === 'move') {
    const maxX = Math.max(0, stageW - item.width)
    return {
      ...item,
      x: clamp(roundVal(item.x + dx), 0, maxX),
      y: clamp(roundVal(item.y + dy), 0, 10000 - item.height)
    }
  }

  const minW = item.minWidth || 280
  const minH = item.minHeight || 160
  const maxW = stageW - item.x

  return {
    ...item,
    width: kind === 'resize-y' ? item.width : clamp(roundVal(item.width + dx), minW, maxW),
    height: kind === 'resize-x' ? item.height : clamp(roundVal(item.height + dy), minH, 1600)
  }
}

const onPointerMove = (e) => {
  if (!activePointer || e.pointerId !== activePointer.id) return
  const dx = e.clientX - startPos.x
  const dy = e.clientY - startPos.y + (window.scrollY - startPos.scrollY)

  previewItem.value = calculateTransform(initialItem, interactKind, dx, dy, props.stageWidth)
}

const stopInteraction = (commit = true) => {
  if (!activePointer) return
  const { target, id } = activePointer
  activePointer = null

  target.removeEventListener('pointermove', onPointerMove)
  target.removeEventListener('pointerup', onPointerUp)
  target.removeEventListener('pointercancel', onPointerCancel)
  target.removeEventListener('lostpointercapture', onPointerCancel)
  window.removeEventListener('keydown', onKeyDown)

  try {
    if (target.hasPointerCapture?.(id)) {
      target.releasePointerCapture(id)
    }
  } catch (e) {}

  if (commit && previewItem.value) {
    emit('change', { ...previewItem.value })
    emit('resizeEnd')
  }

  previewItem.value = null
  isInteracting.value = false
}

const onPointerUp = (e) => {
  if (activePointer && e.pointerId === activePointer.id) {
    stopInteraction(true)
  }
}

const onPointerCancel = () => {
  stopInteraction(false)
}

const onKeyDown = (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    stopInteraction(false)
  }
}

const startDrag = (e, kind) => {
  if (!props.editing || props.compact || props.item.locked || e.button !== 0 || activePointer) return
  const target = e.currentTarget
  if (!(target instanceof HTMLElement)) return

  e.preventDefault()
  emit('select', props.item.id)

  startPos = { x: e.clientX, y: e.clientY, scrollY: window.scrollY }
  initialItem = { ...props.item }
  interactKind = kind
  activePointer = { id: e.pointerId, target }
  isInteracting.value = true
  previewItem.value = { ...props.item }

  target.setPointerCapture(e.pointerId)
  target.addEventListener('pointermove', onPointerMove)
  target.addEventListener('pointerup', onPointerUp)
  target.addEventListener('pointercancel', onPointerCancel)
  target.addEventListener('lostpointercapture', onPointerCancel)
  window.addEventListener('keydown', onKeyDown)
}

onUnmounted(() => {
  stopInteraction(false)
})

const currentItem = computed(() => previewItem.value || props.item)

const widgetStyle = computed(() => {
  if (props.compact) {
    return {
      width: '100%',
      marginBottom: '1.25rem',
      '--widget-background-opacity': String((props.item.backgroundOpacity ?? 92) / 100),
      '--widget-border-opacity': String((props.item.borderOpacity ?? 100) / 100)
    }
  }

  const it = currentItem.value
  return {
    transform: `translate3d(${it.x}px, ${it.y}px, 0)`,
    width: `${it.width}px`,
    height: `${it.height}px`,
    zIndex: props.selected ? 60 : (it.z || 1),
    '--widget-background-opacity': String((it.backgroundOpacity ?? 92) / 100),
    '--widget-border-opacity': String((it.borderOpacity ?? 100) / 100)
  }
})
</script>

<template>
  <section
    class="dashboard-widget select-none"
    :class="{
      'is-compact': compact,
      'is-editing': editing,
      'is-selected': editing && selected,
      'is-active': isInteracting,
      'is-locked': item.locked
    }"
    :data-widget-id="item.id"
    :style="widgetStyle"
    @click="editing && emit('select', item.id)"
  >
    <!-- Widget Header Bar (สไตล์ Military Aerospace Command Center คอนทราสต์สูง ไม่ตาลาย) -->
    <header
      class="widget-header group"
      :style="{
        '--cat-accent': categoryMeta.color
      }"
    >
      <!-- Left Category Accent Indicator (แถบไฮไลต์สีประจำหมวดหมู่ หนาเด่นชัด พร้อมเรืองแสง) -->
      <div
        class="category-accent-bar"
        :style="{
          backgroundColor: categoryMeta.color,
          boxShadow: `0 0 10px ${categoryMeta.color}`
        }"
      ></div>

      <!-- Edit Mode: Draggable Handle Button -->
      <button
        v-if="editing && !compact"
        type="button"
        class="widget-drag font-prompt"
        :aria-disabled="item.locked"
        :title="item.locked ? 'ตำแหน่งถูกล็อก' : 'คลิกลากเพื่อย้ายตำแหน่งวิดเจ็ต'"
        @pointerdown="startDrag($event, 'move')"
      >
        <GripVertical v-if="!item.locked" class="w-4 h-4 flex-shrink-0" :style="{ color: categoryMeta.color }" />
        <Lock v-else class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />

        <!-- Category Tag Badge -->
        <span
          class="category-tag-badge"
          :style="{
            color: categoryMeta.color,
            borderColor: categoryMeta.color + '70',
            backgroundColor: categoryMeta.color + '18'
          }"
        >
          {{ categoryMeta.tag }}
        </span>

        <span class="widget-header-title truncate text-sm sm:text-base font-bold text-white tracking-normal">
          {{ title }}
        </span>
        <span v-if="item.locked" class="text-xs text-amber-300 ml-auto font-mono font-bold">[LOCKED]</span>
      </button>

      <!-- Normal Mode: High-Visibility Command Header -->
      <div v-else class="flex items-center justify-between gap-3 w-full min-w-0">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <!-- Category Icon & Live Status Pulse -->
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs"
            :style="{
              backgroundColor: categoryMeta.color + '22',
              border: `1px solid ${categoryMeta.color}60`
            }"
          >
            <component
              :is="categoryMeta.icon"
              class="w-3.5 h-3.5"
              :style="{ color: categoryMeta.color }"
              :class="categoryMeta.isLive ? 'animate-pulse' : ''"
            />
          </div>

          <!-- Category Pill Tag (ช่วยให้มองหาและแยกหมวดหมู่ได้ทันที ไม่ตาลาย) -->
          <span
            class="category-tag-badge hidden sm:inline-block"
            :style="{
              color: categoryMeta.color,
              borderColor: categoryMeta.color + '70',
              backgroundColor: categoryMeta.color + '18'
            }"
          >
            {{ categoryMeta.tag }}
          </span>

          <!-- Title (เด่นชัด สว่าง คมชัดสูง ไม่กลืนพื้นหลัง) -->
          <h6 class="widget-header-title text-sm sm:text-base font-bold font-prompt text-white tracking-normal truncate drop-shadow-sm">
            {{ title }}
          </h6>

          <!-- Realtime Status Indicator -->
          <span
            v-if="categoryMeta.isLive"
            class="w-2 h-2 rounded-full flex-shrink-0 animate-ping"
            :style="{ backgroundColor: categoryMeta.color }"
            title="Real-time Active Stream"
          ></span>
        </div>

        <!-- Header Controls (ปุ่มควบคุมด่วนบนหัวการ์ด สะดวกใช้งาน) -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <Lock v-if="item.locked" class="w-3.5 h-3.5 text-amber-400" title="ตำแหน่งถูกล็อก" />

          <!-- Maximize to Fullscreen Modal Button -->
          <button
            type="button"
            class="header-action-btn"
            title="ขยายดูแบบเต็มจอ (Maximize to Fullscreen)"
            @click.stop="emit('maximize', item)"
          >
            <Maximize2 class="w-3.5 h-3.5 text-slate-300 hover:text-cyan-300 transition-colors" />
          </button>
        </div>
      </div>
    </header>

    <!-- Widget Content Stage -->
    <div
      class="widget-content"
      :style="{ opacity: (item.contentOpacity ?? 100) / 100 }"
    >
      <slot></slot>
    </div>

    <!-- Edit Mode Resize Handles (E, S, SE) -->
    <template v-if="editing && !compact && !item.locked">
      <!-- East Handle (ขยายความกว้าง) -->
      <button
        type="button"
        class="widget-resize widget-resize-e"
        title="ลากเพื่อปรับความกว้าง"
        @pointerdown="startDrag($event, 'resize-x')"
      ></button>

      <!-- South Handle (ขยายความสูง) -->
      <button
        type="button"
        class="widget-resize widget-resize-s"
        title="ลากเพื่อปรับความสูง"
        @pointerdown="startDrag($event, 'resize-y')"
      ></button>

      <!-- South-East Handle (ขยายทั้งสองด้านพร้อมกัน) -->
      <button
        type="button"
        class="widget-resize widget-resize-se"
        title="ลากเพื่อปรับขนาดความกว้างและความสูงพร้อมกัน"
        @pointerdown="startDrag($event, 'resize')"
      >
        <svg class="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </button>
    </template>
  </section>
</template>

<style scoped>
.dashboard-widget {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid rgba(71, 95, 130, var(--widget-border-opacity, 0.8));
  border-top: 1px solid rgba(148, 190, 235, 0.4);
  background: linear-gradient(180deg, rgba(22, 36, 58, var(--widget-background-opacity, 0.96)) 0%, rgba(15, 24, 40, var(--widget-background-opacity, 0.96)) 100%);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(16px);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  overflow: hidden;
}

.dashboard-widget:hover {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.2);
}

.dashboard-widget.is-compact {
  position: relative !important;
  transform: none !important;
  height: auto !important;
}

.dashboard-widget.is-editing {
  user-select: none;
}

.dashboard-widget.is-selected {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.45);
}

.dashboard-widget.is-active {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.4);
  z-index: 99 !important;
}

.widget-header {
  position: relative;
  flex: none;
  min-height: 44px;
  padding: 8px 14px 8px 18px;
  background: linear-gradient(90deg, #16263e 0%, #1c2f4d 100%);
  border-bottom: 1px solid rgba(65, 88, 120, var(--widget-border-opacity, 0.8));
  display: flex;
  align-items: center;
}

/* 4px Glowing Left Category Accent Bar */
.category-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: width 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-widget:hover .category-accent-bar {
  width: 5px;
}

/* Category Tag Badge */
.category-tag-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2.5px 8px;
  border-radius: 4px;
  border: 1px solid;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Header Action Buttons (Maximize, Lock, etc.) */
.header-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(36, 52, 78, 0.7);
  border: 1px solid rgba(148, 175, 210, 0.3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-action-btn:hover {
  background: rgba(56, 80, 115, 0.95);
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.widget-drag {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0;
  color: inherit;
  cursor: grab;
  touch-action: none;
}

.is-active .widget-drag {
  cursor: grabbing;
}

.widget-drag[aria-disabled="true"] {
  cursor: default;
}

.widget-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Resize Handles */
.widget-resize {
  position: absolute;
  background: transparent;
  border: none;
  touch-action: none;
  z-index: 20;
}

.widget-resize-e {
  top: 40px;
  bottom: 24px;
  right: -5px;
  width: 10px;
  cursor: ew-resize;
}

.widget-resize-e:hover {
  background: rgba(56, 189, 248, 0.3);
}

.widget-resize-s {
  left: 10px;
  right: 24px;
  bottom: -5px;
  height: 10px;
  cursor: ns-resize;
}

.widget-resize-s:hover {
  background: rgba(56, 189, 248, 0.3);
}

.widget-resize-se {
  bottom: 0;
  right: 0;
  width: 26px;
  height: 26px;
  cursor: nwse-resize;
  background: #19263a;
  border-top-left-radius: 8px;
  border-top: 1px solid #3b516f;
  border-left: 1px solid #3b516f;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.widget-resize-se:hover {
  background: #223552;
}
</style>
