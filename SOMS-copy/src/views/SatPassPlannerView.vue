<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/SatPassPlannerView.vue
 * วัตถุประสงค์: หน้าจอวางแผนและจำลองพาสดาวเทียมแบบมัลติฟังก์ชัน (Multifunctional SAT PASS PLANNER)
 * ธีมดำเทาไททาเนียม คอนทราสต์สูง สบายตา ใช้งานง่ายบนทุกขนาดหน้าจอ
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import { api } from '@/api/client'
import { targetPresets, satelliteSpecs } from '@/config'
import {
  Compass,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  MapPin,
  Orbit,
  Cpu,
  Layers,
  CheckCircle2,
  FilePlus,
  HelpCircle,
  Sliders,
  Send,
  Columns2,
  Map,
  Table,
  CalendarDays,
  Play,
  Download,
  Filter,
  AlertTriangle,
  Radio,
  Search,
  Check
} from 'lucide-vue-next'

const router = useRouter()
const appStore = useAppStore()
const dataStore = useDataStore()

// โหมดแท็บการทำงาน (Multifunctional Tabs)
// 'simulator' | 'soms_passes' | 'specs' | 'targets' | 'sop'
const activeTab = ref('simulator')
const isFullscreen = ref(false)
const iframeLoading = ref(true)
const iframeKey = ref(1)
const iframeRef = ref(null)

// โหมดมุมมองการจำลองบนหน้าจอแคบ/มือถือ (Simulator View Modes)
const simulatorViewMode = ref('split')

// --- ข้อมูลรอบพาสจากระบบ SOMS (SOMS Data Integration) ---
const somsPasses = ref([])
const somsLoading = ref(false)
const somsSatFilter = ref('all') // 'all' | '46320' | '48963'
const somsStatusFilter = ref('all') // 'all' | 'today' | 'upcoming' | 'high_el' | 'low_el'
const somsSearch = ref('')

const fetchSomsPasses = async (silent = false) => {
  if (!silent) somsLoading.value = true
  try {
    const data = await api.get('/passes')
    somsPasses.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('โหลดรอบพาส SOMS ไม่สำเร็จ:', err)
  } finally {
    if (!silent) somsLoading.value = false
  }
}

const todayIso = new Date().toISOString().slice(0, 10)

const processedSomsPasses = computed(() => {
  const nowTs = Date.now()
  return somsPasses.value.map(p => {
    const aosDate = new Date(`${p.aos_date_utc}T${p.aos_time_utc}Z`)
    const isUpcoming = aosDate.getTime() > nowTs
    const isToday = p.aos_date_utc === todayIso || (p.aos_date_local && p.aos_date_local.includes(todayIso))
    const maxElevation = Number(p.maxEl) || 0
    const isLowElevation = maxElevation < 5
    const isOverhead = maxElevation >= 45
    const isHighElevation = maxElevation >= 20
    const satName = Number(p.satellite_id) === 46320 ? 'NAPA-1 N' : Number(p.satellite_id) === 48963 ? 'NAPA-2 N' : (p.sat_name || `SAT-${p.satellite_id}`)
    const passSeqName = dataStore.getPassName(p.sat_seq)

    return {
      ...p,
      satellite_name: satName,
      pass_name: passSeqName,
      utc_time: `${p.aos_date_utc} ${p.aos_time_utc} – ${p.los_time_utc}`,
      local_date: p.aos_date_local || p.aos_date_utc,
      local_time: `${p.aos_time_local} – ${p.los_time_local}`,
      duration_label: `${p.duration_min}น. ${p.duration_sec}วิ.`,
      maxElevation,
      isLowElevation,
      isOverhead,
      isHighElevation,
      isUpcoming,
      isToday,
      aosDate
    }
  })
})

const filteredSomsPasses = computed(() => {
  let list = processedSomsPasses.value

  // ตัวกรองดาวเทียม
  if (somsSatFilter.value !== 'all') {
    list = list.filter(p => String(p.satellite_id) === String(somsSatFilter.value))
  }

  // ตัวกรองสถานะ / มุมยก
  if (somsStatusFilter.value === 'today') {
    list = list.filter(p => p.isToday)
  } else if (somsStatusFilter.value === 'upcoming') {
    list = list.filter(p => p.isUpcoming)
  } else if (somsStatusFilter.value === 'high_el') {
    list = list.filter(p => p.maxElevation >= 20)
  } else if (somsStatusFilter.value === 'low_el') {
    list = list.filter(p => p.isLowElevation)
  }

  // ค้นหาข้อความ
  if (somsSearch.value.trim()) {
    const q = somsSearch.value.trim().toLowerCase()
    list = list.filter(p =>
      p.satellite_name.toLowerCase().includes(q) ||
      (p.pass_name && p.pass_name.toLowerCase().includes(q)) ||
      (p.comments && p.comments.toLowerCase().includes(q)) ||
      String(p.id).includes(q)
    )
  }

  return list
})

// สถิติสรุปพาส SOMS
const somsStats = computed(() => {
  const all = processedSomsPasses.value
  const total = all.length
  const today = all.filter(p => p.isToday).length
  const upcoming = all.filter(p => p.isUpcoming).length
  const highEl = all.filter(p => p.maxElevation >= 20).length
  const lowEl = all.filter(p => p.isLowElevation).length
  const overhead = all.filter(p => p.maxElevation >= 45).length
  const normal = total - lowEl
  return { total, today, upcoming, highEl, lowEl, overhead, normal }
})

// พาสล่าสุด/ถัดไปสำหรับ Quick Bar ใน Simulator Tab
const quickSomsPasses = computed(() => {
  return processedSomsPasses.value.slice(0, 6)
})

// เครื่องคำนวณจำลอง GSD ตามมุม Roll Angle (ความละเอียดเชิงพื้นที่เมื่อเอียงกล้อง)
const calcSatId = ref('48963')
const calcRoll = ref(15)

const selectedSatSpec = computed(() => {
  return satelliteSpecs.find(s => s.id === calcSatId.value) || satelliteSpecs[0]
})

// สูตร GSD ตามมุมเอียง: GSD(theta) = NadirGSD / cos^2(theta)
const computedGsd = computed(() => {
  const rad = (calcRoll.value * Math.PI) / 180
  const factor = 1 / Math.pow(Math.cos(rad), 2)
  return (selectedSatSpec.value.gsdM * factor).toFixed(2)
})

