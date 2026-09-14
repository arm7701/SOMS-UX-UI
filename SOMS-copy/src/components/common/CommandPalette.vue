<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/CommandPalette.vue
 * วัตถุประสงค์: กล่องค้นหาคำสั่งด่วนทั่วทั้งระบบ (Global Command Palette - Ctrl+K)
 * ธีมดำเทาไททาเนียม คอนทราสต์คมชัดทุกผลลัพธ์
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  LineChart,
  Compass,
  SunMedium,
  Users,
  FileText,
  FilePlus,
  History,
  ShieldCheck,
  Target,
  AlertOctagon,
  Database,
  Orbit,
  ArrowRight,
  ClipboardList
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'openHandover'])

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const searchInput = ref(null)
const query = ref('')
const selectedIndex = ref(0)

// รายการคำสั่งและเมนูทั้งหมดในระบบ
const allCommands = computed(() => {
  const items = [
    // 1. หมวดการนำทางหลัก (Navigation)
    { id: 'nav-dash', group: 'หน้าจอระบบ', label: 'ภาพรวมระบบ (Dashboard)', desc: 'สรุปสถานะดาวเทียม สภาพอวกาศ และโทรมาตร', path: '/dashboard', icon: LayoutDashboard },
    { id: 'nav-passes', group: 'หน้าจอระบบ', label: 'แผนผ่านดาวเทียม (Pass Detail)', desc: 'ตารางเวลา AOS/LOS มุมยกสูงสุด', path: '/passes', icon: CalendarDays },
    { id: 'nav-alt', group: 'หน้าจอระบบ', label: 'ระดับความสูงวงโคจร (Altitude)', desc: 'ประวัติความสูง NAPA-1 และ NAPA-2', path: '/satellite-data', icon: LineChart },
    { id: 'nav-planner', group: 'หน้าจอระบบ', label: 'วางแผนพาส (SAT PASS PLANNER)', desc: 'จำลองการถ่ายภาพ แผนที่ และมุม Roll', path: '/planner', icon: Compass },
    { id: 'nav-weather', group: 'หน้าจอระบบ', label: 'สภาพอวกาศ (Space Weather)', desc: 'ดัชนี R, S, G Scale ตามมาตรฐาน NOAA', path: '/space-weather', icon: SunMedium },
    { id: 'nav-ops', group: 'หน้าจอระบบ', label: 'ตารางผู้ปฏิบัติเวร (Operator List)', desc: 'ปฏิทินเวรปฏิบัติการ MD, FMO, GSO', path: '/operations', icon: Users },
    { id: 'nav-reports', group: 'หน้าจอระบบ', label: 'รายงานภารกิจ (Reports)', desc: 'ค้นหาและดาวน์โหลดเอกสารภารกิจ', path: '/reports', icon: FileText },
    { id: 'nav-logs', group: 'หน้าจอระบบ', label: 'บันทึกกิจกรรม (Activity Logs)', desc: 'Audit trail และประวัติการทำงาน', path: '/logs', icon: History },

    // 2. หมวดคำสั่งด่วน (Quick Actions)
    { id: 'act-new-report', group: 'คำสั่งด่วน', label: 'สร้างรายงานภารกิจใหม่ (New Mission Report)', desc: 'เปิดแบบฟอร์ม 6 ส่วนสำหรับบันทึกผลพาส', path: '/reports/new', icon: FilePlus },
    { id: 'act-handover', group: 'คำสั่งด่วน', label: 'สรุปส่งมอบเวรประจำวัน (Shift Handover Briefing)', desc: 'ดูสรุปข้อมูลผลัดเพื่อคัดลอกหรือสั่งพิมพ์', action: () => emit('openHandover'), icon: ClipboardList },
    { id: 'act-toggle-mock', group: 'คำสั่งด่วน', label: appStore.mockMode ? 'สลับเป็นโหมด Live API' : 'สลับเป็นโหมด Mock Data (Offline)', desc: 'สลับแหล่งข้อมูลระหว่างเซิร์ฟเวอร์จริงและข้อมูลจำลอง', action: () => appStore.toggleMockMode(), icon: Database },

    // 3. หมวดดาวเทียม (Satellites)
    { id: 'sat-napa1', group: 'ดาวเทียม', label: 'ดาวเทียม NAPA-1 N (NORAD: 46320)', desc: 'ดาวเทียมความมั่นคงทางยุทธการดวงที่ 1', path: '/passes?sat=46320', icon: Orbit },
    { id: 'sat-napa2', group: 'ดาวเทียม', label: 'ดาวเทียม NAPA-2 N (NORAD: 48963)', desc: 'ดาวเทียมลาดตระเวนและตรวจการณ์ดวงที่ 2', path: '/passes?sat=48963', icon: Orbit }
  ]

  // เมนูเฉพาะผู้ดูแลระบบ
  if (authStore.isAdmin) {
    items.push(
      { id: 'admin-users', group: 'ผู้ดูแลระบบ', label: 'จัดการผู้ใช้งาน (User Management)', desc: 'กำหนดสิทธิ์ บัญชีผู้ใช้ และรีเซ็ตรหัสผ่าน', path: '/users', icon: ShieldCheck },
      { id: 'admin-missions', group: 'ผู้ดูแลระบบ', label: 'จัดการประเภทภารกิจ (Missions)', desc: 'กำหนดรายการภารกิจในระบบ', path: '/missions', icon: Target },
      { id: 'admin-troubles', group: 'ผู้ดูแลระบบ', label: 'จัดการปัญหาและระบบย่อย (Troubles)', desc: 'ระบบย่อย ADCS, EPS, COMM, OBP', path: '/troubles', icon: AlertOctagon }
    )
  }

  return items
})

