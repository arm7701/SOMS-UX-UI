<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/SatPassPlannerView.vue
 * วัตถุประสงค์: หน้าจอวางแผนและจำลองพาสดาวเทียมแบบมัลติฟังก์ชัน (Multifunctional SAT PASS PLANNER)
 * รองรับ:
 *   1. โหมดจำลองพาสและแผนที่ (Interactive Simulator & Leaflet Map)
 *   2. แถบเลือกพิกัดเป้าหมายยุทธการด่วน (Strategic Target Presets) ส่งเข้าตัวคำนวณทันที
 *   3. ตารางเปรียบเทียบสเปกเซนเซอร์และดาวเทียม (Sensor & Constellation Specs)
 *   4. คลังพิกัดเป้าหมายทางยุทธการ (Strategic Target Library)
 *   5. ขั้นตอนตรวจสอบความพร้อมของพาส (Pass Feasibility SOP Checklist)
 *   6. โหมดเต็มจอ (Fullscreen Focus Mode) สำหรับห้องศูนย์ควบคุม
 *   7. ปุ่มเชื่อมโยงส่งต่อไปสร้างรายงานภารกิจ (Create SOMS Report)
 * *หมายเหตุ: คงเงื่อนไข สูตรคำนวณ SGP4, มุมยก และ Roll Constraints เดิมไว้ 100%*
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
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
  Table
} from 'lucide-vue-next'

const router = useRouter()
const appStore = useAppStore()

// โหมดแท็บการทำงาน (Multifunctional Tabs)
const activeTab = ref('simulator') // 'simulator' | 'specs' | 'targets' | 'sop'
const isFullscreen = ref(false)
const iframeLoading = ref(true)
const iframeKey = ref(1)
const iframeRef = ref(null)

// โหมดมุมมองการจำลองบนหน้าจอแคบ/มือถือ (Simulator View Modes)
// 'split' = รวม (Desktop: 2 คอลัมน์ / Mobile: แผนที่บน คอนโทรลล่าง ไม่บีบอัด)
// 'map' = โหมดแผนที่เต็มจอ (Map Only) 100% ความกว้างและความสูง
// 'sats' = โหมดเลือกดาวเทียมและตั้งค่า (Satellites & Specs Only)
// 'passes' = โหมดตารางรอบพาสและไทม์ไลน์ (Passes Table Only)
const simulatorViewMode = ref('split')

// หมายเหตุ: รายการ targetPresets และ satelliteSpecs ถูกย้ายไปอยู่ที่ @/config/targets และ @/config/satellites
// เพื่อให้ Developer ท่านอื่นสามารถเพิ่มพิกัดหรือสเปกดาวเทียมใหม่ได้ง่ายโดยไม่ต้องเข้ามาแก้ไขไฟล์ View นี้

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
      // วาด Target Marker บนแผนที่
      if (typeof iframeWin?.setTgt === 'function') {
        iframeWin.setTgt(preset.lat, preset.lon)
      }
      // เรียกฟังก์ชันคำนวณ calc() ของระบบเดิม
      if (typeof iframeWin?.calc === 'function') {
        iframeWin.calc()
      }
      // ปรับจุดกึ่งกลางแผนที่ Leaflet ไปที่เป้าหมาย
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

