<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/StatCard.vue
 * วัตถุประสงค์: การ์ดแสดงค่าสถิติหรือ KPI สำคัญ (เช่น ความสูงดาวเทียม, จำนวนพาส)
 * ดีไซน์: สบายตา คอนทราสต์ชัดเจน การ์ดลอยเด่นไม่กลืนกับพื้นหลัง
 * ============================================================================
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: '—' },
  unit: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  badge: { type: String, default: '' },
  badgeType: { type: String, default: 'info' }, // 'success' | 'warning' | 'danger' | 'info'
  color: { type: String, default: 'blue' } // 'blue' | 'emerald' | 'amber' | 'purple' | 'slate'
})

const colorClasses = computed(() => {
  const map = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50',
      value: 'text-slate-900 dark:text-white',
      accent: 'text-blue-600 dark:text-blue-400'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
      value: 'text-slate-900 dark:text-white',
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
      value: 'text-slate-900 dark:text-white',
      accent: 'text-amber-600 dark:text-amber-400'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50',
      value: 'text-slate-900 dark:text-white',
      accent: 'text-purple-600 dark:text-purple-400'
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-space-800 dark:text-slate-300 border border-slate-200 dark:border-space-700',
      value: 'text-slate-900 dark:text-white',
      accent: 'text-slate-600 dark:text-slate-300'
    }
  }
  return map[props.color] || map.blue
})

const badgeClasses = computed(() => {
  const map = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
  }
  return map[props.badgeType] || map.info
})
</script>

<template>
  <div class="bg-white dark:bg-space-850 rounded-xl p-5 border-2 border-slate-200 dark:border-space-700 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-sky-200 dark:text-sky-200">
          {{ title }}
        </p>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono" :class="colorClasses.value">
            {{ value }}
          </span>
          <span v-if="unit" class="text-base font-bold text-sky-300 dark:text-sky-300">
            {{ unit }}
          </span>
        </div>
      </div>
      <div v-if="icon" class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="colorClasses.iconBg">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>

    <div v-if="subtitle || badge" class="mt-3 pt-3 border-t border-slate-100 dark:border-space-750 flex items-center justify-between text-sm">
      <span class="text-sm font-semibold text-sky-100 dark:text-sky-100 truncate">
        {{ subtitle }}
      </span>
      <span v-if="badge" class="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold border-2" :class="badgeClasses">
        {{ badge }}
      </span>
    </div>
  </div>
</template>
