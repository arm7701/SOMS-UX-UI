<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/OperationsView.vue
 * วัตถุประสงค์: หน้าจอตารางเวรผู้ปฏิบัติหน้าที่รายเดือน (Operator Duty Roster)
 * แสดงรายชื่อ MD, FMO, GSO ประจำแต่ละวัน พร้อมปุ่มเพิ่ม/แก้ไข/ลบเวร
 * ============================================================================
 */
import { ref, onMounted, computed } from 'vue'
import { api } from '@/api/client'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import { Users, Plus, Pencil, Trash2, Calendar } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const dataStore = useDataStore()
const appStore = useAppStore()

const loading = ref(false)
const operations = ref([])

// Form Modal State
const showModal = ref(false)
const modalTitle = ref('บันทึกเวรปฏิบัติการ')
const isEditing = ref(false)
const formData = ref({
  operation_id: null,
  operation_date: new Date().toISOString().slice(0, 10),
  rbac_id: '',
  rbac_role: 'MD',
  operation_note: ''
})

// Delete Dialog State
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const columns = [
  { key: 'date_label', label: 'วันที่ (DATE)', sortable: true, width: '14%', minWidth: '130px' },
  { key: 'md_name', label: 'Mission Director (MD)', width: '22%', minWidth: '180px' },
  { key: 'fmo_name', label: 'Flight & Mission Operator (FMO)', width: '22%', minWidth: '180px' },
  { key: 'gso_name', label: 'Ground Station Operator (GSO)', width: '22%', minWidth: '180px' },
  { key: 'note', label: 'หมายเหตุ/ภารกิจเวร', width: '20%', minWidth: '160px' }
]

const fetchOperations = async () => {
  loading.value = true
  try {
    const data = await api.get('/operations')
    operations.value = data || []
  } catch (err) {
    console.error('โหลดตารางเวรผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await dataStore.fetchLookups()
  await fetchOperations()
})

// สร้างรายการวันทั้งหมดในเดือนปัจจุบัน
const todayStr = new Date().toISOString().slice(0, 10)

const monthCalendarRows = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const list = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const duties = operations.value.filter(op => op.operation_date === dateStr)

    const md = duties.find(op => op.rbac_role === 'MD')
    const fmo = duties.find(op => op.rbac_role === 'FMO')
    const gso = duties.find(op => op.rbac_role === 'GSO')

    list.push({
      date: dateStr,
      date_label: dateStr.split('-').reverse().join('/'),
      isToday: dateStr === todayStr,
      md_name: md?.rbac_fullname || '—',
      fmo_name: fmo?.rbac_fullname || '—',
      gso_name: gso?.rbac_fullname || '—',
      note: md?.operation_note || fmo?.operation_note || gso?.operation_note || '—',
      rawDuties: duties
    })
  }

  return list
})

// เปิด Modal เพิ่มเวร
const openAddModal = (defaultDate = '') => {
  isEditing.value = false
  modalTitle.value = 'เพิ่มรายชื่อผู้ปฏิบัติเวร'
  formData.value = {
    operation_id: null,
    operation_date: defaultDate || new Date().toISOString().slice(0, 10),
    rbac_id: dataStore.lookups.users[0]?.rbac_id || '',
    rbac_role: 'MD',
    operation_note: ''
  }
  showModal.value = true
}

// เปิด Modal แก้ไขเวร
const openEditModal = (duty) => {
  isEditing.value = true
  modalTitle.value = 'แก้ไขข้อมูลผู้ปฏิบัติเวร'
  formData.value = {
    operation_id: duty.operation_id,
    operation_date: duty.operation_date,
    rbac_id: duty.rbac_id,
    rbac_role: duty.rbac_role,
    operation_note: duty.operation_note || ''
  }
  showModal.value = true
}

// บันทึกฟอร์ม
const handleSubmit = async () => {
  try {
    if (isEditing.value && formData.value.operation_id) {
      await api.put(`/operations/${formData.value.operation_id}`, formData.value)
      appStore.showToast('สำเร็จ', 'แก้ไขข้อมูลการปฏิบัติเวรเรียบร้อย')
    } else {
      await api.post('/operations', formData.value)
      appStore.showToast('สำเร็จ', 'บันทึกรายชื่อผู้ปฏิบัติเวรใหม่แล้ว')
    }
    showModal.value = false
    await fetchOperations()
  } catch (err) {
    appStore.showToast('ข้อผิดพลาด', err.message, 'error')
  }
}

