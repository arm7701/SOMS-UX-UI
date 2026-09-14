<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/GroundStationSettingsModal.vue
 * วัตถุประสงค์: โมดอลจัดการสถานีภาคพื้นดินและเป้าหมายยุทธการ (Ground Station Settings)
 * ช่วยให้ผู้ใช้งานสามารถเปิด/ปิดสถานี, ปรับมุมเงยต่ำสุด (Min Elevation Angle),
 * และเพิ่มสถานีหรือจุดสังเกตการณ์ภาคพื้นดินใหม่เข้าสู่ระบบ
 * ============================================================================
 */
import { ref, computed } from 'vue'
import { X, Plus, Trash2, MapPin, Radio, Target, Crosshair } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  locations: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const activeType = ref('all')
const searchQuery = ref('')
const showAddForm = ref(false)

// ฟอร์มเพิ่มสถานีใหม่
const newLoc = ref({
  id: '',
  name: '',
  shortName: '',
  type: 'ground-station',
  latitude: '',
  longitude: '',
  altitudeM: 50,
  minElevationDeg: 5,
  antenna: 'จานรับสัญญาณดาวเทียมภาคพื้น'
})

const filteredLocations = computed(() => {
  return props.locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          loc.shortName.toLowerCase().includes(searchQuery.value.toLowerCase())
    if (activeType.value === 'all') return matchesSearch
    return matchesSearch && loc.type === activeType.value
  })
})

const closeModal = () => {
  showAddForm.value = false
  emit('update:modelValue', false)
}

const toggleLocation = (loc) => {
  loc.enabled = !loc.enabled
  emit('save', props.locations)
}

const handleAddLocation = () => {
  if (!newLoc.value.name || newLoc.value.latitude === '' || newLoc.value.longitude === '') return

  const locId = 'loc-' + Date.now()
  props.locations.push({
    id: locId,
    type: newLoc.value.type,
    name: newLoc.value.name.trim(),
    shortName: newLoc.value.shortName.trim() || newLoc.value.name.slice(0, 12),
    latitude: parseFloat(newLoc.value.latitude),
    longitude: parseFloat(newLoc.value.longitude),
    altitudeM: parseFloat(newLoc.value.altitudeM) || 0,
    minElevationDeg: parseFloat(newLoc.value.minElevationDeg) || 5,
    enabled: true,
    antenna: newLoc.value.antenna.trim()
  })

  emit('save', props.locations)
  showAddForm.value = false
  newLoc.value = {
    id: '',
    name: '',
    shortName: '',
    type: 'ground-station',
    latitude: '',
    longitude: '',
    altitudeM: 50,
    minElevationDeg: 5,
    antenna: 'จานรับสัญญาณดาวเทียมภาคพื้น'
  }
}