// นำพิกัดเป้าหมายส่งเข้าไปยังตัวคำนวณใน Iframe อัตโนมัติ (Same-origin communication)
const applyPresetToPlanner = (preset) => {
  activeTab.value = 'simulator'
  try {
    const iframeWin = iframeRef.value?.contentWindow
    const iframeDoc = iframeWin?.document
    if (iframeDoc) {
      const latInput = iframeDoc.getElementById('lat')
      const lonInput = iframeDoc.getElementById('lon')
      if (latInput && lonInput) {
        latInput.value = preset.lat
        lonInput.value = preset.lon
        latInput.dispatchEvent(new Event('input', { bubbles: true }))
        lonInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (typeof iframeWin?.setTgt === 'function') {
        iframeWin.setTgt(preset.lat, preset.lon)
      }
      if (typeof iframeWin?.calc === 'function') {
        iframeWin.calc()
      }
      if (iframeWin?.map) {
        iframeWin.map.setView([preset.lat, preset.lon], 6)
        iframeWin.map.invalidateSize()
      }
      appStore.showToast('เลือกพิกัดแล้ว', `ส่งพิกัด ${preset.name} (Lat: ${preset.lat}, Lon: ${preset.lon}) เข้าสู่ตัวจำลองเรียบร้อย`)
    }
  } catch (err) {
    console.warn('สื่อสารกับ Planner ไม่สำเร็จ:', err)
  }
}

// 1-Click จำลองพาส SOMS ใน Simulator
const simulateSomsPass = (pass) => {
  activeTab.value = 'simulator'
  try {
    const iframeWin = iframeRef.value?.contentWindow
    const iframeDoc = iframeWin?.document
    if (!iframeDoc) return

    // พิกัดสถานีภาคพื้นดิน RTAF บน.6 ดอนเมือง (สถานีรับสัญญาณหลักของ SOMS)
    const stLat = 13.9125
    const stLon = 100.6067
    const dateStr = pass.aos_date_utc || todayIso

    // เรียก helper function ของ planner ถ้ามี
    if (typeof iframeWin.loadSomsPass === 'function') {
      iframeWin.loadSomsPass(pass.satellite_id, stLat, stLon, dateStr)
    } else {
      // Fallback: ตั้งค่าผ่าน DOM
      const latInput = iframeDoc.getElementById('lat')
      const lonInput = iframeDoc.getElementById('lon')
      const dsInput = iframeDoc.getElementById('date-start')
      const deInput = iframeDoc.getElementById('date-end')

      if (latInput && lonInput) {
        latInput.value = stLat
        lonInput.value = stLon
        latInput.dispatchEvent(new Event('input', { bubbles: true }))
        lonInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (dsInput && deInput && dateStr) {
        dsInput.value = dateStr
        deInput.value = dateStr
        dsInput.dispatchEvent(new Event('change', { bubbles: true }))
        deInput.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // ติ๊กเลือกเฉพาะดาวเทียมนี้
      const allSatCheckboxes = iframeDoc.querySelectorAll('input[id^="chk_"]')
      allSatCheckboxes.forEach(chk => {
        chk.checked = (chk.id === `chk_${pass.satellite_id}`)
      })
      if (typeof iframeWin.updateSpecBox === 'function') {
        iframeWin.updateSpecBox()
      }

      if (typeof iframeWin.setTgt === 'function') {
        iframeWin.setTgt(stLat, stLon)
      }
      if (iframeWin.map) {
        iframeWin.map.setView([stLat, stLon], 6)
        iframeWin.map.invalidateSize()
      }
      if (typeof iframeWin.calc === 'function') {
        iframeWin.calc()
      }
    }

    appStore.showToast(
      'โหลดพาสจาก SOMS แล้ว',
      `จำลองพาส ${pass.satellite_name} #${pass.id} (${pass.pass_name || ''}) วันที่ ${dateStr} เรียบร้อย`
    )
  } catch (err) {
    console.warn('จำลองพาส SOMS ไม่สำเร็จ:', err)
  }
}

// สร้างรายงานภารกิจจากพาส SOMS
const createReportFromSomsPass = (pass) => {
  router.push(`/reports/new?pass=${pass.id}`)
}

// ส่งออกพาส SOMS เป็น CSV
const exportSomsPassesToCsv = () => {
  const rows = filteredSomsPasses.value
  if (!rows || rows.length === 0) {
    appStore.showToast('ไม่มีข้อมูล', 'ไม่มีรายการรอบพาสสำหรับส่งออกในขณะนี้', 'warning')
    return
  }

  const headers = ['ลำดับ', 'รหัสพาส', 'ดาวเทียม', 'NORAD ID', 'รอบพาส', 'วันที่ (ไทย)', 'AOS (UTC)', 'LOS (UTC)', 'AOS (ไทย)', 'LOS (ไทย)', 'มุมยกสูงสุด (MaxEl)', 'ระยะเวลา', 'สถานะ', 'หมายเหตุ']
  const csvRows = [headers.join(',')]

  rows.forEach((r, idx) => {
    const row = [
      idx + 1,
      r.id,
      `"${r.satellite_name}"`,
      r.satellite_id,
      `"${r.pass_name || ''}"`,
      `"${r.local_date || ''}"`,
      `"${r.aos_time_utc}"`,
      `"${r.los_time_utc}"`,
      `"${r.aos_time_local}"`,
      `"${r.los_time_local}"`,
      r.maxElevation,
      `"${r.duration_min}m ${r.duration_sec}s"`,
      `"${r.isLowElevation ? 'Abort (<5°)' : r.isOverhead ? 'Overhead (≥45°)' : 'Ready'}"`,
      `"${r.comments || '-'}"`
    ]
    csvRows.push(row.join(','))
  })

  const csvContent = '\uFEFF' + csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `soms-passes-planner-${todayIso}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  appStore.showToast('ส่งออกสำเร็จ', `ดาวน์โหลดตารางพาส SOMS ${rows.length} รายการเป็นไฟล์ CSV เรียบร้อยแล้ว`)
}

// อัปเดตคลาสโหมดมุมมองใน Iframe และรีเฟรชขนาด Leaflet
const updateIframeViewModeClass = () => {
  try {
    const iframeWin = iframeRef.value?.contentWindow
    const iframeDoc = iframeWin?.document
    if (!iframeDoc || !iframeDoc.body) return

    iframeDoc.body.classList.remove('mode-map', 'mode-sats', 'mode-passes')
    if (simulatorViewMode.value === 'map') {
      iframeDoc.body.classList.add('mode-map')
    } else if (simulatorViewMode.value === 'sats') {
      iframeDoc.body.classList.add('mode-sats')
    } else if (simulatorViewMode.value === 'passes') {
      iframeDoc.body.classList.add('mode-passes')
    }

    setTimeout(() => {
      if (iframeWin?.map) {
        iframeWin.map.invalidateSize()
      }
    }, 150)
  } catch (err) {
    console.warn('อัปเดตโหมดมุมมองใน Iframe ล้มเหลว:', err)
  }
}

// สลับโหมดมุมมองการจำลอง
const setSimulatorViewMode = (mode) => {
  simulatorViewMode.value = mode
  updateIframeViewModeClass()
}

// ฉีดสไตล์ CSS ปรับปรุง Responsiveness เข้าสู่ Iframe เพื่อให้แผนที่และการแสดงผลเข้ากันได้ 100%
const injectResponsivePlannerStyles = () => {
  try {
    const iframeWin = iframeRef.value?.contentWindow
    const iframeDoc = iframeWin?.document
    if (!iframeDoc || !iframeDoc.head) return

    let styleEl = iframeDoc.getElementById('soms-responsive-planner-css')
    if (!styleEl) {
      styleEl = iframeDoc.createElement('style')
      styleEl.id = 'soms-responsive-planner-css'
      iframeDoc.head.appendChild(styleEl)
    }

    styleEl.textContent = `
      /* ป้องกันการล้นจอแนวนอนและแนวตั้ง 100% */
      html, body {
        width: 100% !important;
        height: 100% !important;
        max-width: 100vw !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #hdr {
        transition: padding 0.2s ease !important;
      }

      /* โหมด 0: โหมดรวม Split Mode (ค่าเริ่มต้น) ป้องกันตารางล้นไปบังตัวเลือกและแผนที่ */
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #main {
        display: flex !important;
        flex: 1 1 0 !important;
        min-height: 260px !important;
        height: auto !important;
        overflow: hidden !important;
        position: relative !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #sb {
        width: 320px !important;
        min-width: 250px !important;
        max-width: 480px !important;
        height: 100% !important;
        max-height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        flex-shrink: 0 !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #mwrap {
        flex: 1 1 0 !important;
        min-width: 200px !important;
        min-height: 0 !important;
        height: 100% !important;
        position: relative !important;
        overflow: hidden !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #map {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        inset: 0 !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #panel {
        flex: 0 0 240px !important;
        min-height: 120px !important;
        max-height: 48vh !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        z-index: 20 !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #panel.panel-collapsed {
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;
        overflow: hidden !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #panel.panel-collapsed #view-passes,
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #panel.panel-collapsed #view-timeline {
        display: none !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #view-passes {
        flex: 1 1 0 !important;
        min-height: 0 !important;
        height: calc(100% - 38px) !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #tblwrap {
        flex: 1 1 0 !important;
        min-height: 0 !important;
        height: 100% !important;
        max-height: 100% !important;
        overflow-y: auto !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
      body:not(.mode-map):not(.mode-sats):not(.mode-passes) #view-timeline {
        flex: 1 1 0 !important;
        min-height: 0 !important;
        height: calc(100% - 38px) !important;
        overflow: hidden !important;
      }

      @media (max-width: 860px) {
        #hdr {
          height: 38px !important;
          padding: 0 10px !important;
        }
        #hdr .sub {
          display: none !important;
        }
        #clk {
          font-size: 10px !important;
        }
        #main {
          display: flex !important;
          flex-direction: column !important;
          height: auto !important;
          min-height: 0 !important;
          overflow-y: visible !important;
        }
        #sb {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          border-right: none !important;
          border-bottom: 1px solid #232d3f !important;
          padding: 12px 10px !important;
          height: auto !important;
          overflow-y: visible !important;
          order: 2 !important;
        }
        #sb-resize {
          display: none !important;
        }
        #mwrap {
          width: 100% !important;
          height: 360px !important;
          min-height: 300px !important;
          flex: none !important;
          order: 1 !important;
          position: relative !important;
        }
        #map {
          width: 100% !important;
          height: 100% !important;
        }
        #panel-resize {
          display: none !important;
        }
        #panel {
          width: 100% !important;
          border-top: 1px solid #232d3f !important;
          order: 3 !important;
        }
        #tblwrap {
          height: 240px !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        #filterbar {
          padding: 6px 8px !important;
          overflow-x: auto !important;
          flex-wrap: nowrap !important;
          gap: 4px !important;
        }
        #minfo {
          font-size: 10px !important;
          padding: 4px 10px !important;
          top: 6px !important;
          max-width: 90% !important;
        }
      }

      /* โหมด 1: แผนที่เต็มพื้นที่ (Map Focus Mode) */
      body.mode-map #hdr {
        display: flex !important;
      }
      body.mode-map #sb,
      body.mode-map #sb-resize,
      body.mode-map #panel,
      body.mode-map #panel-resize {
        display: none !important;
      }
      body.mode-map #main {
        display: flex !important;
        flex-direction: column !important;
        height: calc(100vh - 48px) !important;
        min-height: 100% !important;
        overflow: hidden !important;
      }
      body.mode-map #mwrap {
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        flex: 1 !important;
        position: relative !important;
      }
      body.mode-map #map {
        width: 100% !important;
        height: 100% !important;
      }

      /* โหมด 2: เลือกดาวเทียมและพารามิเตอร์เต็มจอ (Satellites Focus Mode) */
      body.mode-sats #hdr {
        display: flex !important;
      }
      body.mode-sats #mwrap,
      body.mode-sats #sb-resize,
      body.mode-sats #panel,
      body.mode-sats #panel-resize {
        display: none !important;
      }
      body.mode-sats #main {
        display: block !important;
        height: calc(100vh - 48px) !important;
        overflow-y: auto !important;
      }
      body.mode-sats #sb {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        border-right: none !important;
        height: auto !important;
        padding: 14px !important;
        overflow-y: visible !important;
        display: flex !important;
      }

      /* โหมด 3: ตารางรอบพาสและไทม์ไลน์ (Passes Table Focus Mode) */
      body.mode-passes #hdr {
        display: flex !important;
      }
      body.mode-passes #main,
      body.mode-passes #sb-resize,
      body.mode-passes #panel-resize {
        display: none !important;
      }
      body.mode-passes #panel {
        display: flex !important;
        flex-direction: column !important;
        height: calc(100vh - 48px) !important;
        border-top: none !important;
        width: 100% !important;
      }
      body.mode-passes #tblwrap {
        flex: 1 !important;
        height: 100% !important;
      }
      body.mode-passes #view-timeline {
        flex: 1 !important;
        height: 100% !important;
      }

      /* ปรับแต่งปุ่มควบคุมแผนที่ Leaflet ในธีม Obsidian Charcoal */
      .leaflet-control-zoom {
        border-radius: 8px !important;
        overflow: hidden !important;
        border: 1px solid #283548 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
      }
      .leaflet-control-zoom a {
        background: #151c27 !important;
        color: #e2e8f0 !important;
        border-bottom: 1px solid #283548 !important;
      }
      .leaflet-control-zoom a:hover {
        background: #1c2637 !important;
        color: #ffffff !important;
      }
      .leaflet-control-attribution {
        background: rgba(16,20,27,0.88) !important;
        color: #94a3b8 !important;
        font-size: 9px !important;
        border-radius: 4px !important;
        margin: 4px !important;
        padding: 2px 6px !important;
      }
      .leaflet-control-attribution a {
        color: #38bdf8 !important;
      }
    `
    updateIframeViewModeClass()
  } catch (err) {
    console.warn('ไม่สามารถฉีดสไตล์ลง Iframe:', err)
  }
}

// เรียกดึงข้อมูล TLE ทั้งหมดใน Iframe
const triggerFetchAllTLEs = () => {
  try {
    if (typeof iframeRef.value?.contentWindow?.fetchAllTLEs === 'function') {
      iframeRef.value.contentWindow.fetchAllTLEs()
      appStore.showToast('กำลังดึง TLE', 'ระบบกำลังอัปเดตข้อมูลวงโคจรจากเครือข่าย')
    }
  } catch (err) {
    console.warn('เรียก fetchAllTLEs ไม่ได้:', err)
  }
}

// สั่งคำนวณพาสใน Iframe
const triggerCalculate = () => {
  try {
    if (typeof iframeRef.value?.contentWindow?.calc === 'function') {
      iframeRef.value.contentWindow.calc()
      appStore.showToast('กำลังประมวลผล', 'ระบบกำลังจำลองการโคจรผ่านเป้าหมาย')
    }
  } catch (err) {
    console.warn('เรียก calc ไม่ได้:', err)
  }
}

// สลับโหมดเต็มจอ
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  setTimeout(() => {
    if (iframeRef.value?.contentWindow?.map) {
      iframeRef.value.contentWindow.map.invalidateSize()
    }
  }, 200)
}

// เชื่อมต่อไปสร้างรายงานภารกิจ SOMS
const navigateToCreateReport = () => {
  router.push('/reports/new')
}

const reloadIframe = () => {
  iframeLoading.value = true
  iframeKey.value++
}

const onIframeLoad = () => {
  iframeLoading.value = false
  injectResponsivePlannerStyles()
}

const handleWindowResize = () => {
  if (iframeRef.value?.contentWindow?.map) {
    iframeRef.value.contentWindow.map.invalidateSize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  dataStore.fetchLookups()
  fetchSomsPasses()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})

// เฝ้าติดตามการกด Refresh ของแอป
watch(() => appStore.refreshTrigger, () => {
  fetchSomsPasses(true)
})
</script>

<template>
  <div
    class="transition-all duration-200 font-prompt"
    :class="isFullscreen ? 'fixed inset-0 z-50 bg-[#090b0f] p-2 sm:p-3 overflow-hidden flex flex-col' : 'space-y-4'"
  >
    <!-- Top Header & Multifunctional Toolbar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3.5 border-b border-slate-700/80 bg-gradient-to-r from-[#141e32] via-[#0f1728] to-[#121c2e] p-4 sm:p-5 rounded-3xl border border-slate-700/80 shadow-xl">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/50 text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-950/40">
            <Compass class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-lg sm:text-2xl font-black font-prompt text-white tracking-wide flex items-center gap-2">
                SAT PASS PLANNER
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/70 shadow-xs">
                22 SATS ACTIVE
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-sky-950/80 text-sky-300 border border-sky-600/70 flex items-center gap-1.5 shadow-xs">
                <Radio class="w-3 h-3 text-emerald-400 animate-pulse" />
                SOMS INTEGRATED
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 font-prompt">
              ศูนย์วางแผนและจำลองการโคจรผ่านดาวเทียม (SGP4 Orbital Propagator & Target Feasibility)
            </p>
          </div>
        </div>
      </div>

      <!-- Multifunction Action Controls -->
      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <!-- TLE Fetch Action -->
        <button
          type="button"
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer font-prompt"
          title="อัปเดตข้อมูลวงโคจร TLE ของดาวเทียมทั้งหมด"
          @click="triggerFetchAllTLEs"
        >
          <RefreshCw class="w-3.5 h-3.5 text-zinc-400" />
          <span class="hidden sm:inline">ดึง TLE ล่าสุด</span>
          <span class="sm:hidden">ดึง TLE</span>
        </button>

        <!-- Calculate Trigger -->
        <button
          type="button"
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs font-semibold shadow-xs transition-colors cursor-pointer font-prompt"
          title="สั่งคำนวณรอบพาสทันที"
          @click="triggerCalculate"
        >
          <Orbit class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">คำนวณพาส</span>
          <span class="sm:hidden">คำนวณ</span>
        </button>

        <!-- Dispatch to Report -->
        <button
          type="button"
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs font-semibold shadow-xs transition-colors cursor-pointer font-prompt"
          title="นำข้อมูลพาสไปจัดทำรายงานภารกิจใน SOMS"
          @click="navigateToCreateReport"
        >
          <FilePlus class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">ส่งไปสร้างรายงาน</span>
          <span class="sm:hidden">รายงาน</span>
        </button>

        <!-- Fullscreen Mode -->
        <button
          type="button"
          class="p-2 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white transition-colors shadow-xs cursor-pointer"
          :title="isFullscreen ? 'ย่อหน้าต่างกลับ' : 'ขยายเต็มหน้าจอ (Fullscreen)'"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="isFullscreen" class="w-4 h-4 text-amber-400" />
          <Maximize2 v-else class="w-4 h-4 text-zinc-400" />
        </button>

        <!-- Open in New Tab -->
        <a
          href="/planner/index.html"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white transition-colors shadow-xs"
          title="เปิดตัวจำลองในแท็บใหม่แยกต่างหาก"
        >
          <ExternalLink class="w-4 h-4 text-zinc-400" />
        </a>
      </div>
    </div>

    <!-- Navigation Tabs: Multifunctional Modes -->
    <div class="flex items-center gap-1 p-1 rounded-2xl bg-space-850 border border-space-700 overflow-x-auto scrollbar-none text-xs font-semibold select-none">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        :class="activeTab === 'simulator'
          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-white hover:bg-space-800'"
        @click="activeTab = 'simulator'"
      >
        <Compass class="w-4 h-4" />
        <span class="hidden sm:inline">จำลองพาสและแผนที่ (Simulator)</span>
        <span class="sm:hidden">จำลอง & แผนที่</span>
      </button>

      <!-- Tab SOMS Passes -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        :class="activeTab === 'soms_passes'
          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-white hover:bg-space-800'"
        @click="activeTab = 'soms_passes'"
      >
        <CalendarDays class="w-4 h-4 text-zinc-300" />
        <span class="hidden sm:inline">รอบพาสจากระบบ SOMS (SOMS Passes)</span>
        <span class="sm:hidden">รอบพาส SOMS</span>
        <span v-if="somsPasses.length" class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-space-800 text-zinc-300 border border-space-700">
          {{ somsPasses.length }}
        </span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        :class="activeTab === 'specs'
          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-white hover:bg-space-800'"
        @click="activeTab = 'specs'"
      >
        <Cpu class="w-4 h-4" />
        <span class="hidden sm:inline">สเปกเซนเซอร์และดาวเทียม (Specs)</span>
        <span class="sm:hidden">สเปกเซนเซอร์</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        :class="activeTab === 'targets'
          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-white hover:bg-space-800'"
        @click="activeTab = 'targets'"
      >
        <MapPin class="w-4 h-4" />
        <span class="hidden sm:inline">คลังพิกัดเป้าหมายยุทธการ (Targets)</span>
        <span class="sm:hidden">คลังพิกัด</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
        :class="activeTab === 'sop'
          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm font-semibold'
          : 'text-zinc-400 hover:text-white hover:bg-space-800'"
        @click="activeTab = 'sop'"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span class="hidden sm:inline">ระเบียบปฏิบัติและเงื่อนไข (SOP)</span>
        <span class="sm:hidden">เกณฑ์ SOP</span>
      </button>
    </div>

    <!-- TAB 1: Simulator & Interactive Map -->
    <div v-show="activeTab === 'simulator'" class="space-y-3">
      <!-- Quick Strategic Targets Bar & Simulator View Switcher -->
      <div class="p-2.5 sm:p-3 rounded-2xl bg-space-850 border border-space-700 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        <!-- Left: Quick Strategic Target Presets -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1 min-w-0">
          <div class="flex items-center gap-1 text-xs font-semibold text-white flex-shrink-0">
            <MapPin class="w-3.5 h-3.5 text-rose-400" />
            <span class="hidden sm:inline">เป้าหมายด่วน:</span>
          </div>
          <div class="flex items-center gap-1.5 flex-nowrap">
            <button
              v-for="preset in targetPresets"
              :key="preset.id"
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-space-700 bg-space-800 text-slate-200 hover:bg-space-750 hover:text-white transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
              :title="preset.desc"
              @click="applyPresetToPlanner(preset)"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- Right: Simulator View Mode Selector -->
        <div class="flex items-center justify-center gap-1 bg-space-900/80 p-1 rounded-xl flex-shrink-0 border border-space-700 self-stretch lg:self-auto">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial cursor-pointer"
            :class="simulatorViewMode === 'split' ? 'bg-zinc-800 text-white border border-zinc-600 shadow-xs' : 'text-zinc-400 hover:text-white'"
            @click="setSimulatorViewMode('split')"
            title="มุมมองรวม"
          >
            <Columns2 class="w-3.5 h-3.5" />
            <span>รวม (Split)</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial cursor-pointer"
            :class="simulatorViewMode === 'map' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-white'"
            @click="setSimulatorViewMode('map')"
            title="เน้นแผนที่เต็มจอ 100%"
          >
            <Map class="w-3.5 h-3.5" />
            <span>แผนที่</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial cursor-pointer"
            :class="simulatorViewMode === 'sats' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-white'"
            @click="setSimulatorViewMode('sats')"
            title="เน้นเลือกดาวเทียมและพารามิเตอร์"
          >
            <Orbit class="w-3.5 h-3.5" />
            <span>ดาวเทียม</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial cursor-pointer"
            :class="simulatorViewMode === 'passes' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-white'"
            @click="setSimulatorViewMode('passes')"
            title="เน้นตารางรอบพาสและไทม์ไลน์"
          >
            <Table class="w-3.5 h-3.5" />
            <span>รอบพาส</span>
          </button>
        </div>
      </div>

      <!-- Quick SOMS Passes Bar (ชิปรอบพาสล่าสุดจากโครงการ SOMS ดึงข้อมูลแบบ 1-Click) -->
      <div v-if="quickSomsPasses.length > 0" class="p-2.5 sm:p-3 rounded-2xl bg-space-850 border border-space-700 shadow-xs flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1 min-w-0">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 flex-shrink-0">
            <Radio class="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
            <span class="hidden sm:inline">พาสจากระบบ SOMS:</span>
            <span class="sm:hidden">พาส SOMS:</span>
          </div>
          <div class="flex items-center gap-1.5 flex-nowrap">
            <button
              v-for="pass in quickSomsPasses"
              :key="pass.id"
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-space-700 bg-space-800 text-slate-200 hover:bg-space-750 hover:text-white hover:border-zinc-500/50 transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
              :title="`คลิกเพื่อจำลองพาส ${pass.satellite_name} #${pass.id} (Max El: ${pass.maxElevation}°, เวลา: ${pass.utc_time})`"
              @click="simulateSomsPass(pass)"
            >
              <Orbit class="w-3 h-3 text-zinc-400" />
              <span class="font-bold text-white">{{ pass.satellite_name }}</span>
              <span class="text-zinc-400 font-mono">{{ pass.aos_time_utc?.slice(0, 5) }} UTC</span>
              <span
                class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold"
                :class="pass.isLowElevation ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50' : pass.isOverhead ? 'bg-zinc-800 text-zinc-200 border border-zinc-600' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'"
              >
                {{ pass.maxElevation }}°
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
          @click="activeTab = 'soms_passes'"
        >
          <span>ดูตารางพาส SOMS</span>
          <ExternalLink class="w-3 h-3" />
        </button>
      </div>

      <!-- Iframe Workspace -->
      <div
        class="relative w-full rounded-2xl border border-space-700 overflow-hidden bg-[#090b0f] shadow-xl transition-all"
        :class="isFullscreen ? 'flex-1 h-full min-h-0' : ''"
      >
        <!-- Loading Overlay -->
        <div
          v-if="iframeLoading"
          class="absolute inset-0 z-10 bg-[#090b0f]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-slate-300"
        >
          <RefreshCw class="w-8 h-8 text-zinc-400 animate-spin" />
          <p class="text-xs font-medium font-prompt">กำลังโหลดระบบ SAT PASS PLANNER...</p>
        </div>

        <!-- Embedded Planner Iframe (Redesigned Theme Matching SOMS-copy) -->
        <iframe
          ref="iframeRef"
          :key="iframeKey"
          src="/planner/index.html"
          title="Satellite Pass Planner Workspace"
          class="w-full border-0 transition-all"
          :class="isFullscreen ? 'h-full min-h-0' : 'h-[76vh] sm:h-[calc(100vh-13rem)] min-h-[620px] lg:min-h-[720px]'"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          @load="onIframeLoad"
        ></iframe>
      </div>
    </div>

    <!-- TAB 2: SOMS Scheduled Passes (รอบพาสจากโครงการ SOMS) -->
    <div v-show="activeTab === 'soms_passes'" class="space-y-4">
      <!-- Section Overview & Control Header -->
      <div class="bg-space-850 rounded-2xl p-4 sm:p-5 border border-space-700 shadow-md space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-700">
          <div>
            <h3 class="text-base font-bold font-prompt text-white flex items-center gap-2">
              <CalendarDays class="w-5 h-5 text-sky-400" />
              <span>รอบการผ่านของดาวเทียมจากระบบ SOMS (SOMS Pass Schedules)</span>
            </h3>
            <p class="text-xs text-zinc-400 mt-1">
              ตารางเวลาและพารามิเตอร์การผ่านสถานีภาคพื้นดินของกลุ่มดาวเทียม RTAF (NAPA-1 และ NAPA-2) จากฐานข้อมูล SOMS กดปุ่ม "จำลองพาส" เพื่อสั่งรัน SGP4 ในตัวจำลองทันที
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="ดึงข้อมูลรอบพาสล่าสุดจาก SOMS อีกครั้ง"
              @click="fetchSomsPasses(false)"
            >
              <RefreshCw class="w-3.5 h-3.5 text-zinc-400" :class="somsLoading ? 'animate-spin' : ''" />
              <span>รีเฟรชข้อมูล</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-space-600 bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="ส่งออกตารางรอบพาสเป็นไฟล์ CSV สำหรับ Excel"
              @click="exportSomsPassesToCsv"
            >
              <Download class="w-3.5 h-3.5 text-zinc-400" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        <!-- SOMS Pass Quick Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl bg-space-900 border border-space-700">
            <span class="text-[11px] text-zinc-400 block">พาสทั้งหมดในระบบ SOMS</span>
            <span class="text-lg font-bold font-mono text-white mt-0.5">{{ somsStats.total }} รอบ</span>
          </div>
          <div class="p-3 rounded-xl bg-space-900 border border-space-700">
            <span class="text-[11px] text-zinc-400 block">พาสพร้อมปฏิบัติการ</span>
            <span class="text-lg font-bold font-mono text-emerald-400 mt-0.5">{{ somsStats.normal }} รอบ</span>
          </div>
          <div class="p-3 rounded-xl bg-space-900 border border-space-700">
            <span class="text-[11px] text-zinc-400 block">พาสมุมสูงมาก (&ge; 45° Overhead)</span>
            <span class="text-lg font-bold font-mono text-sky-400 mt-0.5">{{ somsStats.overhead }} รอบ</span>
          </div>
          <div class="p-3 rounded-xl bg-space-900 border border-space-700">
            <span class="text-[11px] text-zinc-400 block">พาสมุมต่ำ (&lt; 5° Abort)</span>
            <span class="text-lg font-bold font-mono text-rose-400 mt-0.5">{{ somsStats.lowEl }} รอบ</span>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          <!-- Satellite Selector Chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
            <span class="text-zinc-400 text-xs font-medium mr-1 flex-shrink-0">ดาวเทียม:</span>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
              :class="somsSatFilter === 'all' ? 'bg-zinc-700 text-white border-zinc-500 shadow-xs' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
              @click="somsSatFilter = 'all'"
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
              :class="somsSatFilter === '46320' ? 'bg-zinc-700 text-white border-zinc-500 shadow-xs' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
              @click="somsSatFilter = '46320'"
            >
              NAPA-1 N (46320)
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
              :class="somsSatFilter === '48963' ? 'bg-zinc-700 text-white border-zinc-500 shadow-xs' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
              @click="somsSatFilter = '48963'"
            >
              NAPA-2 N (48963)
            </button>
          </div>

          <!-- Status / Mode Chips & Search -->
          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
                :class="somsStatusFilter === 'all' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
                @click="somsStatusFilter = 'all'"
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
                :class="somsStatusFilter === 'today' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
                @click="somsStatusFilter = 'today'"
              >
                📅 วันนี้ ({{ somsStats.today }})
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
                :class="somsStatusFilter === 'upcoming' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
                @click="somsStatusFilter = 'upcoming'"
              >
                ⏱️ พาสถัดไป ({{ somsStats.upcoming }})
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
                :class="somsStatusFilter === 'high_el' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
                @click="somsStatusFilter = 'high_el'"
              >
                🎯 มุมยกสูง ({{ somsStats.highEl }})
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
                :class="somsStatusFilter === 'low_el' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-space-800 text-zinc-300 border-space-700 hover:text-white'"
                @click="somsStatusFilter = 'low_el'"
              >
                ⚠️ มุมต่ำ ({{ somsStats.lowEl }})
              </button>
            </div>

            <!-- Search -->
            <div class="relative w-full sm:w-44 flex-shrink-0">
              <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="somsSearch"
                type="text"
                placeholder="ค้นหารอบพาส..."
                class="w-full pl-8 pr-3 py-1 text-xs rounded-xl bg-space-800 border border-space-600 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        <!-- SOMS Passes Table (Titanium Black & Gray, High Contrast) -->
        <div class="overflow-x-auto rounded-xl border border-space-700">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-space-800 text-zinc-200 font-semibold uppercase">
              <tr>
                <th class="py-3 px-3 text-center w-12">#ID</th>
                <th class="py-3 px-3">ดาวเทียม</th>
                <th class="py-3 px-3">รอบพาส</th>
                <th class="py-3 px-3">เวลา (ไทย)</th>
                <th class="py-3 px-3">เวลา (UTC)</th>
                <th class="py-3 px-3 text-center">มุมยกสูงสุด</th>
                <th class="py-3 px-3 text-center">ระยะเวลา</th>
                <th class="py-3 px-3 text-center">สถานะความพร้อม</th>
                <th class="py-3 px-3">บันทึก / ภารกิจ</th>
                <th class="py-3 px-3 text-center">คำสั่งปฏิบัติการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-space-750">
              <tr v-if="somsLoading">
                <td colspan="10" class="py-8 text-center text-zinc-400 font-medium">
                  <RefreshCw class="w-5 h-5 text-zinc-400 animate-spin mx-auto mb-2" />
                  กำลังโหลดข้อมูลรอบพาสจากระบบ SOMS...
                </td>
              </tr>
              <tr v-else-if="filteredSomsPasses.length === 0">
                <td colspan="10" class="py-8 text-center text-zinc-400">
                  ไม่พบรายการพาสตามเงื่อนไขที่เลือก
                </td>
              </tr>
              <tr
                v-for="p in filteredSomsPasses"
                :key="p.id"
                class="hover:bg-space-800/60 transition-colors"
              >
                <!-- ID -->
                <td class="py-3 px-3 text-center font-mono font-bold text-zinc-400">
                  #{{ p.id }}
                </td>

                <!-- Satellite -->
                <td class="py-3 px-3">
                  <div class="font-bold text-white font-prompt flex items-center gap-1.5">
                    <Orbit class="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span>{{ p.satellite_name }}</span>
                  </div>
                  <span class="text-[10px] text-zinc-400 font-mono">NORAD: {{ p.satellite_id }}</span>
                </td>

                <!-- Pass Name / Seq -->
                <td class="py-3 px-3 font-semibold text-slate-200 font-prompt">
                  {{ p.pass_name || '-' }}
                </td>

                <!-- Local Time -->
                <td class="py-3 px-3">
                  <div class="font-mono text-white font-medium">{{ p.local_time }}</div>
                  <div class="text-[10px] text-zinc-400 font-mono">{{ p.local_date }}</div>
                </td>

                <!-- UTC Time -->
                <td class="py-3 px-3">
                  <div class="font-mono text-zinc-300">{{ p.aos_time_utc }} – {{ p.los_time_utc }}</div>
                  <div class="text-[10px] text-zinc-400 font-mono">{{ p.aos_date_utc }} UTC</div>
                </td>

                <!-- Max Elevation -->
                <td class="py-3 px-3 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1"
                    :class="p.isLowElevation
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                      : p.isOverhead
                        ? 'bg-sky-950/70 text-sky-300 border border-sky-700'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'"
                  >
                    {{ p.maxElevation }}°
                  </span>
                </td>

                <!-- Duration -->
                <td class="py-3 px-3 text-center font-mono text-slate-200">
                  {{ p.duration_label }}
                </td>

                <!-- Feasibility Status -->
                <td class="py-3 px-3 text-center">
                  <span
                    v-if="p.isLowElevation"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80 inline-flex items-center gap-1"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-400" />
                    <span>Abort (&lt;5°)</span>
                  </span>
                  <span
                    v-else-if="p.isOverhead"
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/80 inline-flex items-center gap-1"
                  >
                    <Sparkles class="w-3 h-3 text-sky-400" />
                    <span>Overhead ✓</span>
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1"
                  >
                    <Check class="w-3 h-3 text-emerald-400" />
                    <span>Ready ✓</span>
                  </span>
                </td>

                <!-- Comments / Note -->
                <td class="py-3 px-3 text-xs text-zinc-300 max-w-xs truncate">
                  {{ p.comments || '-' }}
                </td>

                <!-- Action Buttons -->
                <td class="py-3 px-3 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Simulate in Map -->
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="ส่งพาสนี้เข้าตัวจำลองเพื่อคำนวณและวาด Ground Track บนแผนที่ทันที"
                      @click="simulateSomsPass(p)"
                    >
                      <Play class="w-3 h-3 text-sky-400 fill-sky-400" />
                      <span>จำลองพาส</span>
                    </button>

                    <!-- Create Report -->
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-space-800 hover:bg-space-750 text-slate-200 hover:text-white border border-space-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="นำพาสนี้ไปสร้างรายงานภารกิจ SOMS"
                      @click="createReportFromSomsPass(p)"
                    >
                      <FilePlus class="w-3 h-3 text-zinc-400" />
                      <span class="hidden xl:inline">รายงาน</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: Sensor & Constellation Profiles -->
    <div v-show="activeTab === 'specs'" class="space-y-4">
      <div class="bg-space-850 rounded-2xl p-5 sm:p-6 border border-space-700 shadow-md space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-white flex items-center gap-2">
            <Cpu class="w-5 h-5 text-zinc-300" />
            <span>ตารางคุณลักษณะเซนเซอร์และดาวเทียม (Constellation Sensor Specifications)</span>
          </h3>
          <p class="text-xs text-zinc-400 mt-1">
            พารามิเตอร์ทางทัศนศาสตร์ ความกว้างแถบกวาด (Swath) และขีดจำกัดมุมเอียง (Max Roll) ตามข้อกำหนดภารกิจ
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-space-700">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-space-800 text-zinc-200 font-semibold uppercase">
              <tr>
                <th class="py-3 px-4">ดาวเทียม (Satellite)</th>
                <th class="py-3 px-4 text-center">NORAD ID</th>
                <th class="py-3 px-4 text-center">ประเภทภารกิจ</th>
                <th class="py-3 px-4 text-center">Max Roll (°)</th>
                <th class="py-3 px-4 text-center">Swath (km)</th>
                <th class="py-3 px-4 text-center">Nadir GSD (m)</th>
                <th class="py-3 px-4 text-center">Ground Speed</th>
                <th class="py-3 px-4 text-center">Pre-roll</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-space-750">
              <tr v-for="sat in satelliteSpecs" :key="sat.id" class="hover:bg-space-800/50">
                <td class="py-3 px-4 font-bold text-white font-prompt">{{ sat.name }}</td>
                <td class="py-3 px-4 text-center font-mono text-zinc-300 font-semibold">{{ sat.id }}</td>
                <td class="py-3 px-4 text-center text-slate-200">{{ sat.type }}</td>
                <td class="py-3 px-4 text-center font-mono font-semibold text-amber-400">{{ sat.maxRoll }}°</td>
                <td class="py-3 px-4 text-center font-mono text-slate-200">{{ sat.swathKm }} km</td>
                <td class="py-3 px-4 text-center font-mono font-bold text-emerald-400">{{ sat.gsdM }} m</td>
                <td class="py-3 px-4 text-center font-mono text-slate-200">{{ sat.speedKms }} km/s</td>
                <td class="py-3 px-4 text-center font-mono text-slate-200">{{ sat.preRoll }}s</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Interactive GSD Roll Simulator -->
        <div class="mt-6 p-4 rounded-xl bg-space-900 border border-space-700">
          <div class="flex items-center gap-2 mb-3">
            <Sliders class="w-4 h-4 text-zinc-300" />
            <h4 class="text-xs font-bold uppercase tracking-wider text-white font-prompt">
              เครื่องมือจำลองความละเอียดภาพตามมุมเอียง (Off-Nadir GSD Estimator)
            </h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
            <div>
              <label class="block font-medium text-slate-200 mb-1">เลือกระบบดาวเทียม:</label>
              <select v-model="calcSatId" class="w-full px-3 py-2 rounded-xl border border-space-600 bg-space-800 text-white">
                <option v-for="s in satelliteSpecs" :key="s.id" :value="s.id">{{ s.name }} (Nadir: {{ s.gsdM }}m)</option>
              </select>
            </div>

            <div>
              <div class="flex justify-between font-medium text-slate-200 mb-1">
                <span>มุมเอียงถ่ายภาพ (Roll Angle):</span>
                <span class="font-mono font-bold text-white">{{ calcRoll }}°</span>
              </div>
              <input
                v-model.number="calcRoll"
                type="range"
                min="0"
                :max="selectedSatSpec.maxRoll"
                step="1"
                class="w-full accent-zinc-400"
              />
            </div>

            <div class="p-3 rounded-xl bg-space-800 border border-space-700 text-center">
              <span class="text-zinc-400 block text-[11px]">Effective GSD Resolution:</span>
              <span class="text-xl font-bold font-mono text-white">{{ computedGsd }} เมตร</span>
              <span class="text-[10px] text-zinc-400 block mt-0.5">Nadir: {{ selectedSatSpec.gsdM }}m (เอียง {{ calcRoll }}°)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Strategic Target Library -->
    <div v-show="activeTab === 'targets'" class="space-y-4">
      <div class="bg-space-850 rounded-2xl p-5 sm:p-6 border border-space-700 shadow-md space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-white flex items-center gap-2">
            <MapPin class="w-5 h-5 text-rose-400" />
            <span>คลังพิกัดเป้าหมายยุทธการ (Strategic Target Coordinates Library)</span>
          </h3>
          <p class="text-xs text-zinc-400 mt-1">
            พิกัดยุทธศาสตร์สำคัญสำหรับภารกิจตรวจการณ์ทางอวกาศ กด "ส่งเข้าตัวจำลอง" เพื่อคำนวณพาสทันที
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="preset in targetPresets"
            :key="preset.id"
            class="p-4 rounded-xl border border-space-700 bg-space-900/60 flex items-start justify-between gap-3 hover:border-zinc-500 transition-colors"
          >
            <div>
              <h4 class="font-bold text-xs text-white font-prompt">{{ preset.name }}</h4>
              <p class="text-xs text-zinc-300 mt-0.5">{{ preset.desc }}</p>
              <div class="flex items-center gap-3 mt-2 font-mono text-xs text-zinc-300">
                <span>Lat: {{ preset.lat }}°N</span>
                <span>•</span>
                <span>Lon: {{ preset.lon }}°E</span>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-500/60 text-xs font-semibold shadow-xs transition-colors flex-shrink-0 cursor-pointer"
              @click="applyPresetToPlanner(preset)"
            >
              <Send class="w-3.5 h-3.5" />
              <span>ส่งเข้าตัวจำลอง</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: SOP & Feasibility Checklist -->
    <div v-show="activeTab === 'sop'" class="space-y-4">
      <div class="bg-space-850 rounded-2xl p-5 sm:p-6 border border-space-700 shadow-md space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-white flex items-center gap-2">
            <CheckCircle2 class="w-5 h-5 text-emerald-400" />
            <span>เกณฑ์การประเมินรอบพาสที่ปฏิบัติได้จริง (Pass Feasibility SOP Checklist)</span>
          </h3>
          <p class="text-xs text-zinc-400 mt-1">
            ระเบียบปฏิบัติมาตรฐานของศูนย์ปฏิบัติการทางอวกาศ (RTAF Space Operations) โดยไม่เปลี่ยนแปลงเงื่อนไข
          </p>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-4 rounded-xl border border-space-700 bg-space-900/60 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-space-800 text-white border border-space-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <h4 class="font-bold text-white font-prompt">ความสดใหม่ของข้อมูลวงโคจร (TLE Freshness &lt; 24h)</h4>
              <p class="text-slate-200 mt-0.5 leading-relaxed">
                ก่อนทำการคำนวณพาส ต้องกดปุ่ม <strong>"ดึง TLE ล่าสุด (Fetch All TLEs)"</strong> เพื่อให้มั่นใจว่าค่าความคลาดเคลื่อนทางตำแหน่งอยู่ในเกณฑ์ที่ระบบรับสัญญาณสถานีภาคพื้นดินและกล้องถ่ายภาพสามารถทำงานได้แม่นยำ
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl border border-space-700 bg-space-900/60 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-space-800 text-white border border-space-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <h4 class="font-bold text-white font-prompt">มุมยกขั้นต่ำ (Minimum Elevation Angle &ge; 10°)</h4>
              <p class="text-slate-200 mt-0.5 leading-relaxed">
                รอบพาสที่มีมุมยกต่ำกว่า 10 องศา จะเกิดการลดทอนของสัญญาณวิทยุ (Atmospheric Attenuation) และการรบกวนของภูมิประเทศ หากต่ำกว่า 5 องศาให้ระบุเป็น <strong>Abort</strong>
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl border border-space-700 bg-space-900/60 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-space-800 text-white border border-space-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <h4 class="font-bold text-white font-prompt">ขีดจำกัดมุมเอียงตัวยาน (Roll Angle &le; Max Roll)</h4>
              <p class="text-slate-200 mt-0.5 leading-relaxed">
                ระบบคำนวณพาสจะตรวจสอบค่า Off-Nadir Roll เทียบกับ Max Roll ของแต่ละดวง (NAPA-2: 20°, THEOS-2: 45°) รอบพาสที่ผ่านเกณฑ์จะแสดงป้าย <strong>Feasible หรือ Good ✓</strong>
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl border border-space-700 bg-space-900/60 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-space-800 text-white border border-space-600 flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <h4 class="font-bold text-white font-prompt">มุมส่องสว่างของดวงอาทิตย์ (Sun Elevation &ge; 20°)</h4>
              <p class="text-slate-200 mt-0.5 leading-relaxed">
                สำหรับภารกิจถ่ายภาพพื้นที่ด้วยเซนเซอร์ Optical กลางวัน มุมดวงอาทิตย์ควรมากกว่า 20 องศาเพื่อให้ได้แสงสะท้อนที่เพียงพอและเกิดเงาน้อยที่สุด
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
