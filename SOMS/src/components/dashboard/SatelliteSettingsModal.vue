<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/SatelliteSettingsModal.vue
 * วัตถุประสงค์: โมดอลจัดการรายการดาวเทียมในระบบ (Satellite Catalogue Settings)
 * ช่วยให้ผู้ใช้งานสามารถเปิด/ปิดดาวเทียมที่แสดงบน Orbit Tracker, ปรับสีเส้นวงโคจร,
 * และเพิ่มดาวเทียมใหม่ด้วยหมายเลข NORAD Catalog ID
 * ============================================================================
 */
import { ref, computed } from 'vue'
import { X, Plus, Trash2, CheckCircle2, Sliders, Radio } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  satellites: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const activeFilter = ref('all')
const searchQuery = ref('')
const showAddForm = ref(false)

// ฟอร์มเพิ่มดาวเทียมใหม่
const newSat = ref({
  noradId: '',
  name: '',
  agency: 'กองทัพอากาศ / สทอภ.',
  color: '#00e5ff',
  line1: '',
  line2: ''
})

const filteredSatellites = computed(() => {
  return props.satellites.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          String(s.noradId).includes(searchQuery.value)
    if (activeFilter.value === 'all') return matchesSearch
    return matchesSearch && (s.groupIds?.includes(activeFilter.value) || false)
  })
})

const closeModal = () => {
  showAddForm.value = false
  emit('update:modelValue', false)
}

const toggleSatellite = (sat) => {
  sat.enabled = !sat.enabled
  emit('save', props.satellites)
}

const updateColor = (sat, event) => {
  sat.color = event.target.value
  emit('save', props.satellites)
}

const handleAddSatellite = () => {
  if (!newSat.value.noradId || !newSat.value.name) return

  const norad = parseInt(newSat.value.noradId)
  const l1 = newSat.value.line1.trim() || `1 ${norad}U 24001A   26254.25000000  .00001500  00000-0  10000-3 0  9999`
  const l2 = newSat.value.line2.trim() || `2 ${norad}  97.5000 280.0000 0010000 120.0000 240.0000 15.20000000 10001`

  props.satellites.push({
    noradId: norad,
    name: newSat.value.name.trim(),
    agency: newSat.value.agency.trim(),
    color: newSat.value.color,
    enabled: true,
    groupIds: ['all', 'tactical'],
    line1: l1,
    line2: l2,
    epochDate: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  })

  emit('save', props.satellites)
  showAddForm.value = false
  newSat.value = {
    noradId: '',
    name: '',
    agency: 'กองทัพอากาศ / สทอภ.',
    color: '#00e5ff',
    line1: '',
    line2: ''
  }
}

