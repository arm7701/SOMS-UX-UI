<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/StatusBadge.vue
 * วัตถุประสงค์: แสดงป้ายกำกับสถานะ (Status Chip/Badge) ธีมดำเทาไททาเนียม
 * คอนทราสต์ชัดเจนบนพื้นผิวสีเข้ม (High Contrast on Dark Surfaces)
 * ============================================================================
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  status: {
    type: String,
    default: 'neutral',
  },
  dot: { type: Boolean, default: true },
  size: { type: String, default: 'md' } // 'sm' | 'md' | 'lg'
})

const badgeConfig = computed(() => {
  const norm = (props.status || '').toLowerCase()

  if (['active', 'normal', 'success', 'เรียบร้อย'].includes(norm)) {
    return {
      classes: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
      dotClasses: 'bg-emerald-400'
    }
  }
  if (['warning', 'moderate', 'ดำเนินการต่อ', 'pending'].includes(norm)) {
    return {
      classes: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
      dotClasses: 'bg-amber-400'
    }
  }
  if (['danger', 'error', 'abort', 'notactive', 'ไม่เรียบร้อย', 'extreme', 'severe'].includes(norm)) {
    return {
      classes: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
      dotClasses: 'bg-rose-400'
    }
  }
  if (['info', 'day', 'daypass'].includes(norm)) {
    return {
      classes: 'bg-zinc-800 text-zinc-100 border-zinc-600',
      dotClasses: 'bg-zinc-300'
    }
  }
  if (['night', 'nightpass', 'purple'].includes(norm)) {
    return {
      classes: 'bg-purple-950/60 text-purple-300 border-purple-800/80',
      dotClasses: 'bg-purple-400'
    }
  }
  return {
    classes: 'bg-space-800 text-slate-200 border-space-700',
    dotClasses: 'bg-zinc-400'
  }
})

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'px-2.5 py-0.5 text-xs font-bold'
  if (props.size === 'lg') return 'px-4 py-1.5 text-sm font-bold'
  return 'px-3 py-1 text-xs sm:text-sm font-bold'
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full border transition-colors shadow-2xs font-prompt" :class="[badgeConfig.classes, sizeClasses]">
    <span v-if="dot" class="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" :class="badgeConfig.dotClasses"></span>
    <span class="font-bold tracking-tight">{{ label }}</span>
  </span>
</template>
