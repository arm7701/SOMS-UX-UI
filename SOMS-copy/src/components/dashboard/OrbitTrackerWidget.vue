<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/OrbitTrackerWidget.vue
 * วัตถุประสงค์: วิดเจ็ตติดตามวงโคจรดาวเทียมแบบสด (Live Satellite Orbit Tracker)
 * สอดคล้องกับลูกเล่นใหม่ของระบบต้นฉบับ (http://10.225.120.221:1161/)
 * ธีมดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ============================================================================
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Globe2,
  Orbit,
  Radio,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  MapPin,
  Layers,
  ChevronDown,
  Info
} from 'lucide-vue-next'

const props = defineProps({
  satellites: {
    type: Array,
    default: () => []
  },
  passes: {
    type: Array,
    default: () => []
  },
  compact: {
    type: Boolean,
    default: false
  }
})

// ข้อมูลดาวเทียมหลักของระบบ
const SAT_CONFIGS = [
  {
    noradId: '48963',
    name: 'NAPA-2 N',
    color: '#60a5fa', // ฟ้าสว่าง
    altitude: 508.8,
    inclination: 97.45,
    periodMin: 94.8,
    velocity: 7.61,
    baseLat: 13.91,
    baseLng: 100.60
  },
  {
    noradId: '46320',
    name: 'NAPA-1 N',
    color: '#38bdf8', // ฟ้าคราม
    altitude: 495.2,
    inclination: 97.42,
    periodMin: 94.5,
    velocity: 7.62,
    baseLat: 24.50,
    baseLng: 115.30
  },
  {
    noradId: '58016',
    name: 'THEOS-2',
    color: '#34d399', // มรกต
    altitude: 621.0,
    inclination: 97.85,
    periodMin: 97.1,
    velocity: 7.55,
    baseLat: -10.20,
    baseLng: 85.40
  }
]

// ข้อมูลสถานีภาคพื้นดินหลัก
const GROUND_STATION = {
  name: 'BMA Ground Station (ศปอ.ทอ.)',
  shortName: 'BMA GS',
  lat: 13.9125,
  lng: 100.6067,
  elevationM: 14,
  maskDeg: 5,
  footprintKm: 2150 // รัศมีครอบคลุมสัญญาณที่มุมยก 5 องศา
}

const selectedSatId = ref('48963') // ดาวเทียมที่เลือก
const viewMode = ref('map') // 'map' | 'tactical'
const isSimulating = ref(true)
const simOffsetSec = ref(0)
const mapContainer = ref(null)
const leafletLoaded = ref(false)

let mapInstance = null
let satMarkers = {}
let orbitLines = {}
let footprintCircle = null
let gsMarker = null
let simInterval = null

// คำนวณตำแหน่งดาวเทียมปัจจุบันตามวงโคจรจำลอง
const calculateSubPoint = (sat, offsetSec = 0) => {
  const now = Date.now() / 1000 + offsetSec
  const periodSec = sat.periodMin * 60
  const phase = ((now % periodSec) / periodSec) * Math.PI * 2

  // แบบจำลองวงโคจรสัมพันธ์ Inclination
  const incRad = (sat.inclination * Math.PI) / 180
  const lat = Math.sin(phase) * (sat.inclination > 90 ? (180 - sat.inclination) : sat.inclination)
  
  // การหมุนของโลกและการเคลื่อนที่ตามลองจิจูด
  const earthRotDegPerSec = 360 / 86400
  const satDriftDeg = ((now / periodSec) * 360) % 360
  let lng = ((sat.baseLng + satDriftDeg - (now * earthRotDegPerSec)) % 360)
  if (lng > 180) lng -= 360
  if (lng < -180) lng -= 360

  return { lat, lng }
}

// ตำแหน่งปัจจุบันของดาวเทียมทุกดวง
const liveSatellites = computed(() => {
  return SAT_CONFIGS.map(sat => {
    const pos = calculateSubPoint(sat, simOffsetSec.value)
    return {
      ...sat,
      lat: pos.lat,
      lng: pos.lng
    }
  })
})

// ดาวเทียมที่กำลังเลือกอยู่
const currentSat = computed(() => {
  return liveSatellites.value.find(s => s.noradId === selectedSatId.value) || liveSatellites.value[0]
})