// กรองรายการตามคำค้นหา
const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allCommands.value

  return allCommands.value.filter(item => {
    return item.label.toLowerCase().includes(q) ||
      (item.desc && item.desc.toLowerCase().includes(q)) ||
      item.group.toLowerCase().includes(q)
  })
})

const close = () => {
  emit('update:modelValue', false)
  query.value = ''
}

const executeCommand = (cmd) => {
  close()
  if (cmd.path) {
    router.push(cmd.path)
  } else if (typeof cmd.action === 'function') {
    cmd.action()
  }
}

const onKeydown = (e) => {
  if (!props.modelValue) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = filteredCommands.value[selectedIndex.value]
    if (selected) executeCommand(selected)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

// ดักจับปุ่มลัด Ctrl+K หรือ Cmd+K ทั่วทั้งระบบ
const handleGlobalKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    emit('update:modelValue', !props.modelValue)
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedIndex.value = 0
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm transition-opacity"
    @click.self="close"
  >
    <div
      class="w-full max-w-xl bg-space-850/98 backdrop-blur-xl rounded-2xl border border-space-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
    >
      <!-- Search Input Header -->
      <div class="relative border-b border-space-750 p-4 flex items-center gap-3 bg-space-900/60">
        <Search class="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="พิมพ์ค้นหาหน้าจอ, คำสั่ง, หรือชื่อดาวเทียม... (เช่น รายงาน, NAPA, แผนที่)"
          class="w-full bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none font-prompt"
        />
        <div class="flex items-center gap-1">
          <kbd class="px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 bg-space-800 rounded border border-space-700">ESC</kbd>
        </div>
      </div>

      <!-- Results List -->
      <div class="overflow-y-auto p-2 space-y-1 flex-1">
        <div
          v-if="filteredCommands.length === 0"
          class="p-8 text-center text-zinc-400 text-xs font-prompt"
        >
          ไม่พบคำสั่งหรือข้อมูลที่ตรงกับ "{{ query }}"
        </div>

        <button
          v-for="(cmd, idx) in filteredCommands"
          :key="cmd.id"
          type="button"
          class="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors font-prompt cursor-pointer"
          :class="idx === selectedIndex
            ? 'bg-zinc-800 text-white border-l-4 border-slate-200'
            : 'text-slate-200 hover:bg-space-800/70 hover:text-white'"
          @click="executeCommand(cmd)"
          @mouseenter="selectedIndex = idx"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
              :class="idx === selectedIndex ? 'bg-zinc-700 text-white shadow-xs' : 'bg-space-800 text-zinc-400'"
            >
              <component :is="cmd.icon" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <span class="text-xs font-semibold block truncate text-white">
                {{ cmd.label }}
              </span>
              <span class="text-[11px] text-zinc-400 block truncate mt-0.5">
                {{ cmd.desc }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 pl-2">
            <span class="text-[10px] px-2 py-0.5 rounded bg-space-800 border border-space-700 text-zinc-400 font-mono">
              {{ cmd.group }}
            </span>
            <ArrowRight class="w-3.5 h-3.5 text-zinc-400 opacity-60" />
          </div>
        </button>
      </div>

      <!-- Footer Quick Keys -->
      <div class="px-4 py-2.5 border-t border-space-750 bg-space-900/60 text-[11px] text-zinc-400 flex items-center justify-between font-prompt">
        <div class="flex items-center gap-3">
          <span><kbd class="px-1 py-0.5 rounded bg-space-800 border border-space-700 text-[10px]">↑↓</kbd> นำทาง</span>
          <span><kbd class="px-1 py-0.5 rounded bg-space-800 border border-space-700 text-[10px]">Enter</kbd> เลือก</span>
          <span><kbd class="px-1 py-0.5 rounded bg-space-800 border border-space-700 text-[10px]">ESC</kbd> ปิด</span>
        </div>
        <span>{{ filteredCommands.length }} คำสั่ง</span>
      </div>
    </div>
  </div>
</template>
