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
import { GripVertical, Lock, ChevronDown, CornerDownRight } from 'lucide-vue-next'

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

const emit = defineEmits(['change', 'select', 'resizeEnd'])

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
    <!-- Widget Header Bar -->
    <header class="widget-header">
      <!-- Edit Mode: Draggable Handle Button -->
      <button
        v-if="editing && !compact"
        type="button"
        class="widget-drag font-prompt"
        :aria-disabled="item.locked"
        :title="item.locked ? 'ตำแหน่งถูกล็อก' : 'คลิกลากเพื่อย้ายตำแหน่งวิดเจ็ต'"
        @pointerdown="startDrag($event, 'move')"
      >
        <GripVertical v-if="!item.locked" class="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <Lock v-else class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span
          v-if="satelliteColor"
          class="w-2 h-2 rounded-full flex-shrink-0"
          :style="{ backgroundColor: satelliteColor }"
        ></span>
        <span class="truncate text-sm font-bold text-white tracking-wide">{{ title }}</span>
        <span v-if="item.locked" class="text-xs text-amber-300 ml-auto font-mono">[LOCKED]</span>
      </button>

      <!-- Normal Mode: Static Header with Title -->
      <div v-else class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="satelliteColor"
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ backgroundColor: satelliteColor }"
          ></span>
          <h6 class="text-sm font-bold font-prompt text-white tracking-wide truncate">
            {{ title }}
          </h6>
        </div>
        <Lock v-if="item.locked" class="w-3.5 h-3.5 text-amber-400" title="ตำแหน่งถูกล็อก" />
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
  border: 1px solid rgba(51, 65, 85, var(--widget-border-opacity, 1));
  background: rgba(16, 20, 27, var(--widget-background-opacity, 0.94));
  box-shadow: 0 4px 20px rgba(0, 0, 0, calc(0.35 * var(--widget-background-opacity, 0.94)));
  backdrop-filter: blur(8px);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  overflow: hidden;
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
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.35);
}

.dashboard-widget.is-active {
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.4);
  z-index: 99 !important;
}

.widget-header {
  flex: none;
  min-height: 40px;
  padding: 8px 14px;
  background: #0d1117;
  border-bottom: 1px solid rgba(51, 65, 85, var(--widget-border-opacity, 1));
  display: flex;
  align-items: center;
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
  background: #151c27;
  border-top-left-radius: 8px;
  border-top: 1px solid #334155;
  border-left: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.widget-resize-se:hover {
  background: #1e293b;
}
</style>
