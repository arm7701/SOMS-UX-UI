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
      iconBg: 'bg-sky-950/70 text-cyan-300 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
      value: 'text-white',
      accent: 'text-cyan-300'
    },
    emerald: {
      iconBg: 'bg-emerald-950/70 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
      value: 'text-white',
      accent: 'text-emerald-300'
    },
    amber: {
      iconBg: 'bg-amber-950/70 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
      value: 'text-white',
      accent: 'text-amber-300'
    },
    purple: {
      iconBg: 'bg-indigo-950/70 text-indigo-300 border border-indigo-400/40 shadow-[0_0_12px_rgba(129,140,248,0.2)]',
      value: 'text-white',
      accent: 'text-indigo-300'
    },
    slate: {
      iconBg: 'bg-[#061833] text-sky-200 border border-sky-500/30',
      value: 'text-white',
      accent: 'text-sky-300'
    }
  }
  return map[props.color] || map.blue
})

const badgeClasses = computed(() => {
  const map = {
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 shadow-[0_0_8px_rgba(52,211,153,0.25)]',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/70 shadow-[0_0_8px_rgba(251,191,36,0.25)]',
    danger: 'bg-red-950/80 text-red-300 border-red-500/70 shadow-[0_0_8px_rgba(248,113,113,0.25)]',
    info: 'bg-sky-950/80 text-cyan-300 border-sky-500/70 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
  }
  return map[props.badgeType] || map.info
})
</script>

<template>
  <div class="bg-[#08172f]/85 rounded-2xl p-4 sm:p-5 border border-sky-400/25 shadow-lg flex flex-col justify-between">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-sky-200">
          {{ title }}
        </p>
        <div class="mt-2 flex items-baseline gap-1.5">
          <span class="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono drop-shadow-sm" :class="colorClasses.value">
            {{ value }}
          </span>
          <span v-if="unit" class="text-base font-bold text-cyan-300">
            {{ unit }}
          </span>
        </div>
      </div>
      <div v-if="icon" class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="colorClasses.iconBg">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>

    <div v-if="subtitle || badge" class="mt-3 pt-3 border-t border-sky-500/20 flex items-center justify-between text-sm">
      <span class="text-sm font-semibold text-sky-100 truncate">
        {{ subtitle }}
      </span>
      <span v-if="badge" class="px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-bold border-2" :class="badgeClasses">
        {{ badge }}
      </span>
    </div>
  </div>
</template>
