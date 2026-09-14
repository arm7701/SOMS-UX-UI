<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/TroublesView.vue
 * วัตถุประสงค์: หน้าจอจัดการข้อขัดข้องและระบบย่อย (Troubles & Subsystems)
 * รองรับการแสดงรายการ, เพิ่ม, แก้ไข และลบข้อขัดข้อง
 * ============================================================================
 */
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { AlertOctagon, Plus, Pencil, Trash2, Cpu } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const dataStore = useDataStore()
const appStore = useAppStore()

const loading = ref(false)
const troubles = ref([])

// Modal Add/Edit
const showModal = ref(false)
const isEditing = ref(false)
const formData = ref({
  trouble_id: null,
  trouble_name: '',
  sub_id: '',
  trouble_note: ''
})

// Delete Dialog
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const columns = [
  { key: 'index', label: 'ลำดับ', width: '80px', align: 'center' },
  { key: 'trouble_name', label: 'ชื่อข้อขัดข้อง (Trouble Name)', sortable: true, width: '280px' },
  { key: 'subsystem_name', label: 'ระบบย่อย (Subsystem)', sortable: true, width: '220px' },
  { key: 'trouble_note', label: 'รายละเอียด/แนวทางแก้ไข' }
]

const fetchTroubles = async () => {
  loading.value = true
  try {
    const data = await api.get('/troubles')
    troubles.value = (data || []).map(t => ({
      ...t,
      subsystem_name: dataStore.getSubsystemName(t.sub_id)
    }))
  } catch (err) {
    console.error('โหลดรายการข้อขัดข้องผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await dataStore.fetchLookups()
  await fetchTroubles()
})

const openAddModal = () => {
  isEditing.value = false
  formData.value = {
    trouble_id: null,
    trouble_name: '',
    sub_id: dataStore.lookups.subsystems[0]?.sub_id || '',
    trouble_note: ''
  }
  showModal.value = true
}

const openEditModal = (row) => {
  isEditing.value = true
  formData.value = {
    trouble_id: row.trouble_id,
    trouble_name: row.trouble_name,
    sub_id: row.sub_id,
    trouble_note: row.trouble_note || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!formData.value.trouble_name.trim() || !formData.value.sub_id) return
  try {
    if (isEditing.value) {
      await api.put(`/troubles/${formData.value.trouble_id}`, formData.value)
      appStore.showToast('สำเร็จ', 'แก้ไขข้อมูลข้อขัดข้องเรียบร้อย')
    } else {
      await api.post('/troubles', formData.value)
      appStore.showToast('สำเร็จ', 'เพิ่มข้อขัดข้องใหม่แล้ว')
    }
    showModal.value = false
    await fetchTroubles()
  } catch (err) {
    appStore.showToast('ข้อผิดพลาด', err.message, 'error')
  }
}

const confirmDelete = (row) => {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/troubles/${deleteTarget.value.trouble_id}`)
    appStore.showToast('สำเร็จ', 'ลบข้อขัดข้องเรียบร้อย')
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchTroubles()
  } catch (err) {
    appStore.showToast('ลบล้มเหลว', err.message, 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-space-700">
      <div>
        <div class="flex items-center gap-2">
          <AlertOctagon class="w-6 h-6 text-amber-500" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
            ปัญหาและระบบย่อย (Sub/Troubles)
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ระบบจัดหมวดหมู่ข้อขัดข้องตามระบบย่อยของดาวเทียมสำหรับนำไปใช้บันทึกในรายงาน
        </p>
      </div>

      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          @click="openAddModal"
        >
          <Plus class="w-4 h-4" />
          <span>เพิ่มข้อขัดข้องใหม่</span>
        </button>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :columns="columns"
      :data="troubles"
      search-placeholder="ค้นหาชื่อข้อขัดข้อง หรือระบบย่อย..."
      :default-page-size="25"
    >
      <template #cell(index)="{ index }">
        <span class="font-mono text-xs text-slate-400 font-semibold">{{ index }}</span>
      </template>

      <template #cell(trouble_name)="{ value }">
        <span class="font-semibold text-xs text-slate-800 dark:text-slate-100">{{ value }}</span>
      </template>

      <template #cell(subsystem_name)="{ value }">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-space-800 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Cpu class="w-3.5 h-3.5 text-blue-500" />
          <span>{{ value }}</span>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <button
            type="button"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-space-700 dark:text-slate-300 dark:hover:bg-space-800 text-xs transition-colors"
            title="แก้ไขข้อขัดข้อง"
            @click="openEditModal(row)"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs transition-colors"
            title="ลบข้อขัดข้อง"
            @click="confirmDelete(row)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal Add/Edit -->
    <BaseModal
      v-model="showModal"
      :title="isEditing ? 'แก้ไขข้อขัดข้อง' : 'เพิ่มข้อขัดข้องใหม่'"
      size="md"
    >
      <form id="trouble-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ชื่อข้อขัดข้อง (Trouble Name) <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="formData.trouble_name"
            type="text"
            required
            placeholder="เช่น UHF Signal Attenuation"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            ระบบย่อย (Subsystem) <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="formData.sub_id"
            required
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="" disabled>-- เลือกระบบย่อย --</option>
            <option v-for="sub in dataStore.lookups.subsystems" :key="sub.sub_id" :value="sub.sub_id">
              {{ sub.sub_name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            คำอธิบาย/แนวทางแก้ไข (Note)
          </label>
          <textarea
            v-model="formData.trouble_note"
            rows="3"
            placeholder="ลักษณะอาการ สาเหตุ หรือแนวทางแก้ไขเบื้องต้น"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-space-600 hover:bg-slate-100 dark:hover:bg-space-700 text-slate-700 dark:text-slate-200"
          @click="showModal = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="trouble-form"
          class="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
        >
          บันทึกข้อขัดข้อง
        </button>
      </template>
    </BaseModal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="ยืนยันการลบข้อขัดข้อง"
      :message="`ท่านต้องการลบข้อขัดข้อง '${deleteTarget?.trouble_name || ''}' ใช่หรือไม่?`"
      confirm-text="ลบข้อขัดข้อง"
      @confirm="handleDelete"
    />
  </div>
</template>
