<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/BaseModal.vue
 * วัตถุประสงค์: กล่องข้อความแบบป๊อปอัป (Modal Window) สไตล์โมเดิร์น สุภาพ สบายตา
 * ใช้สำหรับการสร้าง/แก้ไขข้อมูล และดูรายละเอียด
 * ============================================================================
 */
import { watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  closeOnClickOutside: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onKeyDown = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.removeProperty('overflow')
  }
})

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.body.style.removeProperty('overflow')
})

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        @click.self="closeOnClickOutside && close()"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div
            class="relative w-full bg-white dark:bg-space-850 rounded-2xl border border-slate-200 dark:border-space-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            :class="sizeClasses[size] || sizeClasses.md"
          >
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-100 dark:border-space-750 flex items-center justify-between bg-slate-50/50 dark:bg-space-900/40">
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-white font-prompt">
                  {{ title }}
                </h3>
                <p v-if="subtitle" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ subtitle }}
                </p>
              </div>
              <button
                type="button"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-space-750 transition-colors"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-300">
              <slot />
            </div>

            <!-- Modal Footer -->
            <div v-if="$slots.footer" class="px-6 py-3 border-t border-slate-100 dark:border-space-750 bg-slate-50/50 dark:bg-space-900/40 flex items-center justify-end gap-2.5">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