// สร้างเส้นทางโคจรล่วงหน้า 1 รอบ (Ground Track พร้อมแบ่งเส้นเมื่อข้าม 180°/-180°)
const generateOrbitTrackSegments = (sat) => {
  const segments = []
  let currentSegment = []
  const steps = 90
  const periodSec = sat.periodMin * 60

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * periodSec
    const pt = calculateSubPoint(sat, simOffsetSec.value + t)
    const latLng = [pt.lat, pt.lng]

    if (currentSegment.length > 0) {
      const prev = currentSegment[currentSegment.length - 1]
      // ตรวจสอบการข้ามเส้นแบ่งเขตวัน (Antimeridian Seam Crossing)
      if (Math.abs(prev[1] - latLng[1]) > 180) {
        segments.push(currentSegment)
        currentSegment = []
      }
    }
    currentSegment.push(latLng)
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }
  return segments
}

// โหลดและเตรียมระบบแผนที่ Leaflet
const initMap = async () => {
  if (typeof window === 'undefined' || !mapContainer.value) return

  // โหลด Leaflet CSS & JS หากยังไม่มี
  if (!window.L) {
    await new Promise((resolve) => {
      // โหลด CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = '/planner/vendor/leaflet.min.css'
        document.head.appendChild(link)
      }
      // โหลด Script
      const script = document.createElement('script')
      script.src = '/planner/vendor/leaflet.min.js'
      script.onload = () => {
        leafletLoaded.value = true
        resolve()
      }
      script.onerror = () => {
        console.warn('โหลด Leaflet ไม่สำเร็จ สลับใช้ Tactical Orbit View')
        resolve()
      }
      document.head.appendChild(script)
    })
  } else {
    leafletLoaded.value = true
  }

  if (!window.L || !mapContainer.value) return

  try {
    // กำหนดแผนที่ Leaflet
    mapInstance = window.L.map(mapContainer.value, {
      center: [13.91, 100.60],
      zoom: 3,
      minZoom: 2,
      maxZoom: 9,
      worldCopyJump: false,
      zoomControl: false,
      attributionControl: false
    })

    // เลเยอร์แผนที่ Dark Esri Canvas / Titanium Slate (ไม่มีลายน้ำ ไม่ต้องใช้ API Key)
    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: ''
    }).addTo(mapInstance)

    // มาร์กเกอร์สถานีภาคพื้นดิน BMA
    const gsIcon = window.L.divIcon({
      className: 'gs-radar-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></div>
          <div class="w-5 h-5 rounded-full bg-emerald-500/40 border-2 border-emerald-400 flex items-center justify-center text-white shadow-lg">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    gsMarker = window.L.marker([GROUND_STATION.lat, GROUND_STATION.lng], {
      icon: gsIcon,
      title: GROUND_STATION.name
    }).addTo(mapInstance)

    // วงรัศมี Footprint ของสถานีภาคพื้นดิน
    footprintCircle = window.L.circle([GROUND_STATION.lat, GROUND_STATION.lng], {
      radius: GROUND_STATION.footprintKm * 1000,
      color: '#10b981',
      weight: 1.5,
      dashArray: '4, 6',
      fillColor: '#10b981',
      fillOpacity: 0.08
    }).addTo(mapInstance)

    updateMapEntities()
  } catch (err) {
    console.error('ตั้งค่าแผนที่ Leaflet ล้มเหลว:', err)
  }
}

