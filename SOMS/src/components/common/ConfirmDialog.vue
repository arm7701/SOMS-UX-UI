<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/ConfirmDialog.vue
 * วัตถุประสงค์: กล่องข้อความถามยืนยันก่อนลบข้อมูล หรือกระทำการสำคัญ
 * ============================================================================
 */
import { AlertTriangle } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'ยืนยันการดำเนินการ' },
  message: { type: String, default: 'ท่านต้องการดำเนินการต่อหรือไม่?' },
  confirmText: { type: String, default: 'ยืนยัน' },
  cancelText: { type: String, default: 'ยกเลิก' },
  danger: { type: Boolean, default: true },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const onConfirm = () => emit('confirm')
const onCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
    @close="onCancel"
  >
    <div class="flex items-start gap-4">
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        :class="danger ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'"
      >
        <AlertTriangle class="w-5 h-5" />
      </div>
      <div>
        <p class="text-sm text-slate-700 dark:text-slate-300">
          {{ message }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-space-600 hover:bg-slate-100 dark:hover:bg-space-700 text-slate-700 dark:text-slate-200 transition-colors"
        @click="onCancel"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        :disabled="loading"
        class="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-xs transition-colors"
        :class="danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'"
        @click="onConfirm"
      >
        <span v-if="loading">กำลังประมวลผล...</span>
        <span v-else>{{ confirmText }}</span>
      </button>
    </template>
  </BaseModal>
</template>
