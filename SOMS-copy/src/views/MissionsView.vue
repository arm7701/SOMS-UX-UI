<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/MissionsView.vue
 * วัตถุประสงค์: หน้าจอจัดการภารกิจดาวเทียม (Missions Management)
 * รองรับการแสดงรายการ, เพิ่ม, แก้ไข และลบภารกิจ
 * ============================================================================
 */
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { Target, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const appStore = useAppStore()

const loading = ref(false)
const missions = ref([])

// Modal Add/Edit
const showModal = ref(false)
const isEditing = ref(false)
const formData = ref({
  mission_id: null,
  mission_name: '',
  mission_note: ''
})

// Delete Dialog
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const columns = [
  { key: 'index', label: 'ลำดับ', width: '80px', align: 'center' },
  { key: 'mission_name', label: 'ชื่อภารกิจ (Mission Name)', sortable: true, width: '300px' },
  { key: 'mission_note', label: 'รายละเอียด/หมายเหตุ' }
]

const fetchMissions = async () => {
  loading.value = true
  try {
    const data = await api.get('/missions')
    missions.value = data || []
  } catch (err) {
    console.error('โหลดรายการภารกิจผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMissions()
})

const openAddModal = () => {
  isEditing.value = false
  formData.value = {
    mission_id: null,
    mission_name: '',
    mission_note: ''
  }
  showModal.value = true
}

const openEditModal = (row) => {
  isEditing.value = true
  formData.value = {
    mission_id: row.mission_id,
    mission_name: row.mission_name,
    mission_note: row.mission_note || ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!formData.value.mission_name.trim()) return
  try {
    if (isEditing.value) {
      await api.put(`/missions/${formData.value.mission_id}`, formData.value)
      appStore.showToast('สำเร็จ', 'แก้ไขข้อมูลภารกิจเรียบร้อย')
    } else {
      await api.post('/missions', formData.value)
      appStore.showToast('สำเร็จ', 'เพิ่มภารกิจใหม่แล้ว')
    }
    showModal.value = false
    await fetchMissions()
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
    await api.delete(`/missions/${deleteTarget.value.mission_id}`)
    appStore.showToast('สำเร็จ', 'ลบภารกิจเรียบร้อย')
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchMissions()
  } catch (err) {
    appStore.showToast('ลบล้มเหลว', err.message, 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
      <div>
        <div class="flex items-center gap-2">
          <Target class="w-6 h-6 text-zinc-300" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            จัดการภารกิจดาวเทียม (Missions)
          </h1>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          กำหนดประเภทและรายการภารกิจปฏิบัติการดาวเทียมสำหรับเลือกใช้ในรายงาน
        </p>
      </div>

      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 text-white text-xs font-semibold border border-zinc-500/60 shadow-md shadow-black/40 transition-all active:scale-[0.98]"
          @click="openAddModal"
        >
          <Plus class="w-4 h-4 text-zinc-200" />
          <span>เพิ่มภารกิจใหม่</span>
        </button>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :columns="columns"
      :data="missions"
      search-placeholder="ค้นหาชื่อภารกิจ หรือหมายเหตุ..."
      :default-page-size="25"
    >
      <template #cell(index)="{ index }">
        <span class="font-mono text-xs text-zinc-400 font-semibold">{{ index }}</span>
      </template>

      <template #cell(mission_name)="{ value }">
        <span class="font-semibold text-xs text-white">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <button
            type="button"
            class="p-1.5 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-300 hover:bg-zinc-750 hover:text-white hover:border-zinc-500 text-xs transition-colors shadow-2xs"
            title="แก้ไขภารกิจ"
            @click="openEditModal(row)"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 hover:border-rose-700 text-xs transition-colors shadow-2xs"
            title="ลบภารกิจ"
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
      :title="isEditing ? 'แก้ไขภารกิจดาวเทียม' : 'เพิ่มภารกิจดาวเทียมใหม่'"
      size="md"
    >
      <form id="mission-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            ชื่อภารกิจ (Mission Name) <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="formData.mission_name"
            type="text"
            required
            placeholder="เช่น Housekeeping Telemetry Acquisition"
            class="w-full px-3 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            คำอธิบาย/หมายเหตุ
          </label>
          <textarea
            v-model="formData.mission_note"
            rows="3"
            placeholder="วัตถุประสงค์และรายละเอียดของภารกิจ"
            class="w-full px-3 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          @click="showModal = false"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          form="mission-form"
          class="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 border border-zinc-500/60 text-white shadow-xs"
        >
          บันทึกภารกิจ
        </button>
      </template>
    </BaseModal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="ยืนยันการลบภารกิจ"
      :message="`ท่านต้องการลบภารกิจ '${deleteTarget?.mission_name || ''}' ใช่หรือไม่?`"
      confirm-text="ลบภารกิจ"
      @confirm="handleDelete"
    />
  </div>
</template>
