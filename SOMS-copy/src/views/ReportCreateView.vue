<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/ReportCreateView.vue
 * วัตถุประสงค์: หน้าจอสร้างรายงานภารกิจดาวเทียมใหม่ (Create Mission Report Form)
 * ออกแบบเป็นแบบฟอร์ม 6 ส่วนตามขั้นตอนอย่างเป็นระเบียบ สบายตา ใช้งานง่าย
 * พร้อมฟังก์ชันเพิ่ม/ลดแถวภารกิจและข้อขัดข้องแบบ Real-time
 * ============================================================================
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api/client'
import { useDataStore } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import {
  Rocket,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Activity,
  Cpu,
  ShieldAlert,
  Users,
  FileCheck
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const dataStore = useDataStore()
const appStore = useAppStore()

const loading = ref(false)
const submitting = ref(false)
const passes = ref([])

// Form Model
const form = ref({
  norad_id: '46320',
  sat_seq: 1,
  pass_id: '',
  sat_flight_pass: '',
  sat_gsostatus: 'Normal',
  sat_mcs: 'Active',
  sat_pdhufreespace: '',
  sat_lastimg: '',
  sat_next_pass: '',
  sat_md: '',
  sat_fmo: '',
  sat_gso: '',
  approaching: '1',
  sat_note: '',
  missions: [
    { mission_id: '', logmission_name: '', logmission_result: 'เรียบร้อย' }
  ],
  troubles: []
})

// ดึงข้อมูล Passes และ Lookups
onMounted(async () => {
  loading.value = true
  await dataStore.fetchLookups()

  try {
    const passList = await api.get('/passes')
    passes.value = passList || []

    // หากมีการส่ง Query pass มาจากหน้า Pass Detail ให้เลือกอัตโนมัติ
    const queryPass = route.query.pass
    if (queryPass) {
      const found = passes.value.find(p => String(p.id) === String(queryPass))
      if (found) {
        form.value.norad_id = String(found.satellite_id)
        form.value.pass_id = String(found.id)
        form.value.sat_seq = found.sat_seq || 1
      }
    }

    // กำหนดค่าเริ่มต้นเจ้าหน้าที่
    const mdUser = dataStore.lookups.users.find(u => u.rbac_role === 'MD')
    const fmoUser = dataStore.lookups.users.find(u => u.rbac_role === 'FMO')
    const gsoUser = dataStore.lookups.users.find(u => u.rbac_role === 'GSO')

    if (mdUser) form.value.sat_md = mdUser.rbac_id
    if (fmoUser) form.value.sat_fmo = fmoUser.rbac_id
    if (gsoUser) form.value.sat_gso = gsoUser.rbac_id

    // ตั้งค่าภารกิจแรกเริ่มต้น
    if (dataStore.lookups.missions.length > 0) {
      form.value.missions[0].mission_id = dataStore.lookups.missions[0].mission_id
    }
  } catch (err) {
    console.error('โหลดข้อมูลสร้างรายงานผิดพลาด:', err)
  } finally {
    loading.value = false
  }
})

// พาสที่ตรงกับดาวเทียมที่เลือก
const filteredPasses = computed(() => {
  return passes.value.filter(p => String(p.satellite_id) === String(form.value.norad_id))
})

// จัดกลุ่มพาสตามวันที่
const groupedPassOptions = computed(() => {
  const groups = {}
  for (const p of filteredPasses.value) {
    const date = p.aos_date_utc || 'Unscheduled'
    if (!groups[date]) groups[date] = []
    groups[date].push(p)
  }
  return groups
})

watch(() => form.value.norad_id, () => {
  // เมื่อเปลี่ยนดาวเทียม ให้รีเซ็ตค่า pass_id ที่เลือกไว้
  const available = filteredPasses.value
  if (available.length > 0) {
    form.value.pass_id = available[0].id
  } else {
    form.value.pass_id = ''
  }
})

// จัดการแถวภารกิจ (Missions)
const addMissionRow = () => {
  const defaultId = dataStore.lookups.missions[0]?.mission_id || ''
  form.value.missions.push({
    mission_id: defaultId,
    logmission_name: '',
    logmission_result: 'เรียบร้อย'
  })
}

const removeMissionRow = (index) => {
  if (form.value.missions.length <= 1) {
    appStore.showToast('ข้อกำหนด', 'ต้องมีรายการภารกิจอย่างน้อย 1 รายการ', 'warning')
    return
  }
  form.value.missions.splice(index, 1)
}

// จัดการแถวข้อขัดข้อง (Troubles)
const addTroubleRow = () => {
  const defaultId = dataStore.lookups.troubles[0]?.trouble_id || ''
  form.value.troubles.push({
    trouble_id: defaultId,
    logtrouble_name: '',
    logtrouble_result: 'เรียบร้อย'
  })
}

const removeTroubleRow = (index) => {
  form.value.troubles.splice(index, 1)
}

// บันทึกรายงานภารกิจ
const handleSubmit = async () => {
  if (!form.value.pass_id) {
    appStore.showToast('ข้อมูลไม่ครบ', 'กรุณาเลือกรอบพาสดาวเทียม (AOS-LOS)', 'warning')
    return
  }
  if (!form.value.sat_flight_pass.trim()) {
    appStore.showToast('ข้อมูลไม่ครบ', 'กรุณาระบุหมายเลข Flight pass', 'warning')
    return
  }

  submitting.value = true
  try {
    const payload = {
      pass_id: Number(form.value.pass_id),
      sat_seq: Number(form.value.sat_seq),
      sat_flight_pass: form.value.sat_flight_pass.trim(),
      sat_gsostatus: form.value.sat_gsostatus,
      sat_mcs: form.value.sat_mcs,
      sat_pdhufreespace: form.value.sat_pdhufreespace,
      sat_lastimg: form.value.sat_lastimg,
      sat_next_pass: form.value.sat_next_pass,
      sat_md: Number(form.value.sat_md),
      sat_fmo: Number(form.value.sat_fmo),
      sat_gso: Number(form.value.sat_gso),
      approaching: Number(form.value.approaching),
      sat_note: form.value.sat_note,
      missions: form.value.missions.map(m => ({
        mission_id: Number(m.mission_id),
        logmission_name: m.logmission_name,
        logmission_result: m.logmission_result
      })),
      troubles: form.value.troubles.map(t => ({
        trouble_id: Number(t.trouble_id),
        logtrouble_name: t.logtrouble_name,
        logtrouble_result: t.logtrouble_result
      }))
    }

    const result = await api.post('/reports', payload)
    appStore.showToast('สร้างรายงานสำเร็จ', `บันทึกรายงาน Flight No. ${payload.sat_flight_pass} เรียบร้อย`)
    router.push('/reports')
  } catch (err) {
    appStore.showToast('บันทึกล้มเหลว', err.message, 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
      <div>
        <div class="flex items-center gap-2">
          <Rocket class="w-6 h-6 text-zinc-300" />
          <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white">
            บันทึกภารกิจดาวเทียม (Create Mission Report)
          </h1>
        </div>
        <p class="text-xs text-zinc-400 mt-1">
          กรอกข้อมูลบันทึกผลการปฏิบัติการดาวเทียมประจำพาส/รอบปฏิบัติการ (6 ส่วน)
        </p>
      </div>

      <router-link
        to="/reports"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-2xs"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>ย้อนกลับ</span>
      </router-link>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 1. Pass Information -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
          <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">1</span>
          <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
            <Layers class="w-4 h-4 text-zinc-400" />
            <span>ข้อมูลพาสดาวเทียม (Pass Information)</span>
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Satellite -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              ดาวเทียม <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.norad_id"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
            >
              <option value="46320">NAPA-1 N (46320)</option>
              <option value="48963">NAPA-2 N (48963)</option>
            </select>
          </div>

          <!-- Pass Sequence -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              รอบพาส (Pass Name) <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.sat_seq"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
            >
              <option :value="1">DayPass 1</option>
              <option :value="2">DayPass 2</option>
              <option :value="3">NightPass 1</option>
              <option :value="4">NightPass 2</option>
            </select>
          </div>

          <!-- Pass Time AOS-LOS -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              ช่วงเวลา AOS-LOS (UTC) <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.pass_id"
              required
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
            >
              <option value="" disabled>-- เลือกรอบพาส --</option>
              <optgroup v-for="(list, date) in groupedPassOptions" :key="date" :label="`วันที่ ${date}`">
                <option v-for="p in list" :key="p.id" :value="p.id">
                  {{ p.aos_time_utc }} - {{ p.los_time_utc }} (El. {{ p.maxEl }}°)
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Flight Pass No -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Flight Pass No. <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="form.sat_flight_pass"
              type="text"
              required
              placeholder="เช่น 105/2026"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 font-mono"
            />
          </div>
        </div>
      </section>

      <!-- 2. Mission & Results -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">2</span>
            <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
              <Activity class="w-4 h-4 text-zinc-400" />
              <span>ภารกิจและผลการปฏิบัติ (Mission & Results)</span>
            </h3>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-semibold transition-colors"
            @click="addMissionRow"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>เพิ่มภารกิจ</span>
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(row, idx) in form.missions"
            :key="idx"
            class="p-3.5 rounded-xl border border-zinc-750 bg-zinc-850/80 flex flex-col sm:flex-row items-center gap-3"
          >
            <span class="w-6 text-center text-xs font-bold text-zinc-400 font-mono">#{{ idx + 1 }}</span>

            <!-- Mission Select -->
            <div class="flex-1 w-full">
              <select
                v-model="row.mission_id"
                required
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="" disabled>-- เลือกภารกิจ --</option>
                <option v-for="m in dataStore.lookups.missions" :key="m.mission_id" :value="m.mission_id">
                  {{ m.mission_name }}
                </option>
              </select>
            </div>

            <!-- Details -->
            <div class="flex-1 w-full">
              <input
                v-model="row.logmission_name"
                type="text"
                placeholder="รายละเอียดเพิ่มเติม (เช่น พื้นที่ถ่ายภาพ หรือพารามิเตอร์)"
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <!-- Result -->
            <div class="w-full sm:w-36">
              <select
                v-model="row.logmission_result"
                required
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="เรียบร้อย">เรียบร้อย</option>
                <option value="ไม่เรียบร้อย">ไม่เรียบร้อย</option>
                <option value="ดำเนินการต่อ">ดำเนินการต่อ</option>
              </select>
            </div>

            <!-- Remove Button -->
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="ลบแถวภารกิจนี้"
              @click="removeMissionRow(idx)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- 3. Systems Status -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
          <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">3</span>
          <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu class="w-4 h-4 text-zinc-400" />
            <span>สถานะระบบและอุปกรณ์ (Systems Status)</span>
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Ground Station
            </label>
            <select
              v-model="form.sat_gsostatus"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="Normal">Normal</option>
              <option value="Not Active">Not Active</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Mission Control System (MCS)
            </label>
            <select
              v-model="form.sat_mcs"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="Active">Active</option>
              <option value="Not Active">Not Active</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              PDHU Free Space (GB)
            </label>
            <input
              v-model="form.sat_pdhufreespace"
              type="text"
              placeholder="เช่น 48.5"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Last-Img (Session ID)
            </label>
            <input
              v-model="form.sat_lastimg"
              type="text"
              placeholder="เช่น 1942"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
        </div>
      </section>

      <!-- 4. Troubleshooting -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">4</span>
            <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert class="w-4 h-4 text-amber-400" />
              <span>การแก้ไขข้อขัดข้อง (Troubleshooting)</span>
            </h3>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-xs font-semibold transition-colors"
            @click="addTroubleRow"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>เพิ่มข้อขัดข้อง</span>
          </button>
        </div>

        <div v-if="form.troubles.length > 0" class="space-y-3">
          <div
            v-for="(row, idx) in form.troubles"
            :key="idx"
            class="p-3.5 rounded-xl border border-zinc-750 bg-zinc-850/80 flex flex-col sm:flex-row items-center gap-3"
          >
            <span class="w-6 text-center text-xs font-bold text-zinc-400 font-mono">#{{ idx + 1 }}</span>

            <!-- Trouble Select -->
            <div class="flex-1 w-full">
              <select
                v-model="row.trouble_id"
                required
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="" disabled>-- เลือกข้อขัดข้อง --</option>
                <option v-for="t in dataStore.lookups.troubles" :key="t.trouble_id" :value="t.trouble_id">
                  [{{ dataStore.getSubsystemName(t.sub_id) }}] {{ t.trouble_name }}
                </option>
              </select>
            </div>

            <!-- Fix action -->
            <div class="flex-1 w-full">
              <input
                v-model="row.logtrouble_name"
                type="text"
                placeholder="การดำเนินการแก้ไขปัญหา"
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <!-- Result -->
            <div class="w-full sm:w-36">
              <select
                v-model="row.logtrouble_result"
                required
                class="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="เรียบร้อย">เรียบร้อย</option>
                <option value="ไม่เรียบร้อย">ไม่เรียบร้อย</option>
                <option value="ดำเนินการต่อ">ดำเนินการต่อ</option>
              </select>
            </div>

            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              @click="removeTroubleRow(idx)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-else class="text-xs text-zinc-400 text-center py-2">
          ไม่พบข้อขัดข้องในพาสนี้ (กด "เพิ่มข้อขัดข้อง" หากพบความผิดปกติ)
        </p>

        <!-- Next pass action textarea -->
        <div>
          <label class="block text-xs font-semibold text-zinc-300 mb-1">
            การดำเนินการในพาสถัดไป (Next Pass Actions)
          </label>
          <textarea
            v-model="form.sat_next_pass"
            rows="2"
            placeholder="งานที่ต้องส่งต่อหรือดำเนินการต่อเนื่องในรอบพาสถัดไป"
            class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          ></textarea>
        </div>
      </section>

      <!-- 5. Responsible Staff -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
          <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">5</span>
          <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
            <Users class="w-4 h-4 text-zinc-400" />
            <span>เจ้าหน้าที่ผู้รับผิดชอบ (Responsible Staff)</span>
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- MD -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Mission Director (MD) <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.sat_md"
              required
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="" disabled>-- เลือก MD --</option>
              <option v-for="u in dataStore.lookups.users" :key="u.rbac_id" :value="u.rbac_id">
                {{ u.rbac_fullname }}
              </option>
            </select>
          </div>

          <!-- FMO -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Flight & Mission Operator (FMO) <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.sat_fmo"
              required
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="" disabled>-- เลือก FMO --</option>
              <option v-for="u in dataStore.lookups.users" :key="u.rbac_id" :value="u.rbac_id">
                {{ u.rbac_fullname }}
              </option>
            </select>
          </div>

          <!-- GSO -->
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Ground Station Operator (GSO) <span class="text-rose-400">*</span>
            </label>
            <select
              v-model="form.sat_gso"
              required
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="" disabled>-- เลือก GSO --</option>
              <option v-for="u in dataStore.lookups.users" :key="u.rbac_id" :value="u.rbac_id">
                {{ u.rbac_fullname }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- 6. Status & Notes -->
      <section class="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
          <span class="w-6 h-6 rounded-full bg-zinc-700 text-zinc-100 border border-zinc-500/60 text-xs font-bold flex items-center justify-center">6</span>
          <h3 class="text-sm font-bold font-prompt text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck class="w-4 h-4 text-zinc-400" />
            <span>สถานะโดยรวมและหมายเหตุ (Status & Notes)</span>
          </h3>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              Napa Approaching Status
            </label>
            <select
              v-model="form.approaching"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="1">1: ใช้งานได้ปกติ (Normal Operation)</option>
              <option value="2">2: ใช้งานไม่ได้ระหว่างพาส (Degraded During Pass)</option>
              <option value="3">3: ใช้งานไม่ได้ (Out of Service)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              v-model="form.sat_note"
              rows="3"
              placeholder="บันทึกข้อคิดเห็นหรือข้อสังเกตเพิ่มเติมของชุดปฏิบัติการ"
              class="w-full px-3 py-2 text-xs rounded-xl border border-zinc-700 bg-zinc-850 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Submit Actions -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <router-link
          to="/reports"
          class="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-2xs"
        >
          ยกเลิก
        </router-link>

        <button
          type="submit"
          :disabled="submitting"
          class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 border border-zinc-500/60 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-black/40 transition-all active:scale-[0.98]"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-400" />
          <span>{{ submitting ? 'กำลังบันทึกรายงาน...' : 'บันทึกรายงานภารกิจ' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