// อัปเดตตำแหน่งดาวเทียมและเส้นทางโคจรบนแผนที่
const updateMapEntities = () => {
  if (!mapInstance || !window.L) return

  liveSatellites.value.forEach(sat => {
    // 1. อัปเดตหรือสร้าง Satellite Marker
    const isSelected = sat.noradId === selectedSatId.value
    const markerHtml = `
      <div class="relative flex flex-col items-center group cursor-pointer">
        <div class="relative flex items-center justify-center">
          ${isSelected ? `<div class="absolute w-7 h-7 rounded-full animate-ping opacity-60" style="background-color: ${sat.color}"></div>` : ''}
          <div class="w-4 h-4 rounded-full border-2 shadow-md flex items-center justify-center" style="background-color: ${sat.color}; border-color: #ffffff;">
            <div class="w-1 h-1 rounded-full bg-white"></div>
          </div>
        </div>
        <span class="mt-1 px-2 py-0.5 rounded-md text-xs font-bold font-prompt bg-[#090b0f]/95 border border-slate-600 text-white shadow-md whitespace-nowrap" style="border-left: 3px solid ${sat.color}">
          ${sat.name}
        </span>
      </div>
    `

    const customIcon = window.L.divIcon({
      className: `sat-marker-${sat.noradId}`,
      html: markerHtml,
      iconSize: [60, 40],
      iconAnchor: [30, 8]
    })

    if (satMarkers[sat.noradId]) {
      satMarkers[sat.noradId].setLatLng([sat.lat, sat.lng])
      satMarkers[sat.noradId].setIcon(customIcon)
    } else {
      const marker = window.L.marker([sat.lat, sat.lng], { icon: customIcon }).addTo(mapInstance)
      marker.on('click', () => {
        selectedSatId.value = sat.noradId
      })
      satMarkers[sat.noradId] = marker
    }

    // 2. อัปเดตหรือสร้างเส้นทางโคจร Ground Track
    if (orbitLines[sat.noradId]) {
      orbitLines[sat.noradId].forEach(l => mapInstance.removeLayer(l))
    }
    orbitLines[sat.noradId] = []

    const segments = generateOrbitTrackSegments(sat)
    segments.forEach(seg => {
      const line = window.L.polyline(seg, {
        color: sat.color,
        weight: isSelected ? 2.2 : 1.2,
        opacity: isSelected ? 0.85 : 0.45,
        dashArray: isSelected ? '5, 5' : '3, 6'
      }).addTo(mapInstance)
      orbitLines[sat.noradId].push(line)
    })
  })
}

// เล็งเป้าหมายไปยังดาวเทียมที่เลือก
const focusSatellite = () => {
  if (!mapInstance || !currentSat.value) return
  mapInstance.panTo([currentSat.value.lat, currentSat.value.lng], {
    animate: true,
    duration: 0.8
  })
}

// เล็งเป้าหมายไปยังสถานีภาคพื้นดิน BMA
const focusGroundStation = () => {
  if (!mapInstance) return
  mapInstance.setView([GROUND_STATION.lat, GROUND_STATION.lng], 4, {
    animate: true,
    duration: 0.8
  })
}

// รีเซ็ตมุมมองแผนที่
const resetMapView = () => {
  if (!mapInstance) return
  mapInstance.setView([13.91, 100.60], 3, {
    animate: true,
    duration: 0.8
  })
}

let resizeObs = null

onMounted(() => {
  initMap()

  if (mapContainer.value) {
    resizeObs = new ResizeObserver(() => {
      mapInstance?.invalidateSize()
    })
    resizeObs.observe(mapContainer.value)
  }

  // จำลองเวลาแบบสดขยับทุก 1 วินาที
  simInterval = setInterval(() => {
    if (isSimulating.value) {
      simOffsetSec.value += 1
      updateMapEntities()
    }
  }, 1000)
})

