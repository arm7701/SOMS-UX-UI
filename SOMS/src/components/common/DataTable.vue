<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/DataTable.vue
 * วัตถุประสงค์: ตารางข้อมูลอเนกประสงค์ (Modern Responsive Data Table)
 * คุณสมบัติ:
 *   - ค้นหาแบบ Real-time ทันที
 *   - จัดเรียงคอลัมน์ (Sorting Asc/Desc)
 *   - แบ่งหน้า (Pagination) เลือกจำนวนแถวได้
 *   - ดีไซน์สบายตา อ่านง่าย มี Contrast คมชัด ไม่กลืนกับพื้นหลัง
 *   - รองรับ Slots สำหรับปรับแต่งการแสดงผลในแต่ละคอลัมน์
 * ============================================================================
 */
import { ref, computed } from 'vue'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-vue-next'

const props = defineProps({
  columns: {
    type: Array,
    required: true
    // [{ key: 'id', label: 'ID', sortable: true, align: 'center', width: '80px' }]
  },
  data: {
    type: Array,
    default: () => []
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'ค้นหาข้อมูล...'
  },
  defaultPageSize: {
    type: Number,
    default: 10
  }
})

const searchQuery = ref('')
const sortKey = ref('')
const sortOrder = ref('asc') // 'asc' | 'desc'
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)

// กรองข้อมูลตามคำค้นหา
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return props.data

  const q = searchQuery.value.toLowerCase().trim()
  return props.data.filter(row => {
    return Object.values(row).some(val => {
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(q)
    })
  })
})

// จัดเรียงข้อมูล
const sortedData = computed(() => {
  const list = [...filteredData.value]
  if (!sortKey.value) return list

  return list.sort((a, b) => {
    const valA = a[sortKey.value]
    const valB = b[sortKey.value]

    if (valA === valB) return 0
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    const isNum = !isNaN(Number(valA)) && !isNaN(Number(valB))
    let result = 0
    if (isNum) {
      result = Number(valA) - Number(valB)
    } else {
      result = String(valA).localeCompare(String(valB), 'th')
    }

    return sortOrder.value === 'asc' ? result : -result
  })
})

// คำนวณหน้าและการแบ่งข้อมูล
const totalPages = computed(() => Math.ceil(sortedData.value.length / pageSize.value) || 1)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

const handleSort = (key, sortable) => {
  if (!sortable) return
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const changePage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p
  }
}
</script>

<template>
  <div class="bg-white dark:bg-space-850 rounded-xl border border-slate-200 dark:border-space-700 shadow-sm overflow-hidden flex flex-col">
    <!-- Header Control: Search & Actions -->
    <div class="p-4 border-b border-slate-200 dark:border-space-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-space-900/40">
      <div v-if="searchable" class="relative w-full sm:w-72">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          @input="currentPage = 1"
        />
      </div>

      <!-- Custom Filter Slot -->
      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <slot name="filters" />
      </div>
    </div>

    <!-- Mobile Swipe Indicator Hint -->
    <div class="px-4 py-1.5 bg-blue-50/50 dark:bg-space-900/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-space-750 sm:hidden select-none">
      <span class="flex items-center gap-1.5">
        <span class="text-blue-500">↔</span>
        <span>สามารถปัดเลื่อนตารางซ้าย-ขวาเพื่อดูข้อมูล</span>
      </span>
      <span class="font-mono text-[10px] text-slate-400">{{ sortedData.length }} รายการ</span>
    </div>

    <!-- Table Body -->
    <div class="overflow-x-auto scrollbar-thin">
      <table class="w-full text-left text-sm text-slate-700 dark:text-slate-200 border-collapse">
        <thead class="bg-slate-100/80 dark:bg-space-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-space-700 select-none">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="py-3.5 px-3.5 sm:px-4 transition-colors font-prompt"
              :class="[
                col.sortable ? 'cursor-pointer hover:bg-slate-200/60 dark:hover:bg-space-700' : '',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
              ]"
              :style="{ width: col.width || 'auto', minWidth: col.minWidth || (col.width ? col.width : '100px') }"
              @click="handleSort(col.key, col.sortable)"
            >
              <div class="inline-flex items-center gap-1.5" :class="col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''">
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="inline-flex flex-col text-slate-400">
                  <ChevronUp
                    class="w-3 h-3 -mb-1"
                    :class="sortKey === col.key && sortOrder === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'opacity-40'"
                  />
                  <ChevronDown
                    class="w-3 h-3"
                    :class="sortKey === col.key && sortOrder === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'opacity-40'"
                  />
                </span>
              </div>
            </th>
            <th v-if="$slots.actions" scope="col" class="py-3.5 px-4 text-center w-36 min-w-[130px] font-prompt">
              การจัดการ
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200/70 dark:divide-space-750">
          <tr
            v-for="(row, idx) in paginatedData"
            :key="row.id || row.report_id || row.mission_id || row.trouble_id || row.rbac_id || idx"
            class="hover:bg-slate-50/80 dark:hover:bg-space-800/60 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="py-3.5 px-3.5 sm:px-4 align-middle font-prompt"
              :class="col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'"
              :style="{ minWidth: col.minWidth || (col.width ? col.width : '100px') }"
            >
              <slot :name="`cell(${col.key})`" :row="row" :value="row[col.key]" :index="(currentPage - 1) * pageSize + idx + 1">
                {{ row[col.key] !== null && row[col.key] !== undefined && row[col.key] !== '' ? row[col.key] : '—' }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="py-3.5 px-4 text-center align-middle whitespace-nowrap min-w-[130px]">
              <slot name="actions" :row="row" />
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="py-12 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <Inbox class="w-8 h-8 opacity-40" />
                <p class="text-sm font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                <p v-if="searchQuery" class="text-xs text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="p-3 border-t border-slate-200 dark:border-space-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-space-900/40">
      <div class="flex items-center gap-2">
        <span>แสดง</span>
        <select
          v-model="pageSize"
          class="px-2 py-1 rounded border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          @change="currentPage = 1"
        >
          <option :value="10">10 แถว</option>
          <option :value="25">25 แถว</option>
          <option :value="50">50 แถว</option>
          <option :value="100">100 แถว</option>
        </select>
        <span>จากทั้งหมด {{ sortedData.length }} รายการ</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="currentPage <= 1"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-space-700 hover:bg-slate-100 dark:hover:bg-space-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          @click="changePage(currentPage - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <span class="px-3 py-1 font-medium text-slate-700 dark:text-slate-300">
          หน้า {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          type="button"
          :disabled="currentPage >= totalPages"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-space-700 hover:bg-slate-100 dark:hover:bg-space-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          @click="changePage(currentPage + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