const removeLocation = (index) => {
  props.locations.splice(index, 1)
  emit('save', props.locations)
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
            <Radio class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold font-prompt text-white">จัดการสถานีภาคพื้นและเป้าหมายยุทธการ (Ground Stations)</h3>
            <p class="text-xs text-sky-200/70">กำหนดพิกัด มุมยกสัญญาณต่ำสุด (Min Elevation) สำหรับคำนวณรอบพาส AOS / LOS</p>
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
            placeholder="ค้นหาชื่อสถานี หรือพื้นที่..."
            class="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-sky-500/20 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all flex-1"
          />

          <div class="flex items-center gap-2">
            <select
              v-model="activeType"
              class="px-3 py-2 rounded-xl bg-slate-900 border border-sky-500/20 text-xs text-slate-200 focus:outline-hidden"
            >
              <option value="all">ทุกประเภท</option>
              <option value="ground-station">เฉพาะสถานีภาคพื้น</option>
              <option value="target">เฉพาะเป้าหมายยุทธการ</option>
            </select>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-xs shadow-sky-500/25 transition-all"
              @click="showAddForm = !showAddForm"
            >
              <Plus class="w-4 h-4" />
              <span>{{ showAddForm ? 'ซ่อน' : 'เพิ่มสถานี' }}</span>
            </button>
          </div>
        </div>

        <!-- Add Location Form -->
        <div
          v-if="showAddForm"
          class="p-4 rounded-xl bg-sky-950/30 border border-sky-400/30 space-y-3 animate-slide-down"
        >
          <h4 class="text-xs font-bold text-sky-300 font-prompt">เพิ่มสถานีภาคพื้นดิน หรือเป้าหมายใหม่</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ประเภท</label>
              <select
                v-model="newLoc.type"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              >
                <option value="ground-station">สถานีภาคพื้น (Ground Station)</option>
                <option value="target">เป้าหมายยุทธการ (Observation Target)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ชื่อทางการ *</label>
              <input
                v-model="newLoc.name"
                type="text"
                placeholder="เช่น สถานีควบคุม กองบิน 4 ตาคลี"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ละติจูด (Latitude °N) *</label>
              <input
                v-model="newLoc.latitude"
                type="number"
                step="any"
                placeholder="เช่น 15.2731"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ลองจิจูด (Longitude °E) *</label>
              <input
                v-model="newLoc.longitude"
                type="number"
                step="any"
                placeholder="เช่น 100.2978"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">ความสูงเหนือระดับน้ำทะเล (เมตร)</label>
              <input
                v-model="newLoc.altitudeM"
                type="number"
                placeholder="เช่น 150"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-[11px] text-slate-300 mb-1">มุมเงยต่ำสุด (Min Elevation °)</label>
              <input
                v-model="newLoc.minElevationDeg"
                type="number"
                min="0"
                max="90"
                placeholder="ค่าเริ่มต้น 5 หรือ 10"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs text-white focus:border-sky-400 focus:outline-hidden"
              />
            </div>
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
              @click="handleAddLocation"
            >
              บันทึกสถานที่
            </button>
          </div>
        </div>

        <!-- Locations Table -->
        <div class="border border-sky-500/20 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-sky-950/60 text-sky-200 font-semibold border-b border-sky-500/20">
              <tr>
                <th class="p-3 w-12 text-center">ใช้งาน</th>
                <th class="p-3">ชื่อสถานี / พื้นที่</th>
                <th class="p-3">ประเภท</th>
                <th class="p-3">พิกัด (Lat / Lon)</th>
                <th class="p-3 text-center">มุมยกต่ำสุด</th>
                <th class="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sky-500/10">
              <tr
                v-for="(loc, idx) in filteredLocations"
                :key="loc.id"
                class="hover:bg-sky-900/20 transition-colors"
              >
                <!-- Toggle enabled -->
                <td class="p-3 text-center">
                  <input
                    type="checkbox"
                    :checked="loc.enabled"
                    class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-sky-500/30 focus:ring-sky-400 cursor-pointer"
                    @change="toggleLocation(loc)"
                  />
                </td>
                <td class="p-3 font-semibold text-white">
                  <div class="flex items-center gap-2">
                    <span
                      class="p-1 rounded-sm"
                      :class="loc.type === 'ground-station' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'"
                    >
                      <Radio v-if="loc.type === 'ground-station'" class="w-3.5 h-3.5" />
                      <Crosshair v-else class="w-3.5 h-3.5" />
                    </span>
                    <span>{{ loc.name }}</span>
                  </div>
                </td>
                <td class="p-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    :class="loc.type === 'ground-station' ? 'bg-sky-950 text-sky-300 border border-sky-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'"
                  >
                    {{ loc.type === 'ground-station' ? 'สถานีภาคพื้น' : 'เป้าหมาย' }}
                  </span>
                </td>
                <td class="p-3 font-mono text-slate-300">
                  {{ loc.latitude.toFixed(4) }}°N, {{ loc.longitude.toFixed(4) }}°E
                </td>
                <td class="p-3 text-center font-bold text-sky-300">
                  ≥ {{ loc.minElevationDeg }}°
                </td>
                <td class="p-3 text-right">
                  <button
                    type="button"
                    class="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="ลบออกจากระบบ"
                    @click="removeLocation(idx)"
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
          เปิดใช้งาน {{ props.locations.filter(l => l.enabled).length }} จาก {{ props.locations.length }} สถานี
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