onUnmounted(() => {
  if (resizeObs) resizeObs.disconnect()
  if (simInterval) clearInterval(simInterval)
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

watch(selectedSatId, () => {
  updateMapEntities()
  focusSatellite()
})
</script>

<template>
  <div class="w-full h-full flex flex-col flex-1 min-h-0 bg-transparent overflow-hidden">
    <!-- Tactical Controls Bar (ดาวเทียมและมุมมอง) -->
    <div class="px-3.5 py-2 bg-[#0a0f18] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
      <!-- Satellite Selector Pills -->
      <div class="inline-flex rounded-lg bg-[#06090e] p-1 border border-slate-750/90 shadow-inner">
        <button
          v-for="sat in SAT_CONFIGS"
          :key="sat.noradId"
          type="button"
          class="px-3 py-1 text-xs font-semibold font-prompt rounded-md transition-all cursor-pointer flex items-center gap-1.5"
          :class="selectedSatId === sat.noradId ? 'bg-slate-750 text-white font-bold shadow-xs border border-slate-600' : 'text-slate-300 hover:text-white'"
          @click="selectedSatId = sat.noradId"
        >
          <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: sat.color }"></span>
          <span>{{ sat.name }}</span>
        </button>
      </div>

        <!-- Quick View Controls -->
        <div class="inline-flex items-center gap-1">
          <button
            type="button"
            title="เล็งเป้าหมายดาวเทียม"
            class="p-2 rounded-lg bg-[#090b0f] border border-space-600 text-slate-200 hover:text-white hover:border-zinc-400 transition-colors cursor-pointer"
            @click="focusSatellite"
          >
            <Crosshair class="w-4 h-4" />
          </button>
          <button
            type="button"
            title="เล็งเป้าหมายสถานี BMA (ศปอ.ทอ.)"
            class="p-2 rounded-lg bg-[#090b0f] border border-space-600 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500 transition-colors cursor-pointer"
            @click="focusGroundStation"
          >
            <MapPin class="w-4 h-4" />
          </button>
          <button
            type="button"
            title="รีเซ็ตมุมมองแผนที่"
            class="p-2 rounded-lg bg-[#090b0f] border border-space-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            @click="resetMapView"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          <button
            type="button"
            :title="isSimulating ? 'หยุดชั่วคราว' : 'จำลองต่อ'"
            class="p-2 rounded-lg bg-[#090b0f] border border-space-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
            @click="isSimulating = !isSimulating"
          >
            <Pause v-if="isSimulating" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

    <!-- Main Map Stage -->
    <div class="relative w-full flex-1 min-h-[260px] bg-[#090b0f] overflow-hidden">
      <!-- Leaflet Map Container -->
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <!-- Realtime Telemetry Bottom HUD Bar (เต็มความกว้างด้านล่าง ตัวหนังสือใหญ่ชัดเจน) -->
      <div class="absolute bottom-3 left-3 right-3 z-10 p-3.5 rounded-xl bg-[#0d1117]/95 backdrop-blur-md border border-space-600 shadow-2xl text-xs space-y-2.5">
        <div class="flex items-center justify-between gap-3 pb-2 border-b border-space-700 flex-wrap">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: currentSat.color }"></span>
            <span class="font-bold font-prompt text-white text-base">{{ currentSat.name }}</span>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#090b0f] border border-space-600 text-slate-200">NORAD: {{ currentSat.noradId }}</span>
            <span class="text-xs font-prompt font-bold px-2.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-600 text-emerald-300">
              สถานะ: โคจรปกติ (Active)
            </span>
          </div>

          <div class="flex items-center gap-3 text-xs sm:text-sm font-prompt text-slate-200">
            <span>สถานี BMA: <strong class="text-emerald-400 font-mono font-bold">{{ GROUND_STATION.shortName }} (13.91°N, 100.60°E)</strong></span>
            <span class="hidden md:inline">รัศมี Footprint: <strong class="text-white font-mono font-bold">{{ GROUND_STATION.footprintKm.toLocaleString() }} km</strong></span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-prompt">
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">พิกัดละติจูด (Lat)</p>
            <p class="font-mono text-white font-bold text-sm mt-0.5">
              {{ currentSat.lat.toFixed(2) }}° {{ currentSat.lat >= 0 ? 'N' : 'S' }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">พิกัดลองจิจูด (Lng)</p>
            <p class="font-mono text-white font-bold text-sm mt-0.5">
              {{ currentSat.lng.toFixed(2) }}° {{ currentSat.lng >= 0 ? 'E' : 'W' }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">ระดับความสูง (Alt)</p>
            <p class="font-mono text-cyan-300 font-black text-sm mt-0.5">
              {{ currentSat.altitude.toFixed(1) }} km
            </p>
          </div>
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">ความเร็ว (Velocity)</p>
            <p class="font-mono text-emerald-300 font-black text-sm mt-0.5">
              {{ currentSat.velocity.toFixed(2) }} km/s
            </p>
          </div>
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">คาบเวลาโคจร (Period)</p>
            <p class="font-mono text-amber-300 font-bold text-sm mt-0.5">
              {{ currentSat.periodMin }} min
            </p>
          </div>
          <div class="p-2 rounded-lg bg-[#090b0f] border border-space-700">
            <p class="text-slate-300 text-xs font-semibold">สภาวะแสง (Solar)</p>
            <p class="font-prompt text-amber-300 font-bold text-sm mt-0.5 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>ในแสงแดด (Sunlit)</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Legend (มุมขวาบน) -->
      <div class="hidden sm:flex absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-[#0d1117]/90 backdrop-blur-md border border-space-600 text-xs font-prompt text-slate-100 font-semibold items-center gap-3 shadow-lg">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>BMA GS (ทอ.)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3.5 border-t-2 border-dashed border-emerald-400"></span>
          <span>Footprint 5°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-tile) {
  filter: brightness(0.85) contrast(1.15) !important;
}
:deep(.leaflet-container) {
  background: #090b0f !important;
}
</style>