// ยืนยันลบเวร
const confirmDelete = (duty) => {
  deleteTarget.value = duty
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/operations/${deleteTarget.value.operation_id}`)
    appStore.showToast('สำเร็จ', 'ลบข้อมูลเวรเรียบร้อย')
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchOperations()
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
          <Users class="w-6 h-6 text-zinc-300" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            ตารางผู้ปฏิบัติเวร (Operator List)
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-300 font-medium font-prompt mt-1">
          การจัดเวรประจำวันของเจ้าหน้าที่อำนวยการบินและควบคุมสถานีภาคพื้นดิน
        </p>
      </div>

      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c1424] hover:bg-[#121f38] text-cyan-200 hover:text-white border border-cyan-700/60 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer font-prompt"
          @click="openAddModal()"
        >
          <Plus class="w-4 h-4 text-cyan-400" />
          <span>บันทึกเวรปฏิบัติการ</span>
        </button>
      </div>
    </div>

    <!-- Calendar Table -->
    <DataTable
      :columns="columns"
      :data="monthCalendarRows"
      search-placeholder="ค้นหาวันที่, ชื่อเจ้าหน้าที่ หรือตำแหน่ง..."
      :default-page-size="50"
    >
      <template #cell(date_label)="{ row, value }">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-white">{{ value }}</span>
          <span v-if="row.isToday" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/80">
            TODAY
          </span>
        </div>
      </template>

      <template #cell(md_name)="{ value }">
        <span class="text-xs font-semibold text-slate-100">{{ value }}</span>
      </template>

      <template #cell(fmo_name)="{ value }">
        <span class="text-xs font-semibold text-slate-100">{{ value }}</span>
      </template>

      <template #cell(gso_name)="{ value }">
        <span class="text-xs font-semibold text-slate-100">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <button
            v-if="row.rawDuties.length > 0"
            type="button"
            class="p-1.5 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-300 hover:bg-zinc-750 hover:text-white hover:border-zinc-500 text-xs transition-colors shadow-2xs"
            title="แก้ไขเวรของวันนี้"
            @click="openEditModal(row.rawDuties[0])"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs transition-colors shadow-2xs"
            title="เพิ่มผู้เข้าเวรในวันนี้"
            @click="openAddModal(row.date)"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit Duty Modal -->
    <BaseModal
      v-model="showModal"
      :title="modalTitle"
      size="md"
    >
      <form id="duty-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            วันที่ปฏิบัติหน้าที่ <span class="text-rose-400">*</span>
          </label>
          <input
            v-model="formData.operation_date"
            type="date"
            required
            class="w-full px-3 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            ผู้ปฏิบัติเวร <span class="text-rose-400">*</span>
          </label>
          <select
            v-model="formData.rbac_id"
            required
            class="w-full px-3 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
          >
            <option value="" disabled>-- เลือกเจ้าหน้าที่ --</option>
            <option
              v-for="user in dataStore.lookups.users"
              :key="user.rbac_id"
              :value="user.rbac_id"
            >
              {{ user.rbac_fullname }} ({{ user.rbac_role }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            หน้าที่ในเวร (Role) <span class="text-rose-400">*</span>
          </label>
          <select
            v-model="formData.rbac_role"
            required
            class="w-full px-3 py-2 text-sm rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
          >
            <option value="MD">Mission Director (MD)</option>
            <option value="FMO">Flight and Mission Operator (FMO)</option>
            <option value="GSO">Ground Station Operator (GSO)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            หมายเหตุ/บันทึกการปฏิบัติ
          </label>
          <textarea
            v-model="formData.operation_note"
            rows="3"
            placeholder="รายละเอียดงานหรือเหตุการณ์ในเวร"
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
          form="duty-form"
          class="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 border border-zinc-500/60 text-white shadow-xs"
        >
          บันทึกข้อมูล
        </button>
      </template>
    </BaseModal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="ยืนยันการลบเวรปฏิบัติการ"
      message="ท่านต้องการลบข้อมูลการปฏิบัติเวรนี้ใช่หรือไม่?"
      confirm-text="ลบข้อมูล"
      @confirm="handleDelete"
    />
  </div>
</template>
