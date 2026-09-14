<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/ToastContainer.vue
 * วัตถุประสงค์: แสดงกล่องข้อความแจ้งเตือน (Toast Notification) ลอยมุมจอด้านขวาบน
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
      return 'border-emerald-200 bg-white text-emerald-900 dark:bg-space-850 dark:border-emerald-800/60 dark:text-emerald-300'
    case 'error':
      return 'border-rose-200 bg-white text-rose-900 dark:bg-space-850 dark:border-rose-800/60 dark:text-rose-300'
    case 'warning':
      return 'border-amber-200 bg-white text-amber-900 dark:bg-space-850 dark:border-amber-800/60 dark:text-amber-300'
    default:
      return 'border-blue-200 bg-white text-blue-900 dark:bg-space-850 dark:border-blue-800/60 dark:text-blue-300'
  }
}

const getIconColor = (type) => {
  switch (type) {
    case 'success': return 'text-emerald-500'
    case 'error': return 'text-rose-500'
    case 'warning': return 'text-amber-500'
    default: return 'text-blue-500'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
        class="pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all"
        :class="getStyles(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="getIconColor(toast.type)" />
        <div class="flex-1">
          <h4 class="text-xs font-semibold uppercase tracking-wider">{{ toast.title }}</h4>
          <p class="text-xs mt-0.5 opacity-90 leading-relaxed">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
          @click="appStore.removeToast(toast.id)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
