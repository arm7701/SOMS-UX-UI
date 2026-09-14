<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/StatusBadge.vue
 * วัตถุประสงค์: แสดงป้ายกำกับสถานะ (Status Chip/Badge) โทนสีสุภาพ ไม่แสบตา
 * เช่น Active, Normal, Warning, Abort, DayPass, NightPass
 * ============================================================================
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  status: {
    type: String,
    default: 'neutral',
    // 'active' | 'inactive' | 'normal' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'
  },
  dot: { type: Boolean, default: true },
  size: { type: String, default: 'md' } // 'sm' | 'md' | 'lg'
})

const badgeConfig = computed(() => {
  const norm = (props.status || '').toLowerCase()
  
  if (['active', 'normal', 'success', 'เรียบร้อย'].includes(norm)) {
    return {
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      dotClasses: 'bg-emerald-500'
    }
  }
  if (['warning', 'moderate', 'ดำเนินการต่อ', 'pending'].includes(norm)) {
    return {
      classes: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
      dotClasses: 'bg-amber-500'
    }
  }
  if (['danger', 'error', 'abort', 'notactive', 'ไม่เรียบร้อย', 'extreme', 'severe'].includes(norm)) {
    return {
      classes: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
      dotClasses: 'bg-rose-500'
    }
  }
  if (['info', 'day', 'daypass'].includes(norm)) {
    return {
      classes: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
      dotClasses: 'bg-blue-500'
    }
  }
  if (['night', 'nightpass', 'purple'].includes(norm)) {
    return {
      classes: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
      dotClasses: 'bg-purple-500'
    }
  }
  return {
    classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-space-800 dark:text-slate-300 dark:border-space-700',
    dotClasses: 'bg-slate-400'
  }
})

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'px-2 py-0.5 text-xs'
  if (props.size === 'lg') return 'px-3.5 py-1 text-sm'
  return 'px-2.5 py-0.5 text-xs font-medium'
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full border transition-colors shadow-2xs" :class="[badgeConfig.classes, sizeClasses]">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" :class="badgeConfig.dotClasses"></span>
    <span>{{ label }}</span>
  </span>
</template>