const removeSatellite = (index) => {
  props.satellites.splice(index, 1)
  emit('save', props.satellites)
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    @click.self="closeModal"
  >
    <div
      class="relative w-full max-w-2xl bg-gradient-to-b from-[#0e274a] to-[#0a1b33] border border-sky-500/30 rounded-2xl shadow-2xl shadow-sky-950/60 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-sky-500/20 flex items-center justify-between bg-sky-950/40">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Sliders class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold font-prompt text-white">จัดการข้อมูลดาวเทียม (Satellite Settings)</h3>
            <p class="text-xs text-sky-200/70">กำหนดการแสดงผล สีเส้นทางโคจร และเพิ่มดาวเทียมเข้าสู่ Orbit Tracker</p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          @click="closeModal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <!-- Search and Filter Bar -->
        <div class="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อดาวเทียม หรือ NORAD ID..."
            class="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-sky-500/20 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all flex-1"
          />

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-xs shadow-sky-500/25 transition-all"
            @click="showAddForm = !showAddForm"
          >
            <Plus class="w-4 h-4" />
            <span>{{ showAddForm ? 'ซ่อนฟอร์ม' : 'เพิ่มดาวเทียม' }}</span>
          </button>
        </div>

        <!-- Add Satellite Form (Collapsible) -->
        <div
          v-if="showAddForm"
          class="p-4 rounded-xl bg-sky-950/30 border border-sky-400/30 space-y-3 animate-slide-down"
        >
          <h4 class="text-xs font-bold text-sky-300 font-prompt">เพิ่มดาวเทียมใหม่เข้าสู่ระบบ</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">NORAD Catalog ID *</label>
              <input
                v-model="newSat.noradId"
                type="number"
                placeholder="เช่น 48963"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ชื่อดาวเทียม *</label>
              <input
                v-model="newSat.name"
                type="text"
                placeholder="เช่น NAPA-2 N"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">หน่วยงานเจ้าของ</label>
              <input
                v-model="newSat.agency"
                type="text"
                placeholder="เช่น กองทัพอากาศ (RTAF)"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">สีเส้นทางโคจร (Trail Color)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model="newSat.color"
                  type="color"
                  class="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  v-model="newSat.color"
                  type="text"
                  class="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white uppercase font-mono"
                />
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[11px] text-slate-300">Two-Line Element (TLE Line 1 & Line 2) - ไม่บังคับ</label>
            <input
              v-model="newSat.line1"
              type="text"
              placeholder="1 48963U 21059CJ  26254.25000000 ..."
              class="w-full px-3 py-1 rounded bg-slate-900 border border-sky-500/30 text-[11px] text-slate-200 font-mono focus:border-sky-400 focus:outline-hidden"
            />
            <input
              v-model="newSat.line2"
              type="text"
              placeholder="2 48963  97.4520 285.1245 ..."
              class="w-full px-3 py-1 rounded bg-slate-900 border border-sky-500/30 text-[11px] text-slate-200 font-mono focus:border-sky-400 focus:outline-hidden"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
              @click="showAddForm = false"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              class="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors"
              @click="handleAddSatellite"
            >
              บันทึกดาวเทียม
            </button>
          </div>
        </div>

        <!-- Satellite Table -->
        <div class="border border-sky-500/20 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-sky-950/60 text-sky-200 font-semibold border-b border-sky-500/20">
              <tr>
                <th class="p-3 w-12 text-center">แสดง</th>
                <th class="p-3">ดาวเทียม</th>
                <th class="p-3">NORAD ID</th>
                <th class="p-3">หน่วยงาน</th>
                <th class="p-3 text-center">สีเส้นทาง</th>
                <th class="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sky-500/10">
              <tr
                v-for="(sat, idx) in filteredSatellites"
                :key="sat.noradId"
                class="hover:bg-sky-900/20 transition-colors"
              >
                <!-- Toggle enabled -->
                <td class="p-3 text-center">
                  <input
                    type="checkbox"
                    :checked="sat.enabled"
                    class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-sky-500/30 focus:ring-sky-400 cursor-pointer"
                    @change="toggleSatellite(sat)"
                  />
                </td>
                <td class="p-3 font-semibold text-white">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-2.5 h-2.5 rounded-full"
                      :style="{ backgroundColor: sat.color }"
                    />
                    <span>{{ sat.name }}</span>
                  </div>
                </td>
                <td class="p-3 font-mono text-sky-300">{{ sat.noradId }}</td>
                <td class="p-3 text-slate-400">{{ sat.agency }}</td>
                <td class="p-3 text-center">
                  <input
                    type="color"
                    :value="sat.color"
                    class="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    title="คลิกเพื่อเปลี่ยนสีเส้นทาง"
                    @input="updateColor(sat, $event)"
                  />
                </td>
                <td class="p-3 text-right">
                  <button
                    type="button"
                    class="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="ลบออกจากระบบ"
                    @click="removeSatellite(idx)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-sky-500/20 bg-sky-950/40 flex items-center justify-between">
        <span class="text-xs text-slate-400">
          เปิดใช้งาน {{ props.satellites.filter(s => s.enabled).length }} จาก {{ props.satellites.length }} ดวง
        </span>
        <button
          type="button"
          class="px-5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-xs transition-all"
          @click="closeModal"
        >
          เสร็จสิ้น
        </button>
      </div>
    </div>
  </div>
</template>
