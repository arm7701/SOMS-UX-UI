<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/StatCard.vue
 * วัตถุประสงค์: การ์ดแสดงค่าสถิติหรือ KPI สำคัญ (ธีมดำเทาไททาเนียม)
 * คอนทราสต์ชัดเจน การ์ดลอยเด่น ไม่กลืนกับพื้นหลัง ฟอนต์อ่านง่าย 100%
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
  color: { type: String, default: 'slate' }, // 'slate' | 'blue' | 'emerald' | 'amber' | 'purple'
  items: { type: Array, default: () => [] } // รายการแท็กข้อมูลย่อยแสดงเติมเต็มพื้นที่ว่าง
})

const colorClasses = computed(() => {
  const map = {
    slate: {
      iconBg: 'bg-space-800 text-sky-200 border border-sky-500/40 shadow-sm',
      value: 'text-white',
      accent: 'text-sky-300'
    },
    blue: {
      iconBg: 'bg-sky-900/60 text-sky-300 border border-sky-400/50 shadow-sm shadow-sky-950/50',
      value: 'text-white',
      accent: 'text-sky-300'
    },
    emerald: {
      iconBg: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-950/50',
      value: 'text-white',
      accent: 'text-emerald-300'
    },
    amber: {
      iconBg: 'bg-amber-950/60 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950/50',
      value: 'text-white',
      accent: 'text-amber-300'
    },
    purple: {
      iconBg: 'bg-purple-950/60 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-950/50',
      value: 'text-white',
      accent: 'text-purple-300'
    }
  }
  return map[props.color] || map.blue
})

const badgeClasses = computed(() => {
  const map = {
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-xs shadow-emerald-950/50',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-xs shadow-amber-950/50',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-500/80 shadow-xs shadow-rose-950/50',
    info: 'bg-sky-950/80 text-cyan-300 border-sky-500/80 shadow-xs shadow-cyan-950/50'
  }
  return map[props.badgeType] || map.info
})
</script>

<template>
  <div class="bg-[#133560]/95 backdrop-blur-md rounded-2xl p-5 border border-sky-600/40 shadow-lg hover:border-cyan-400/60 hover:shadow-cyan-900/25 transition-all duration-200 flex flex-col justify-between">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs sm:text-sm font-semibold uppercase tracking-wider text-sky-200 font-prompt truncate">
          {{ title }}
        </p>
        <div class="mt-2 flex items-baseline gap-2 flex-wrap">
          <span class="text-3xl lg:text-4xl font-extrabold tracking-tight font-mono text-white" :class="colorClasses.value">
            {{ value }}
          </span>
          <span v-if="unit" class="text-base font-semibold text-cyan-300 font-prompt">
            {{ unit }}
          </span>
        </div>
      </div>
      <div v-if="icon" class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" :class="colorClasses.iconBg">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>

    <!-- รายละเอียดข้อมูลย่อย เติมเต็มพื้นที่ให้สมบูรณ์ ไม่ว่างเปล่า คอนทราสต์สูง -->
    <div v-if="$slots.default || (items && items.length)" class="mt-3.5 pt-3 border-t border-sky-600/30">
      <slot>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(it, i) in items"
            :key="i"
            class="px-2.5 py-1 rounded-lg bg-[#1a4175] border border-sky-500/40 text-xs font-prompt text-sky-100 font-medium shadow-xs"
          >
            {{ it }}
          </span>
        </div>
      </slot>
    </div>

    <div v-if="subtitle || badge" class="mt-3 pt-2.5 border-t border-sky-600/30 flex items-center justify-between text-xs gap-2">
      <span class="text-sky-200 font-normal truncate font-prompt text-xs sm:text-sm">
        {{ subtitle }}
      </span>
      <span v-if="badge" class="px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex-shrink-0" :class="badgeClasses">
        {{ badge }}
      </span>
    </div>
  </div>
</template>
