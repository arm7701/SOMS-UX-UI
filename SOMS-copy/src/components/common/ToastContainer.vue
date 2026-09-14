<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/ToastContainer.vue
 * วัตถุประสงค์: แสดงกล่องข้อความแจ้งเตือน (Toast Notification) ธีมดำเทา
 * ============================================================================
 */
import { useAppStore } from '@/stores/app'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const appStore = useAppStore()

const getIcon = (type) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return AlertCircle
    case 'warning': return AlertTriangle
    default: return Info
  }
}

const getStyles = (type) => {
  switch (type) {
    case 'success':
      return 'border-emerald-800/80 bg-space-850 text-emerald-300'
    case 'error':
      return 'border-rose-800/80 bg-space-850 text-rose-300'
    case 'warning':
      return 'border-amber-800/80 bg-space-850 text-amber-300'
    default:
      return 'border-space-700 bg-space-850 text-slate-100'
  }
}

const getIconColor = (type) => {
  switch (type) {
    case 'success': return 'text-emerald-400'
    case 'error': return 'text-rose-400'
    case 'warning': return 'text-amber-400'
    default: return 'text-zinc-300'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-8 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-8 scale-95"
    >
      <div
        v-for="toast in appStore.toasts"
        :key="toast.id"
        class="pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 transition-all"
        :class="getStyles(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="getIconColor(toast.type)" />
        <div class="flex-1 min-w-0 font-prompt">
          <h4 class="text-xs font-bold uppercase tracking-wider text-white">{{ toast.title }}</h4>
          <p class="text-xs mt-0.5 text-slate-200 leading-relaxed">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-space-800 transition-colors cursor-pointer"
          @click="appStore.removeToast(toast.id)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
