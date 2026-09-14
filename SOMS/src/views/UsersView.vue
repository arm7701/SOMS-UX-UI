<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/UsersView.vue
 * วัตถุประสงค์: หน้าจอจัดการรายชื่อผู้ใช้งานและกำหนดสิทธิ์ (User Management)
 * รองรับการเพิ่ม, แก้ไข, เปลี่ยนสถานะ และรีเซ็ตรหัสผ่านของผู้ใช้งาน
 * ============================================================================
 */
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { ShieldCheck, Plus, Pencil, Trash2, KeyRound, User } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const appStore = useAppStore()

const loading = ref(false)
const users = ref([])

// Modal Add/Edit
const showModal = ref(false)
const isEditing = ref(false)
const formData = ref({
  rbac_id: null,
  rbac_fullname: '',
  rbac_shortname: '',
  rbac_position: '',
  rbac_username: '',
  rbac_role: 'MD',
  rbac_status: 'Active',
  rbac_duty: '',
  rbac_comments: '',
  password: ''
})

// Dialogs
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const showResetDialog = ref(false)
const resetTarget = ref(null)

const columns = [
  { key: 'rbac_fullname', label: 'ยศ ชื่อ-สกุล', sortable: true, width: '220px' },
  { key: 'rbac_shortname', label: 'ชื่อย่อ', width: '110px' },
  { key: 'rbac_position', label: 'ตำแหน่ง', width: '180px' },
  { key: 'rbac_username', label: 'Username', sortable: true, width: '130px' },
  { key: 'rbac_role', label: 'หน้าที่ประจำ', align: 'center', width: '120px' },
  { key: 'rbac_status', label: 'สถานะ', align: 'center', width: '110px' }
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await api.get('/users')
    users.value = data || []
  } catch (err) {
    console.error('โหลดผู้ใช้งานผิดพลาด:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

const openAddModal = () => {
  isEditing.value = false
  formData.value = {
    rbac_id: null,
    rbac_fullname: '',
    rbac_shortname: '',
    rbac_position: '',
    rbac_username: '',
    rbac_role: 'MD',
    rbac_status: 'Active',
    rbac_duty: '',
    rbac_comments: '',
    password: ''
  }
  showModal.value = true
}

const openEditModal = (row) => {
  isEditing.value = true
  formData.value = {
    rbac_id: row.rbac_id,
    rbac_fullname: row.rbac_fullname,
    rbac_shortname: row.rbac_shortname,
    rbac_position: row.rbac_position || '',
    rbac_username: row.rbac_username,
    rbac_role: row.rbac_role || 'MD',
    rbac_status: row.rbac_status || 'Active',
    rbac_duty: row.rbac_duty || '',
    rbac_comments: row.rbac_comments || '',
    password: ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!formData.value.rbac_fullname.trim() || !formData.value.rbac_username.trim()) return

  const payload = { ...formData.value }
  if (!payload.password) delete payload.password

  try {
    if (isEditing.value) {
      await api.put(`/users/${formData.value.rbac_id}`, payload)
      appStore.showToast('สำเร็จ', 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อย')
    } else {
      await api.post('/users', payload)
      appStore.showToast('สำเร็จ', 'เพิ่มผู้ใช้งานใหม่เรียบร้อย')
    }
    showModal.value = false
    await fetchUsers()
  } catch (err) {
    appStore.showToast('ข้อผิดพลาด', err.message, 'error')
  }
}

// Reset Password Flow
const confirmResetPassword = (row) => {
  resetTarget.value = row
  showResetDialog.value = true
}

const handleResetPassword = async () => {
  if (!resetTarget.value) return
  try {
    await api.put(`/users/${resetTarget.value.rbac_id}`, { reset_password: true })
    appStore.showToast('สำเร็จ', `รีเซ็ตรหัสผ่านของ ${resetTarget.value.rbac_fullname} แล้ว ผู้ใช้ต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบ`)
    showResetDialog.value = false
    resetTarget.value = null
    await fetchUsers()
  } catch (err) {
    appStore.showToast('รีเซ็ตล้มเหลว', err.message, 'error')
  }
}

// Delete Flow
const confirmDelete = (row) => {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/users/${deleteTarget.value.rbac_id}`)
    appStore.showToast('สำเร็จ', 'ลบผู้ใช้งานเรียบร้อย')
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchUsers()
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
          <ShieldCheck class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
            จัดการผู้ใช้งาน (User Management)
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          กำหนดสิทธิ์การเข้าถึง บัญชีผู้ปฏิบัติหน้าที่ และการควบคุมรหัสผ่าน
        </p>
      </div>

      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          @click="openAddModal"
        >
          <Plus class="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :columns="columns"
      :data="users"
      search-placeholder="ค้นหาชื่อ, ชื่อย่อ, หรือ Username..."
      :default-page-size="25"
    >
      <template #cell(rbac_fullname)="{ value }">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-slate-100 dark:bg-space-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">
            <User class="w-3.5 h-3.5" />
          </div>
          <span class="font-semibold text-xs text-slate-800 dark:text-slate-100">{{ value }}</span>
        </div>
      </template>

      <template #cell(rbac_username)="{ value }">
        <span class="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold">{{ value }}</span>
      </template>

      <template #cell(rbac_role)="{ value }">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          {{ value }}
        </span>
      </template>

      <template #cell(rbac_status)="{ value }">
        <StatusBadge
          :label="value"
          :status="value.toLowerCase() === 'active' ? 'normal' : 'danger'"
          size="sm"
        />
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <!-- Reset Password -->
          <button
            v-if="row.has_password"
            type="button"
            class="p-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-900 dark:text-sky-400 dark:hover:bg-sky-950/40 text-xs transition-colors"
            title="รีเซ็ตรหัสผ่าน (ผู้ใช้จะต้องตั้งรหัสผ่านใหม่)"
            @click="confirmResetPassword(row)"
          >
            <KeyRound class="w-3.5 h-3.5" />
          </button>

          <!-- Edit -->
          <button
            type="button"
            class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-space-700 dark:text-slate-300 dark:hover:bg-space-800 text-xs transition-colors"
            title="แก้ไขข้อมูลผู้ใช้"
            @click="openEditModal(row)"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>

          <!-- Delete -->
          <button
            type="button"
            class="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs transition-colors"
            title="ลบผู้ใช้"
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
      :title="isEditing ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'"
      size="lg"
    >
      <form id="user-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ยศ ชื่อ-สกุล <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formData.rbac_fullname"
              type="text"
              required
              placeholder="เช่น น.ต. สมชาย ดวงดาว"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อย่อ <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formData.rbac_shortname"
              type="text"
              required
              placeholder="เช่น สมชาย"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ตำแหน่งราชการ
            </label>
            <input
              v-model="formData.rbac_position"
              type="text"
              placeholder="เช่น นายทหารควบคุมภารกิจ"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formData.rbac_username"
              type="text"
              required
              placeholder="ไม่ต้องใส่ @rtaf.mi.th"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ตำแหน่งปฏิบัติงานประจำ (Role) <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="formData.rbac_role"
              required
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="-">- (ทั่วไป)</option>
              <option value="MD">Mission Director (MD)</option>
              <option value="FMO">Flight and Mission Operator (FMO)</option>
              <option value="GSO">Ground Station Operator (GSO)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              สถานะการใช้งาน <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="formData.rbac_status"
              required
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Active">Active (เปิดใช้งาน)</option>
              <option value="Notactive">Notactive (ระงับการใช้งาน)</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {{ isEditing ? 'เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : 'รหัสผ่านเริ่มต้น (หรือเว้นว่างเพื่อให้ผู้ใช้ตั้งเอง)' }}
            </label>
            <input
              v-model="formData.password"
              type="password"
              placeholder="รหัสผ่าน 10-72 ตัวอักษร"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
          </div>
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
          form="user-form"
          class="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
        >
          บันทึกข้อมูล
        </button>
      </template>
    </BaseModal>

    <!-- Reset Password Dialog -->
    <ConfirmDialog
      v-model="showResetDialog"
      title="ยืนยันการรีเซ็ตรหัสผ่าน"
      :message="`รีเซ็ตรหัสผ่านของ '${resetTarget?.rbac_fullname || ''}'? รหัสผ่านเดิมจะใช้ไม่ได้ และผู้ใช้ต้องตั้งรหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป`"
      confirm-text="รีเซ็ตรหัสผ่าน"
      :danger="false"
      @confirm="handleResetPassword"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="ยืนยันการลบผู้ใช้งาน"
      :message="`ท่านต้องการลบผู้ใช้งาน '${deleteTarget?.rbac_fullname || ''}' ใช่หรือไม่?`"
      confirm-text="ลบผู้ใช้"
      @confirm="handleDelete"
    />
  </div>
</template>