// ฉีดสไตล์ CSS ปรับปรุง Responsiveness เข้าสู่ Iframe เพื่อไม่ให้แผนที่ล้นจอ
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
      /* ป้องกันการล้นจอแนวนอน 100% */
      html, body {
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }

      /* จัดการ Header ภายในตัว Planner */
      #hdr {
        transition: padding 0.2s ease !important;
      }

      /* การแสดงผลบนหน้าจอแคบ/มือถือ (< 860px): ไม่บีบแผนที่เป็นแถบแนวตั้ง */
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
          border-bottom: 1px solid #30363d !important;
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
          border-top: 1px solid #30363d !important;
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
        height: calc(100vh - 38px) !important;
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
        height: calc(100vh - 38px) !important;
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
        height: calc(100vh - 38px) !important;
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

      /* ปรับแต่งปุ่มควบคุมแผนที่ Leaflet ในธีมมืด */
      .leaflet-control-zoom {
        border-radius: 8px !important;
        overflow: hidden !important;
        border: 1px solid #30363d !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      }
      .leaflet-control-zoom a {
        background: #161b22 !important;
        color: #e6edf3 !important;
        border-bottom: 1px solid #30363d !important;
      }
      .leaflet-control-attribution {
        background: rgba(13,17,23,0.85) !important;
        color: #8b949e !important;
        font-size: 9px !important;
        border-radius: 4px !important;
        margin: 4px !important;
        padding: 2px 6px !important;
      }
      .leaflet-control-attribution a {
        color: #58a6ff !important;
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

// ฟังค์ชัน Resize เพื่อรีเฟรชขนาดแผนที่ Leaflet เมื่อผู้ใช้หมุนจอหรือปรับขนาดหน้าต่าง
const handleWindowResize = () => {
  if (iframeRef.value?.contentWindow?.map) {
    iframeRef.value.contentWindow.map.invalidateSize()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <div
    class="space-y-4 transition-all duration-200"
    :class="isFullscreen ? 'fixed inset-0 z-50 bg-space-950 p-4 overflow-y-auto' : ''"
  >
    <!-- Top Header & Multifunctional Toolbar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200 dark:border-space-700 bg-white dark:bg-space-900 p-3 sm:p-4 rounded-2xl border shadow-sm">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Compass class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-xl font-bold font-prompt text-slate-900 dark:text-white tracking-tight">
                SAT PASS PLANNER
              </h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                MULTIFUNCTION v3
              </span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-space-700 transition-colors shadow-2xs"
          title="อัปเดตข้อมูลวงโคจร TLE ของดาวเทียมทั้งหมด"
          @click="triggerFetchAllTLEs"
        >
          <RefreshCw class="w-3.5 h-3.5 text-blue-500" />
          <span class="hidden sm:inline">ดึง TLE ล่าสุด</span>
          <span class="sm:hidden">ดึง TLE</span>
        </button>

        <!-- Calculate Trigger -->
        <button
          type="button"
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
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
          class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
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
          class="p-2 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-space-700 transition-colors shadow-2xs"
          :title="isFullscreen ? 'ย่อหน้าต่างกลับ' : 'ขยายเต็มหน้าจอ (Fullscreen)'"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="isFullscreen" class="w-4 h-4 text-amber-500" />
          <Maximize2 v-else class="w-4 h-4 text-slate-500" />
        </button>

        <!-- Open in New Tab -->
        <a
          href="/planner/"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-space-700 transition-colors shadow-2xs"
          title="เปิดตัวจำลองในแท็บใหม่แยกต่างหาก"
        >
          <ExternalLink class="w-4 h-4 text-slate-500" />
        </a>
      </div>
    </div>

    <!-- Navigation Tabs: Multifunctional Modes -->
    <div class="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-space-850 border border-slate-200 dark:border-space-700 overflow-x-auto scrollbar-none text-xs font-semibold select-none">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === 'simulator'
          ? 'bg-white dark:bg-space-900 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'simulator'"
      >
        <Compass class="w-4 h-4" />
        <span class="hidden sm:inline">จำลองพาสและแผนที่ (Simulator)</span>
        <span class="sm:hidden">จำลอง & แผนที่</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === 'specs'
          ? 'bg-white dark:bg-space-900 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'specs'"
      >
        <Cpu class="w-4 h-4" />
        <span class="hidden sm:inline">สเปกเซนเซอร์และดาวเทียม (Specs)</span>
        <span class="sm:hidden">สเปกเซนเซอร์</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === 'targets'
          ? 'bg-white dark:bg-space-900 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'targets'"
      >
        <MapPin class="w-4 h-4" />
        <span class="hidden sm:inline">คลังพิกัดเป้าหมายยุทธการ (Targets)</span>
        <span class="sm:hidden">คลังพิกัด</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === 'sop'
          ? 'bg-white dark:bg-space-900 text-blue-600 dark:text-blue-400 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
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
      <div class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-space-700 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        <!-- Left: Quick Strategic Target Presets (Swipeable chips, never clutter) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1 min-w-0">
          <div class="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
            <MapPin class="w-3.5 h-3.5 text-rose-500" />
            <span class="hidden sm:inline">เป้าหมายด่วน:</span>
          </div>
          <div class="flex items-center gap-1.5 flex-nowrap">
            <button
              v-for="preset in targetPresets"
              :key="preset.id"
              type="button"
              class="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-space-600 bg-slate-50 dark:bg-space-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors whitespace-nowrap flex-shrink-0"
              :title="preset.desc"
              @click="applyPresetToPlanner(preset)"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- Right: Simulator View Mode Selector (สลับมุมมอง แผนที่ / ดาวเทียม / รอบพาส / รวม) -->
        <div class="flex items-center justify-center gap-1 bg-slate-100 dark:bg-space-800 p-1 rounded-xl flex-shrink-0 border border-slate-200 dark:border-space-700 self-stretch lg:self-auto">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial"
            :class="simulatorViewMode === 'split' ? 'bg-white dark:bg-space-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
            @click="setSimulatorViewMode('split')"
            title="มุมมองรวม (บนมือถือแผนที่จะอยู่ด้านบน 100% กว้างเต็มจอ ไม่บีบอัด)"
          >
            <Columns2 class="w-3.5 h-3.5" />
            <span>รวม (Split)</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial"
            :class="simulatorViewMode === 'map' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
            @click="setSimulatorViewMode('map')"
            title="เน้นแผนที่เต็มจอ 100% (Map Focus Mode)"
          >
            <Map class="w-3.5 h-3.5" />
            <span>แผนที่</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial"
            :class="simulatorViewMode === 'sats' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
            @click="setSimulatorViewMode('sats')"
            title="เน้นเลือกดาวเทียมและพารามิเตอร์เต็มจอ (Satellites Focus Mode)"
          >
            <Orbit class="w-3.5 h-3.5" />
            <span>ดาวเทียม</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-1 lg:flex-initial"
            :class="simulatorViewMode === 'passes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
            @click="setSimulatorViewMode('passes')"
            title="เน้นตารางรอบพาสและไทม์ไลน์ (Passes Table Focus Mode)"
          >
            <Table class="w-3.5 h-3.5" />
            <span>รอบพาส</span>
          </button>
        </div>
      </div>

      <!-- Iframe Workspace -->
      <div class="relative w-full rounded-2xl border border-slate-200 dark:border-space-700 overflow-hidden bg-space-950 shadow-sm">
        <!-- Loading Overlay -->
        <div
          v-if="iframeLoading"
          class="absolute inset-0 z-10 bg-space-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-slate-300"
        >
          <RefreshCw class="w-8 h-8 text-blue-500 animate-spin" />
          <p class="text-xs font-medium font-prompt">กำลังโหลดระบบ SAT PASS PLANNER...</p>
        </div>

        <!-- Embedded Planner Iframe (100% untouched calculation engine) -->
        <iframe
          ref="iframeRef"
          :key="iframeKey"
          src="/planner/"
          title="Satellite Pass Planner Workspace"
          class="w-full h-[68vh] sm:h-[calc(100vh-14rem)] min-h-[500px] sm:min-h-[620px] border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          @load="onIframeLoad"
        ></iframe>
      </div>
    </div>

    <!-- TAB 2: Sensor & Constellation Profiles -->
    <div v-show="activeTab === 'specs'" class="space-y-4">
      <div class="bg-white dark:bg-space-850 rounded-2xl p-6 border border-slate-200 dark:border-space-700 shadow-sm space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-slate-800 dark:text-white flex items-center gap-2">
            <Cpu class="w-5 h-5 text-blue-500" />
            <span>ตารางคุณลักษณะเซนเซอร์และดาวเทียม (Constellation Sensor Specifications)</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            พารามิเตอร์ทางทัศนศาสตร์ ความกว้างแถบกวาด (Swath) และขีดจำกัดมุมเอียง (Max Roll) ตามข้อกำหนดภารกิจ
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-space-700">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 dark:bg-space-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
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
            <tbody class="divide-y divide-slate-100 dark:divide-space-750">
              <tr v-for="sat in satelliteSpecs" :key="sat.id" class="hover:bg-slate-50/60 dark:hover:bg-space-800/40">
                <td class="py-3 px-4 font-bold text-slate-800 dark:text-white font-prompt">{{ sat.name }}</td>
                <td class="py-3 px-4 text-center font-mono text-blue-600 dark:text-blue-400 font-semibold">{{ sat.id }}</td>
                <td class="py-3 px-4 text-center text-slate-600 dark:text-slate-300">{{ sat.type }}</td>
                <td class="py-3 px-4 text-center font-mono font-semibold text-amber-600 dark:text-amber-400">{{ sat.maxRoll }}°</td>
                <td class="py-3 px-4 text-center font-mono">{{ sat.swathKm }} km</td>
                <td class="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ sat.gsdM }} m</td>
                <td class="py-3 px-4 text-center font-mono">{{ sat.speedKms }} km/s</td>
                <td class="py-3 px-4 text-center font-mono">{{ sat.preRoll }}s</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Interactive GSD Roll Simulator -->
        <div class="mt-6 p-4 rounded-xl bg-blue-50/50 dark:bg-space-900 border border-blue-100 dark:border-space-700">
          <div class="flex items-center gap-2 mb-3">
            <Sliders class="w-4 h-4 text-blue-600" />
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-prompt">
              เครื่องมือจำลองความละเอียดภาพตามมุมเอียง (Off-Nadir GSD Estimator)
            </h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
            <div>
              <label class="block font-medium text-slate-600 dark:text-slate-300 mb-1">เลือกระบบดาวเทียม:</label>
              <select v-model="calcSatId" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-space-600 bg-white dark:bg-space-800 text-slate-800 dark:text-slate-100">
                <option v-for="s in satelliteSpecs" :key="s.id" :value="s.id">{{ s.name }} (Nadir: {{ s.gsdM }}m)</option>
              </select>
            </div>

            <div>
              <div class="flex justify-between font-medium text-slate-600 dark:text-slate-300 mb-1">
                <span>มุมเอียงถ่ายภาพ (Roll Angle):</span>
                <span class="font-mono font-bold text-blue-600">{{ calcRoll }}°</span>
              </div>
              <input
                v-model.number="calcRoll"
                type="range"
                min="0"
                :max="selectedSatSpec.maxRoll"
                step="1"
                class="w-full accent-blue-600"
              />
            </div>

            <div class="p-3 rounded-xl bg-white dark:bg-space-800 border border-slate-200 dark:border-space-700 text-center">
              <span class="text-slate-400 block text-[11px]">Effective GSD Resolution:</span>
              <span class="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{{ computedGsd }} เมตร</span>
              <span class="text-[10px] text-slate-500 block mt-0.5">Nadir: {{ selectedSatSpec.gsdM }}m (เอียง {{ calcRoll }}°)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Strategic Target Library -->
    <div v-show="activeTab === 'targets'" class="space-y-4">
      <div class="bg-white dark:bg-space-850 rounded-2xl p-6 border border-slate-200 dark:border-space-700 shadow-sm space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin class="w-5 h-5 text-rose-500" />
            <span>คลังพิกัดเป้าหมายยุทธการ (Strategic Target Coordinates Library)</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            พิกัดยุทธศาสตร์สำคัญสำหรับภารกิจตรวจการณ์ทางอวกาศ กด "ส่งเข้าตัวจำลอง" เพื่อคำนวณพาสทันที
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="preset in targetPresets"
            :key="preset.id"
            class="p-4 rounded-xl border border-slate-200 dark:border-space-700 bg-slate-50/50 dark:bg-space-900/50 flex items-start justify-between gap-3 hover:border-blue-300 transition-colors"
          >
            <div>
              <h4 class="font-bold text-xs text-slate-800 dark:text-white font-prompt">{{ preset.name }}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ preset.desc }}</p>
              <div class="flex items-center gap-3 mt-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                <span>Lat: {{ preset.lat }}°N</span>
                <span>•</span>
                <span>Lon: {{ preset.lon }}°E</span>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex-shrink-0"
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
      <div class="bg-white dark:bg-space-850 rounded-2xl p-6 border border-slate-200 dark:border-space-700 shadow-sm space-y-4">
        <div>
          <h3 class="text-base font-bold font-prompt text-slate-800 dark:text-white flex items-center gap-2">
            <CheckCircle2 class="w-5 h-5 text-emerald-500" />
            <span>เกณฑ์การประเมินรอบพาสที่ปฏิบัติได้จริง (Pass Feasibility SOP Checklist)</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ระเบียบปฏิบัติมาตรฐานของศูนย์ปฏิบัติการทางอวกาศ (RTAF Space Operations) โดยไม่เปลี่ยนแปลงเงื่อนไข
          </p>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3.5 rounded-xl border border-slate-200 dark:border-space-700 bg-slate-50/50 dark:bg-space-900/50 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white font-prompt">ความสดใหม่ของข้อมูลวงโคจร (TLE Freshness &lt; 24h)</h4>
              <p class="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                ก่อนทำการคำนวณพาส ต้องกดปุ่ม <strong>"ดึง TLE ล่าสุด (Fetch All TLEs)"</strong> เพื่อให้มั่นใจว่าค่าความคลาดเคลื่อนทางตำแหน่งอยู่ในเกณฑ์ที่ระบบรับสัญญาณสถานีภาคพื้นดินและกล้องถ่ายภาพสามารถทำงานได้แม่นยำ
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-xl border border-slate-200 dark:border-space-700 bg-slate-50/50 dark:bg-space-900/50 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white font-prompt">มุมยกขั้นต่ำ (Minimum Elevation Angle &ge; 10°)</h4>
              <p class="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                รอบพาสที่มีมุมยกต่ำกว่า 10 องศา จะเกิดการลดทอนของสัญญาณวิทยุ (Atmospheric Attenuation) และการรบกวนของภูมิประเทศ หากต่ำกว่า 5 องศาให้ระบุเป็น <strong>Abort</strong>
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-xl border border-slate-200 dark:border-space-700 bg-slate-50/50 dark:bg-space-900/50 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white font-prompt">ขีดจำกัดมุมเอียงตัวยาน (Roll Angle &le; Max Roll)</h4>
              <p class="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                ระบบคำนวณพาสจะตรวจสอบค่า Off-Nadir Roll เทียบกับ Max Roll ของแต่ละดวง (NAPA-2: 20°, THEOS-2: 45°) รอบพาสที่ผ่านเกณฑ์จะแสดงป้าย <strong>Feasible หรือ Good ✓</strong>
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-xl border border-slate-200 dark:border-space-700 bg-slate-50/50 dark:bg-space-900/50 flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">4</div>
            <div>
              <h4 class="font-bold text-slate-800 dark:text-white font-prompt">มุมส่องสว่างของดวงอาทิตย์ (Sun Elevation &ge; 20°)</h4>
              <p class="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                สำหรับภารกิจถ่ายภาพพื้นที่ด้วยเซนเซอร์ Optical กลางวัน มุมดวงอาทิตย์ควรมากกว่า 20 องศาเพื่อให้ได้แสงสะท้อนที่เพียงพอและเกิดเงาน้อยที่สุด
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
