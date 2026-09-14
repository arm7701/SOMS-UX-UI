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
      iconBg: 'bg-space-800 text-slate-100 border border-space-700',
      value: 'text-white',
      accent: 'text-zinc-300'
    },
    blue: {
      iconBg: 'bg-zinc-800 text-slate-100 border border-zinc-700',
      value: 'text-white',
      accent: 'text-zinc-200'
    },
    emerald: {
      iconBg: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60',
      value: 'text-white',
      accent: 'text-emerald-400'
    },
    amber: {
      iconBg: 'bg-amber-950/60 text-amber-300 border border-amber-800/60',
      value: 'text-white',
      accent: 'text-amber-400'
    },
    purple: {
      iconBg: 'bg-purple-950/60 text-purple-300 border border-purple-800/60',
      value: 'text-white',
      accent: 'text-purple-400'
    }
  }
  return map[props.color] || map.slate
})

const badgeClasses = computed(() => {
  const map = {
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    info: 'bg-zinc-800 text-zinc-200 border-zinc-700'
  }
  return map[props.badgeType] || map.info
})
</script>

<template>
  <div class="bg-space-850 rounded-2xl p-5 border border-space-700 shadow-md hover:border-space-600 transition-all duration-200 flex flex-col justify-between">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-bold uppercase tracking-wider text-slate-200 font-prompt truncate">
          {{ title }}
        </p>
        <div class="mt-2 flex items-baseline gap-2 flex-wrap">
          <span class="text-3xl lg:text-4xl font-black tracking-tight font-mono text-white" :class="colorClasses.value">
            {{ value }}
          </span>
          <span v-if="unit" class="text-base font-bold text-slate-200 font-prompt">
            {{ unit }}
          </span>
        </div>
      </div>
      <div v-if="icon" class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" :class="colorClasses.iconBg">
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>

    <!-- รายละเอียดข้อมูลย่อย เติมเต็มพื้นที่ให้สมบูรณ์ ไม่ว่างเปล่า คอนทราสต์สูง -->
    <div v-if="$slots.default || (items && items.length)" class="mt-3.5 pt-3 border-t border-space-750/80">
      <slot>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(it, i) in items"
            :key="i"
            class="px-2.5 py-1 rounded-lg bg-[#0d1117] border border-space-600 text-xs font-prompt text-slate-100 font-semibold"
          >
            {{ it }}
          </span>
        </div>
      </slot>
    </div>

    <div v-if="subtitle || badge" class="mt-3 pt-2.5 border-t border-space-750 flex items-center justify-between text-xs gap-2">
      <span class="text-slate-200 font-medium truncate font-prompt text-xs sm:text-sm">
        {{ subtitle }}
      </span>
      <span v-if="badge" class="px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex-shrink-0" :class="badgeClasses">
        {{ badge }}
      </span>
    </div>
  </div>
</template>
