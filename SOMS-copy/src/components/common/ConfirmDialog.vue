<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/ConfirmDialog.vue
 * วัตถุประสงค์: กล่องข้อความถามยืนยันก่อนลบข้อมูล หรือกระทำการสำคัญ (ธีมดำเทา)
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
        class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="danger ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'"
      >
        <AlertTriangle class="w-5 h-5" />
      </div>
      <div>
        <p class="text-sm text-slate-100 font-prompt leading-relaxed">
          {{ message }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-space-600 bg-space-800 hover:bg-space-700 text-slate-200 hover:text-white transition-colors cursor-pointer font-prompt"
        @click="onCancel"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        :disabled="loading"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer font-prompt disabled:opacity-50"
        :class="danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-zinc-700 hover:bg-zinc-600 border border-zinc-500/60'"
        @click="onConfirm"
      >
        <span v-if="loading">กำลังประมวลผล...</span>
        <span v-else>{{ confirmText }}</span>
      </button>
    </template>
  </BaseModal>
</template>
