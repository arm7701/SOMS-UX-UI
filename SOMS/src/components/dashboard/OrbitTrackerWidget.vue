<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/dashboard/OrbitTrackerWidget.vue
 * วัตถุประสงค์: วิดเจ็ตแสดงผลวงโคจรดาวเทียมแบบเรียลไทม์ (Real-time Orbit Tracker)
 * สลับมุมมองได้ทั้ง 2D Ground Track Map และ 3D Orbital Globe
 * ----------------------------------------------------------------------------
 * คุณสมบัติ:
 * 1. คำนวณพิกัดดาวเทียมแบบ Real-time SGP4 ด้วย satellite.js
 * 2. แผนที่ 2D Ground Track (Leaflet) พร้อมสลับเลเยอร์: ดาวเทียม / ยุทธวิธีมืด / ถนน
 * 3. ลูกโลก 3D Orbital Globe แสดงเส้นทางโคจรลาดเอียง (Inclination), กลางวัน/กลางคืน
 * 4. แถบสรุปนับถอยหลังรอบพาส (AOS/LOS Countdown) เข้าสู่สถานีภาคพื้นดิน
 * 5. HUD Telemetry แสดงความสูง, พิกัด Lat/Lon, ความเร็ว และมุมยกสถานีแบบเรียลไทม์
 * 6. โมดอลจัดการรายการดาวเทียมและสถานีภาคพื้นดิน
 * ============================================================================
 */
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Globe2,
  Map as MapIcon,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCw,
  Sliders,
  Radio,
  RadioTower,
  Clock,
  Navigation,
  Compass,
  Zap,
  Sun,
  Moon
} from 'lucide-vue-next'

import {
  DEFAULT_SATELLITES,
  DEFAULT_LOCATIONS,
  getSatellitePosition,
  getOrbitGroundTrack,
  getLookAngles,
  predictNextPass,
  getFootprintRadiusMeters,
  isSunlit,
  formatCoordinate
} from '@/services/orbitService'

import SatelliteSettingsModal from './SatelliteSettingsModal.vue'
import GroundStationSettingsModal from './GroundStationSettingsModal.vue'

// โหลดรายการดาวเทียมและสถานีจาก LocalStorage หรือค่าเริ่มต้น
const loadSavedSatellites = () => {
  const saved = localStorage.getItem('soms_orbit_satellites')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_SATELLITES))
}

const loadSavedLocations = () => {
  const saved = localStorage.getItem('soms_orbit_locations')
  if (saved) {
    try { return JSON.parse(saved) } catch (e) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_LOCATIONS))
}

const satellites = ref(loadSavedSatellites())
const locations = ref(loadSavedLocations())

// สถานะการตั้งค่า
const showSatelliteModal = ref(false)
const showLocationModal = ref(false)

// ตัวเลือกมุมมองและเลเยอร์
const currentView = ref('map') // 'map' (2D) หรือ 'globe' (3D)
const currentLayer = ref('dark') // 'sat', 'dark', 'street'
const selectedGroup = ref('all')
const selectedNoradId = ref(48963) // NAPA-2 N เป็นค่าเริ่มต้น
const selectedLocationId = ref('wing1') // บน.1 โคราช เป็นค่าเริ่มต้น

const isFollowingSatellite = ref(true)
const isFullscreen = ref(false)
const isRefreshing = ref(false)

// DOM Refs
const mapContainer = ref(null)
const globeCanvas = ref(null)
const widgetWrapper = ref(null)

// Leaflet Instances
let leafletMap = null
let tileLayer = null
let satMarker = null
let footprintCircle = null
let pastTrackPolyline = null
let futureTrackPolyline = null
let passPolyline = null
let locationMarkers = []

// Animation & Clock Timers
let liveTimer = null
let globeAnimId = null
const currentTime = ref(new Date())

// ข้อมูลสถานะคำนวณสด
const currentPosition = ref(null)
const lookAngles = ref(null)
const nextPass = ref(null)
const sunlitStatus = ref(true)

// ดาวเทียมที่เลือก
const selectedSatellite = computed(() => {
  return satellites.value.find(s => s.noradId === selectedNoradId.value) || satellites.value[0]
})

// ดาวเทียมที่เปิดใช้งานและตรงกับกลุ่ม
const availableSatellites = computed(() => {
  return satellites.value.filter(s => {
    if (!s.enabled) return false
    if (selectedGroup.value === 'all') return true
    return s.groupIds?.includes(selectedGroup.value)
  })
})

// สถานีที่เปิดใช้งาน
const availableLocations = computed(() => {
  return locations.value.filter(l => l.enabled)
})

// สถานีที่เลือก
const selectedLocation = computed(() => {
  return locations.value.find(l => l.id === selectedLocationId.value) || locations.value[0]
})

// บันทึกการเปลี่ยนแปลงดาวเทียม
const onSaveSatellites = (newSatList) => {
  satellites.value = newSatList
  localStorage.setItem('soms_orbit_satellites', JSON.stringify(newSatList))
  updateOrbitTracks()
}

// บันทึกการเปลี่ยนแปลงสถานี
const onSaveLocations = (newLocList) => {
  locations.value = newLocList
  localStorage.setItem('soms_orbit_locations', JSON.stringify(newLocList))
  renderLocationsOnMap()
  recalculateNextPass()
}

// ============================================================================
// 1. ระบบคำนวณ Realtime Orbit & Look Angles
// ============================================================================

const updateRealtimeData = () => {
  const now = new Date()
  currentTime.value = now

  if (!selectedSatellite.value) return

  // 1. คำนวณพิกัดดาวเทียม
  const pos = getSatellitePosition(selectedSatellite.value, now)
  if (pos) {
    currentPosition.value = pos
    sunlitStatus.value = isSunlit(pos.positionEci, now)

    // 2. คำนวณ Look Angles ไปยังสถานีที่เลือก
    if (selectedLocation.value) {
      lookAngles.value = getLookAngles(selectedSatellite.value, selectedLocation.value, now)
    }

    // 3. อัปเดตตำแหน่งบนแผนที่ 2D
    if (currentView.value === 'map' && leafletMap && satMarker) {
      satMarker.setLatLng([pos.lat, pos.lon])

      if (footprintCircle) {
        const radiusM = getFootprintRadiusMeters(pos.alt, selectedLocation.value?.minElevationDeg || 5)
        footprintCircle.setLatLng([pos.lat, pos.lon])
        footprintCircle.setRadius(radiusM)
      }

      if (isFollowingSatellite.value) {
        leafletMap.panTo([pos.lat, pos.lon], { animate: false })
      }
    }
  }
}

// คำนวณรอบพาสถัดไป (Next Pass)
const recalculateNextPass = () => {
  if (!selectedSatellite.value || !selectedLocation.value) {
    nextPass.value = null
    return
  }
  nextPass.value = predictNextPass(selectedSatellite.value, selectedLocation.value, new Date(), 36)

  // อัปเดตเส้นพาสบนแผนที่ 2D
  if (leafletMap && passPolyline) {
    if (nextPass.value?.passPoints) {
      passPolyline.setLatLngs(nextPass.value.passPoints)
      passPolyline.setStyle({ opacity: 0.9 })
    } else {
      passPolyline.setLatLngs([])
    }
  }
}

// คำนวณเส้น Ground Track ย้อนหลังและล่วงหน้า (อัปเดตทุก 30 วินาที)
const updateOrbitTracks = () => {
  if (!selectedSatellite.value) return
  const now = new Date()
  const track = getOrbitGroundTrack(selectedSatellite.value, now, 48, 48, 30)

  if (leafletMap) {
    if (pastTrackPolyline) {
      pastTrackPolyline.setLatLngs(track.pastSegments)
      pastTrackPolyline.setStyle({ color: selectedSatellite.value.color || '#00e5ff' })
    }
    if (futureTrackPolyline) {
      futureTrackPolyline.setLatLngs(track.futureSegments)
      futureTrackPolyline.setStyle({ color: selectedSatellite.value.color || '#00e5ff' })
    }
  }
}

// ============================================================================
// 2. แผนที่ Leaflet 2D Ground Track
// ============================================================================

const tileConfigs = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
  },
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Maxar'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
}

const initLeafletMap = () => {
  if (!mapContainer.value) return

  // กำหนดขอบเขตแผนที่
  leafletMap = L.map(mapContainer.value, {
    center: [15.0, 101.5], // ศูนย์กลางประเทศไทย
    zoom: 3,
    minZoom: 2,
    maxZoom: 14,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: true,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 0.8
  })

  // ตั้งค่า Tile Layer
  switchLayer(currentLayer.value)

  // สร้างเส้น Past & Future Ground Track Polylines
  pastTrackPolyline = L.polyline([], {
    color: selectedSatellite.value?.color || '#00e5ff',
    weight: 2,
    opacity: 0.35,
    smoothFactor: 1
  }).addTo(leafletMap)

  futureTrackPolyline = L.polyline([], {
    color: selectedSatellite.value?.color || '#00e5ff',
    weight: 2.2,
    opacity: 0.8,
    dashArray: '6, 8',
    smoothFactor: 1
  }).addTo(leafletMap)

  // เส้นพาสที่ทำนาย (Selected Pass Highlight)
  passPolyline = L.polyline([], {
    color: '#68e3a0',
    weight: 3.5,
    opacity: 0.9,
    dashArray: '2, 6',
    smoothFactor: 1
  }).addTo(leafletMap)

  // อาณาเขตสัญญาณครอบคลุม (Footprint Swath Circle)
  footprintCircle = L.circle([0, 0], {
    radius: 1200000,
    color: selectedSatellite.value?.color || '#00e5ff',
    weight: 1,
    opacity: 0.4,
    fillColor: selectedSatellite.value?.color || '#00e5ff',
    fillOpacity: 0.08,
    interactive: false
  }).addTo(leafletMap)

  // ไอคอนดาวเทียม SVG Marker
  const satIconHtml = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
      <!-- Radar Pulse Ring -->
      <div class="absolute w-12 h-12 rounded-full border border-sky-400/50 animate-ping opacity-60 pointer-events-none"></div>
      <div class="absolute w-8 h-8 rounded-full bg-sky-400/20 pointer-events-none"></div>
      <!-- Satellite Craft SVG -->
      <svg class="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.9)]" viewBox="0 0 36 36" fill="none">
        <!-- Solar Panels Left -->
        <rect x="2" y="13" width="9" height="10" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
        <line x1="6.5" y1="13" x2="6.5" y2="23" stroke="#bae6fd" stroke-width="0.8"/>
        <!-- Solar Panels Right -->
        <rect x="25" y="13" width="9" height="10" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
        <line x1="29.5" y1="13" x2="29.5" y2="23" stroke="#bae6fd" stroke-width="0.8"/>
        <!-- Body Core -->
        <rect x="13" y="11" width="10" height="14" rx="2" fill="#0f172a" stroke="#00e5ff" stroke-width="1.5"/>
        <!-- Optical Sensor / Dish -->
        <circle cx="18" cy="18" r="3" fill="#38bdf8"/>
        <circle cx="18" cy="18" r="1.2" fill="#ffffff"/>
        <!-- Antennas -->
        <line x1="18" y1="11" x2="18" y2="5" stroke="#e0f2fe" stroke-width="1.5"/>
        <circle cx="18" cy="4" r="1.5" fill="#38bdf8"/>
      </svg>
      <!-- Satellite Name Label -->
      <div class="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-sky-500/40 text-[10px] font-bold text-sky-200 whitespace-nowrap shadow-lg">
        ${selectedSatellite.value?.name || 'SATELLITE'}
      </div>
    </div>
  `

  const satIcon = L.divIcon({
    html: satIconHtml,
    className: 'sat-custom-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })

  satMarker = L.marker([0, 0], { icon: satIcon, zIndexOffset: 1000 }).addTo(leafletMap)

  // วาดสถานีภาคพื้นดิน
  renderLocationsOnMap()

  // คำนวณแทร็กและพาสครั้งแรก
  updateOrbitTracks()
  recalculateNextPass()
  updateRealtimeData()
}

// สลับเลเยอร์แผนที่
const switchLayer = (type) => {
  currentLayer.value = type
  if (!leafletMap) return

  if (tileLayer) {
    leafletMap.removeLayer(tileLayer)
  }

  const cfg = tileConfigs[type] || tileConfigs.dark
  tileLayer = L.tileLayer(cfg.url, {
    attribution: cfg.attribution,
    maxZoom: 18
  }).addTo(leafletMap)
}

// วาดสถานีภาคพื้นดินและเป้าหมายลงบนแผนที่ Leaflet
const renderLocationsOnMap = () => {
  if (!leafletMap) return

  // ล้างมาร์กเกอร์เก่า
  locationMarkers.forEach(m => leafletMap.removeLayer(m))
  locationMarkers = []

  locations.value.forEach(loc => {
    if (!loc.enabled) return

    const isSelected = loc.id === selectedLocationId.value
    const isStation = loc.type === 'ground-station'
    const markerColor = isStation ? '#38bdf8' : '#f59e0b'
    const iconSymbol = isStation ? '📡' : '🎯'

    const markerHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110">
        ${isSelected ? '<div class="absolute w-8 h-8 rounded-full border border-sky-400 animate-ping opacity-75"></div>' : ''}
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg border ${
          isSelected
            ? 'bg-sky-500 text-slate-950 border-white ring-2 ring-sky-400'
            : isStation
              ? 'bg-sky-950 text-sky-300 border-sky-500/40'
              : 'bg-amber-950 text-amber-300 border-amber-500/40'
        }">
          <span>${iconSymbol}</span>
        </div>
        <div class="absolute top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-[9px] font-semibold ${
          isSelected ? 'text-sky-300 border-sky-400' : 'text-slate-300'
        } whitespace-nowrap">
          ${loc.shortName || loc.name}
        </div>
      </div>
    `

    const icon = L.divIcon({
      html: markerHtml,
      className: 'location-custom-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })

    const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(leafletMap)
    marker.on('click', () => {
      selectedLocationId.value = loc.id
    })

    locationMarkers.push(marker)
  })
}

// ============================================================================
// 3. ลูกโลก 3D Orbital Globe (HTML5 Canvas 2D Sphere Projection)
// ============================================================================

let globeYaw = 100 // การหมุนแกนลองจิจูด (องศา)
let globePitch = 15 // การก้มเงยแกนละติจูด (องศา)
let globeScale = 1.0
let isDraggingGlobe = false
let lastMouseX = 0
let lastMouseY = 0

// ข้อมูลทวีปแบบจุดพอสังเขปสำหรับแสดงบนลูกโลก 3D
const CONTINENT_OUTLINES = [
  // เอเชีย & ไทย
  [[15, 100], [20, 105], [25, 120], [35, 125], [40, 140], [45, 145], [30, 130], [22, 115], [10, 105], [5, 102], [1, 104], [8, 98], [15, 100]],
  // อินเดีย
  [[8, 77], [20, 72], [28, 70], [32, 75], [28, 85], [20, 85], [12, 80], [8, 77]],
  // ออสเตรเลีย
  [[-12, 130], [-15, 136], [-22, 148], [-32, 152], [-38, 145], [-35, 115], [-22, 114], [-15, 122], [-12, 130]],
  // แอฟริกา
  [[35, -5], [37, 10], [30, 32], [12, 44], [-5, 40], [-25, 33], [-34, 18], [-20, 12], [5, 2], [15, -17], [28, -13], [35, -5]],
  // ยุโรป
  [[36, -5], [43, -9], [50, -5], [58, 5], [60, 25], [50, 30], [42, 28], [40, 15], [38, -2], [36, -5]],
  // อเมริกาเหนือ
  [[30, -85], [25, -80], [30, -75], [45, -65], [55, -60], [60, -95], [50, -125], [35, -120], [25, -100], [30, -85]],
  // อเมริกาใต้
  [[10, -75], [-5, -35], [-23, -42], [-40, -60], [-55, -68], [-35, -72], [-15, -75], [0, -80], [10, -75]]
]

const initGlobeRenderer = () => {
  if (!globeCanvas.value) return
  const canvas = globeCanvas.value
  const ctx = canvas.getContext('2d')

  const render = () => {
    if (currentView.value !== 'globe') return

    const width = canvas.width
    const height = canvas.height
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) * 0.38 * globeScale

    ctx.clearRect(0, 0, width, height)

    // 1. วาดแสงออร่าของชั้นบรรยากาศ (Atmospheric Glow)
    const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.15)
    atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)')
    atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)')
    atmoGrad.addColorStop(1, 'rgba(14, 165, 233, 0)')
    ctx.fillStyle = atmoGrad
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2)
    ctx.fill()

    // 2. วาดทรงกลมมหาสมุทร (Ocean Sphere)
    const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius)
    oceanGrad.addColorStop(0, '#0c2d54')
    oceanGrad.addColorStop(0.7, '#071c35')
    oceanGrad.addColorStop(1, '#030d1a')
    ctx.fillStyle = oceanGrad
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
    ctx.stroke()

    // ฟังก์ชันฉายพิกัด Lat/Lon สู่พิกัด 2D บนลูกโลก (Orthographic Projection)
    const project = (latDeg, lonDeg) => {
      const lat = (latDeg * Math.PI) / 180
      const lon = ((lonDeg - globeYaw) * Math.PI) / 180
      const pitch = (globePitch * Math.PI) / 180

      // 3D Cartesian บนทรงกลมรัศมี 1
      const x = Math.cos(lat) * Math.sin(lon)
      let y = Math.sin(lat)
      let z = Math.cos(lat) * Math.cos(lon)

      // หมุนแกน Pitch (ขึ้น-ลง)
      const yNew = y * Math.cos(pitch) - z * Math.sin(pitch)
      const zNew = y * Math.sin(pitch) + z * Math.cos(pitch)
      y = yNew
      z = zNew

      const visible = z > 0 // อยู่ซีกหน้าหรือไม่
      const screenX = cx + x * radius
      const screenY = cy - y * radius

      return { x: screenX, y: screenY, visible, z }
    }

    // 3. วาดเส้นขอบทวีป (Continents)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.clip()

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.fillStyle = 'rgba(2, 132, 199, 0.15)'
    ctx.lineWidth = 1.2

    CONTINENT_OUTLINES.forEach(poly => {
      ctx.beginPath()
      let first = true
      poly.forEach(([lat, lon]) => {
        const p = project(lat, lon)
        if (p.visible) {
          if (first) {
            ctx.moveTo(p.x, p.y)
            first = false
          } else {
            ctx.lineTo(p.x, p.y)
          }
        }
      })
      ctx.stroke()
      ctx.fill()
    })

    // 4. วาดเส้นศูนย์สูตรและเส้นละติจูดอ้างอิง
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.lineWidth = 1
    ;[-30, 0, 30].forEach(latRef => {
      ctx.beginPath()
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = project(latRef, lon)
        if (p.visible) {
          if (lon === -180) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
      }
      ctx.stroke()
    })

    // 5. วาดวงแหวนวิถีวงโคจร 3D (3D Orbit Trajectory Ring)
    const satColor = selectedSatellite.value?.color || '#00e5ff'
    ctx.strokeStyle = satColor
    ctx.lineWidth = 1.8
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    const orbitAltR = radius * (1 + (currentPosition.value?.alt || 500) / 6371)
    for (let angle = 0; angle <= 360; angle += 3) {
      const rad = (angle * Math.PI) / 180
      // จำลองวงโคจรเอียง (Sun-Synchronous Inclination 97.45°)
      const orbitLat = Math.sin(rad) * 97.45 * 0.95
      const orbitLon = angle * 1.05 - 60
      const p = project(orbitLat, orbitLon)
      if (p.visible) {
        if (angle === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
    }
    ctx.stroke()
    ctx.setLineDash([])

    // 6. วาดสถานีภาคพื้นดินบนลูกโลก
    if (selectedLocation.value) {
      const gsp = project(selectedLocation.value.latitude, selectedLocation.value.longitude)
      if (gsp.visible) {
        ctx.fillStyle = '#38bdf8'
        ctx.beginPath()
        ctx.arc(gsp.x, gsp.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.2
        ctx.stroke()

        ctx.fillStyle = '#e0f2fe'
        ctx.font = '10px Prompt, sans-serif'
        ctx.fillText(selectedLocation.value.shortName || selectedLocation.value.name, gsp.x + 6, gsp.y - 4)
      }
    }

    // 7. วาดตำแหน่งดาวเทียม 3D และลำแสงส่องลงพื้น (Laser Footprint)
    if (currentPosition.value) {
      const sp = project(currentPosition.value.lat, currentPosition.value.lon)
      if (sp.visible) {
        // ลำแสงเรดาห์พัลส์
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2)
        ctx.stroke()

        // จุดดาวเทียมเรืองแสง
        ctx.fillStyle = satColor
        ctx.shadowColor = satColor
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 5.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // ป้ายชื่อดาวเทียม
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 11px Prompt, sans-serif'
        ctx.fillText(selectedSatellite.value?.name || 'SAT', sp.x + 8, sp.y + 4)
      }
    }

    ctx.restore()

    globeAnimId = requestAnimationFrame(render)
  }

  // ปรับขนาดแคนวาสให้คมชัดระดับ Retina
  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  resize()
  globeAnimId = requestAnimationFrame(render)
}

// ควบคุมการลากหมุนลูกโลกด้วยเมาส์
const onGlobeMouseDown = (e) => {
  isDraggingGlobe = true
  lastMouseX = e.clientX
  lastMouseY = e.clientY
}

const onGlobeMouseMove = (e) => {
  if (!isDraggingGlobe) return
  const dx = e.clientX - lastMouseX
  const dy = e.clientY - lastMouseY

  globeYaw -= dx * 0.45
  globePitch = Math.max(-65, Math.min(65, globePitch + dy * 0.45))

  lastMouseX = e.clientX
  lastMouseY = e.clientY
  isFollowingSatellite.value = false
}

const onGlobeMouseUp = () => {
  isDraggingGlobe = false
}

const onGlobeWheel = (e) => {
  e.preventDefault()
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  globeScale = Math.max(0.6, Math.min(2.5, globeScale + delta))
}

// ============================================================================
// 4. ควบคุมฟังก์ชัน Viewport (Zoom, Recenter, Fullscreen)
// ============================================================================

const zoomIn = () => {
  if (currentView.value === 'map' && leafletMap) {
    leafletMap.zoomIn()
  } else {
    globeScale = Math.min(2.5, globeScale + 0.15)
  }
}

const zoomOut = () => {
  if (currentView.value === 'map' && leafletMap) {
    leafletMap.zoomOut()
  } else {
    globeScale = Math.max(0.6, globeScale - 0.15)
  }
}

const focusSatellite = () => {
  isFollowingSatellite.value = true
  if (currentPosition.value) {
    if (currentView.value === 'map' && leafletMap) {
      leafletMap.setView([currentPosition.value.lat, currentPosition.value.lon], Math.max(leafletMap.getZoom(), 4), { animate: true })
    } else {
      globeYaw = currentPosition.value.lon
      globePitch = currentPosition.value.lat
    }
  }
}

const recenterWorld = () => {
  isFollowingSatellite.value = false
  if (currentView.value === 'map' && leafletMap) {
    leafletMap.setView([15.0, 101.5], 3, { animate: true })
  } else {
    globeYaw = 100
    globePitch = 15
    globeScale = 1.0
  }
}

const refreshOrbitData = () => {
  isRefreshing.value = true
  updateOrbitTracks()
  recalculateNextPass()
  updateRealtimeData()
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

const toggleFullscreen = () => {
  if (!widgetWrapper.value) return
  if (!document.fullscreenElement) {
    widgetWrapper.value.requestFullscreen().then(() => {
      isFullscreen.value = true
      nextTick(() => leafletMap?.invalidateSize())
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      nextTick(() => leafletMap?.invalidateSize())
    })
  }
}

// สลับมุมมองระหว่าง 2D Map และ 3D Globe
const switchView = (v) => {
  currentView.value = v
  nextTick(() => {
    if (v === 'map') {
      if (!leafletMap) initLeafletMap()
      leafletMap.invalidateSize()
      updateRealtimeData()
    } else if (v === 'globe') {
      if (!globeAnimId) initGlobeRenderer()
    }
  })
}

// ติดตามการเปลี่ยนดาวเทียมหรือสถานี
watch(selectedNoradId, () => {
  updateOrbitTracks()
  recalculateNextPass()
  updateRealtimeData()
  if (satMarker && selectedSatellite.value) {
    satMarker.setIcon(
      L.divIcon({
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <div class="absolute w-12 h-12 rounded-full border border-sky-400/50 animate-ping opacity-60"></div>
            <div class="absolute w-8 h-8 rounded-full bg-sky-400/20"></div>
            <svg class="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.9)]" viewBox="0 0 36 36" fill="none">
              <rect x="2" y="13" width="9" height="10" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
              <rect x="25" y="13" width="9" height="10" rx="1.5" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
              <rect x="13" y="11" width="10" height="14" rx="2" fill="#0f172a" stroke="${selectedSatellite.value.color || '#00e5ff'}" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="3" fill="#38bdf8"/>
              <circle cx="18" cy="18" r="1.2" fill="#ffffff"/>
              <line x1="18" y1="11" x2="18" y2="5" stroke="#e0f2fe" stroke-width="1.5"/>
              <circle cx="18" cy="4" r="1.5" fill="#38bdf8"/>
            </svg>
            <div class="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-sky-500/40 text-[10px] font-bold text-sky-200 whitespace-nowrap shadow-lg">
              ${selectedSatellite.value.name}
            </div>
          </div>
        `,
        className: 'sat-custom-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    )
  }
})

watch(selectedLocationId, () => {
  renderLocationsOnMap()
  recalculateNextPass()
  updateRealtimeData()
})

// ============================================================================
// 5. Lifecycle Hooks
// ============================================================================

let resizeObserver = null

onMounted(() => {
  nextTick(() => {
    initLeafletMap()
    // อัปเดตข้อมูลทุก 1 วินาที
    liveTimer = setInterval(updateRealtimeData, 1000)

    if (window.ResizeObserver && widgetWrapper.value) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMap) {
          leafletMap.invalidateSize()
        }
      })
      resizeObserver.observe(widgetWrapper.value)
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (liveTimer) clearInterval(liveTimer)
  if (globeAnimId) cancelAnimationFrame(globeAnimId)
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})

// คำนวณเวลานับถอยหลังสู่ AOS/LOS เป็นสตริง
const passCountdownText = computed(() => {
  if (!nextPass.value) return 'ไม่พบรอบพาสใน 36 ชั่วโมงข้างหน้า'
  const now = currentTime.value.getTime()
  const aos = nextPass.value.aos.getTime()
  const los = nextPass.value.los.getTime()

  if (now < aos) {
    const diffSec = Math.round((aos - now) / 1000)
    const m = Math.floor(diffSec / 60)
    const s = diffSec % 60
    return `▲ สัญญาณเริ่ม (AOS) ในอีก ${m} นาที ${s < 10 ? '0' : ''}${s} วินาที`
  } else if (now >= aos && now <= los) {
    const diffSec = Math.round((los - now) / 1000)
    const m = Math.floor(diffSec / 60)
    const s = diffSec % 60
    return `■ กำลังติดต่อสัญญาณ (Active Contact) สิ้นสุด (LOS) ใน ${m} นาที ${s < 10 ? '0' : ''}${s} วินาที`
  } else {
    return 'พาสเพิ่งสิ้นสุดลง กำลังคำนวณรอบถัดไป...'
  }
})

const passAosFormatted = computed(() => {
  if (!nextPass.value?.aos) return '—'
  return nextPass.value.aos.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
})

const passLosFormatted = computed(() => {
  if (!nextPass.value?.los) return '—'
  return nextPass.value.los.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
})
</script>

<template>
  <div
    ref="widgetWrapper"
    class="relative flex flex-col rounded-2xl border-2 border-sky-500/25 bg-[#051122] shadow-2xl overflow-hidden font-prompt"
    :class="isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-full'"
  >
    <!-- 1. Top View Bar (3D Globe / 2D Map + Map Layer) -->
    <div class="orbit-view-bar">
      <!-- 2D / 3D Mode Tabs -->
      <div class="orbit-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="currentView === 'globe'"
          @click="switchView('globe')"
        >
          <Globe2 class="w-4 h-4" />
          <span>3D Globe (ลูกโลก 3 มิติ)</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="currentView === 'map'"
          @click="switchView('map')"
        >
          <MapIcon class="w-4 h-4" />
          <span>2D Map (แผนที่แนวโคจร)</span>
        </button>
      </div>

      <!-- Map Layer Switcher -->
      <div class="orbit-map-layer flex items-center gap-2">
        <span class="text-sky-200 text-sm font-semibold flex items-center gap-1.5">
          <Layers class="w-4 h-4 text-cyan-300" />
          <span class="hidden sm:inline">เลเยอร์แผนที่:</span>
        </span>
        <select
          v-model="currentLayer"
          :disabled="currentView === 'globe'"
          @change="switchLayer(currentLayer)"
        >
          <option value="dark">🌙 ยุทธวิธีมืด (Dark Tactical)</option>
          <option value="sat">🛰️ ภาพถ่ายดาวเทียม (ArcGIS Satellite)</option>
          <option value="street">🗺️ แผนที่ถนน (OpenStreetMap)</option>
        </select>
      </div>
    </div>

    <!-- 2. Satellite & Location Selector Controls Bar -->
    <div class="globe-selection">
      <label class="flex items-center gap-2">
        <span class="text-sky-200 font-bold text-sm">กลุ่ม:</span>
        <select v-model="selectedGroup">
          <option value="all">ดาวเทียมทั้งหมด (All)</option>
          <option value="tactical">ยุทธการ ทอ. (RTAF)</option>
          <option value="national">ดาวเทียมแห่งชาติ (GISTDA)</option>
          <option value="international">ดาวเทียมสากล (Global)</option>
        </select>
      </label>

      <label class="flex items-center gap-2 flex-1 min-w-[200px]">
        <span class="text-sky-200 font-bold text-sm">ดาวเทียม:</span>
        <select v-model="selectedNoradId" class="font-bold text-cyan-300 flex-1">
          <option
            v-for="sat in availableSatellites"
            :key="sat.noradId"
            :value="sat.noradId"
          >
            {{ sat.name }} (NORAD {{ sat.noradId }})
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2 flex-1 min-w-[200px]">
        <span class="text-sky-200 font-bold text-sm">สถานี/เป้าหมาย:</span>
        <select v-model="selectedLocationId" class="flex-1 font-semibold text-white">
          <option
            v-for="loc in availableLocations"
            :key="loc.id"
            :value="loc.id"
          >
            {{ loc.type === 'ground-station' ? '📡' : '🎯' }} {{ loc.name }}
          </option>
        </select>
      </label>

      <!-- Quick Settings Buttons -->
      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          class="setting-btn"
          title="จัดการดาวเทียมและสีเส้นทาง"
          @click="showSatelliteModal = true"
        >
          <Sliders class="w-4 h-4 text-cyan-300" />
          <span>ดาวเทียม</span>
        </button>

        <button
          type="button"
          class="setting-btn"
          title="จัดการสถานีภาคพื้นดินและมุมยกต่ำสุด"
          @click="showLocationModal = true"
        >
          <RadioTower class="w-4 h-4 text-cyan-300" />
          <span>สถานี</span>
        </button>
      </div>
    </div>

    <!-- 3. Realtime Pass Countdown & Contact Status Banner -->
    <div class="tracker-pass-summary">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
          <span class="p-1.5 rounded-md bg-sky-500/30 text-cyan-300">
            <Radio class="w-4 h-4" />
          </span>
          <span>{{ selectedLocation?.shortName || selectedLocation?.name }}</span>
          <span class="text-cyan-300 text-xs sm:text-sm font-mono">(มุมยก ≥ {{ selectedLocation?.minElevationDeg || 5 }}°)</span>
        </div>

        <!-- AOS / LOS Live Countdown Badge -->
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm"
          :class="lookAngles?.inContact ? 'bg-emerald-900/90 text-emerald-200 border-2 border-emerald-400 animate-pulse' : 'bg-sky-950 text-cyan-200 border-2 border-sky-400/60'"
        >
          <Clock class="w-4 h-4" />
          <span>{{ passCountdownText }}</span>
        </div>

        <div v-if="nextPass" class="inline-flex items-center gap-3 text-xs sm:text-sm">
          <span v-if="lookAngles?.inContact" class="tracker-aos font-bold text-emerald-300">
            ● กำลังติดต่อสัญญาณ (Active Pass)
          </span>
          <span v-else class="inline-flex items-center gap-2.5">
            <span class="tracker-aos text-emerald-300 font-bold">▲ AOS: {{ passAosFormatted }}</span>
            <span class="tracker-los text-rose-300 font-bold">■ LOS: {{ passLosFormatted }}</span>
          </span>
        </div>
      </div>

      <div v-if="nextPass" class="flex items-center gap-3 text-xs sm:text-sm text-sky-100 ml-auto font-medium">
        <span>
          มุมยกสูงสุด: <strong class="text-amber-300 font-bold text-sm sm:text-base">{{ nextPass.maxElevation.toFixed(1) }}°</strong>
        </span>
        <span class="hidden md:inline">
          ระยะเวลา: <strong class="text-white font-bold text-sm sm:text-base">{{ nextPass.durationMin }} นาที</strong>
        </span>
      </div>
    </div>

    <!-- 4. Interactive Viewport (Map / Globe Canvas) -->
    <div class="relative w-full flex-1 min-h-[360px] bg-[#071322] overflow-hidden">
      <!-- 2D Leaflet Map Container -->
      <div
        ref="mapContainer"
        class="absolute inset-0 w-full h-full"
        :class="{ hidden: currentView !== 'map' }"
      />

      <!-- 3D Canvas Globe Container -->
      <div
        v-show="currentView === 'globe'"
        class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
        @mousedown="onGlobeMouseDown"
        @mousemove="onGlobeMouseMove"
        @mouseup="onGlobeMouseUp"
        @mouseleave="onGlobeMouseUp"
        @wheel="onGlobeWheel"
      >
        <canvas ref="globeCanvas" class="w-full h-full block" />
      </div>

      <!-- Telemetry Overlay (Top-Left, Sleek non-obstructive original layout) -->
      <div class="globe-telemetry">
        <!-- Live TLE Prediction Badge -->
        <div class="globe-prediction">
          <span class="globe-status-dot is-available" />
          <span class="text-white font-bold">TLE prediction · </span>
          <strong
            class="globe-selected-name"
            :style="{ borderLeftColor: selectedSatellite?.color || '#00e5ff', color: selectedSatellite?.color || '#00e5ff' }"
          >
            {{ selectedSatellite?.name }}
          </strong>
        </div>

        <!-- Inline Readings Chips -->
        <div class="globe-readings">
          <span>
            <small>Altitude</small>
            <strong>{{ currentPosition ? `${currentPosition.alt.toFixed(1)} km` : '—' }}</strong>
          </span>
          <span>
            <small>Velocity</small>
            <strong>{{ currentPosition ? `${currentPosition.velocity.toFixed(2)} km/s` : '—' }}</strong>
          </span>
          <span>
            <small>Latitude</small>
            <strong>{{ formatCoordinate(currentPosition?.lat, 'N', 'S') }}</strong>
          </span>
          <span>
            <small>Longitude</small>
            <strong>{{ formatCoordinate(currentPosition?.lon, 'E', 'W') }}</strong>
          </span>
          <span>
            <small>Elevation</small>
            <strong :class="lookAngles?.inContact ? 'text-emerald-300' : 'text-white'">
              {{ lookAngles ? `${lookAngles.elevation.toFixed(1)}° EL` : '—' }}
            </strong>
          </span>
          <span>
            <small>Sunlight</small>
            <strong :class="sunlitStatus ? 'text-amber-300' : 'text-indigo-200'">
              {{ sunlitStatus ? '☀️ Sunlit' : '🌑 Eclipse' }}
            </strong>
          </span>
        </div>
      </div>

      <!-- Zoom Controls (Top-Right) -->
      <div class="globe-zoom">
        <button
          type="button"
          title="ซูมเข้า (Zoom In)"
          @click="zoomIn"
        >
          <Plus class="w-4 h-4" />
        </button>

        <button
          type="button"
          title="ซูมออก (Zoom Out)"
          @click="zoomOut"
        >
          <Minus class="w-4 h-4" />
        </button>
      </div>

      <!-- Bottom Floating Toolbar (Gesture Hint + Action Controls) -->
      <div class="globe-toolbar">
        <div class="globe-gesture-hint">
          ลากเมาส์เพื่อเลื่อนแผนที่ / หมุนลูกโลก · หมุนลูกกลิ้งเพื่อซูม
        </div>

        <div class="globe-actions">
          <button
            type="button"
            :class="{ 'is-active': isFollowingSatellite }"
            title="ล็อกติดตามดาวเทียม (Follow Satellite)"
            @click="focusSatellite"
          >
            <Crosshair class="w-4 h-4" />
            <span>ติดตามดาวเทียม</span>
          </button>

          <button
            type="button"
            title="จัดมุมมองกึ่งกลางแผนที่โลก (Recenter Earth)"
            @click="recenterWorld"
          >
            <Globe2 class="w-4 h-4" />
            <span>กึ่งกลางโลก</span>
          </button>

          <button
            type="button"
            title="รีเฟรชข้อมูลวงโคจร (Refresh TLE)"
            @click="refreshOrbitData"
          >
            <RotateCw class="w-4 h-4" :class="isRefreshing ? 'animate-spin text-sky-400' : ''" />
            <span>รีเฟรช TLE</span>
          </button>

          <button
            type="button"
            :title="isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มจอ'"
            @click="toggleFullscreen"
          >
            <Minimize2 v-if="isFullscreen" class="w-4 h-4" />
            <Maximize2 v-else class="w-4 h-4" />
            <span>{{ isFullscreen ? 'ย่อหน้าจอ' : 'เต็มจอ' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Bottom Status Bar & Orbit Legend -->
    <div class="globe-data-status">
      <!-- Satellites Available Count & Legend -->
      <div class="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-white">
        <span class="text-cyan-200 font-bold">
          {{ availableSatellites.length }} / {{ satellites.length }} ดาวเทียมพร้อมใช้งาน
        </span>

        <!-- Line Legend -->
        <div class="inline-flex items-center gap-4 text-xs sm:text-sm">
          <span class="inline-flex items-center gap-2">
            <span class="w-5 h-1 bg-sky-400 inline-block rounded-full"></span>
            <span class="text-sky-100">เส้นทึบ: แทร็กอดีต (Past)</span>
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-5 h-0.5 border-t-2 border-dashed border-sky-300 inline-block"></span>
            <span class="text-sky-100">เส้นประ: แทร็กล่วงหน้า (Future)</span>
          </span>
          <span class="inline-flex items-center gap-2">
            <span class="w-5 h-0.5 border-t-2 border-dotted border-emerald-400 inline-block"></span>
            <span class="text-emerald-200">จุดสีเขียว: วิถีพาสสัญญาณ</span>
          </span>
        </div>
      </div>

      <!-- TLE Epoch & Ground Track Coverage -->
      <div class="flex items-center gap-3 text-xs sm:text-sm text-sky-200 font-medium">
        <span class="text-cyan-300 font-bold">
          TLE Epoch: {{ selectedSatellite?.epochDate || '2026-09-11 UTC' }}
        </span>
        <span class="text-sky-400">|</span>
        <span class="text-white">SGP4 High-Precision Ground Track ±48 นาที</span>
      </div>
    </div>

    <!-- Modals -->
    <SatelliteSettingsModal
      v-model="showSatelliteModal"
      :satellites="satellites"
      @save="onSaveSatellites"
    />

    <GroundStationSettingsModal
      v-model="showLocationModal"
      :locations="locations"
      @save="onSaveLocations"
    />
  </div>
</template>

<style scoped>
/* สไตล์แท็บด้านบน */
.orbit-view-bar {
  background: #06152b;
  border-bottom: 1.5px solid rgba(56, 189, 248, 0.25);
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  display: flex;
  flex-wrap: wrap;
}

.orbit-view-tabs {
  background: #030a17;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  gap: 3px;
  padding: 3px;
  display: flex;
}

.orbit-view-tabs button {
  background: transparent;
  border: 1px solid transparent;
  min-height: 32px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #cce3f8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.orbit-view-tabs button[aria-selected="true"] {
  color: #ffffff;
  background: #0284c7;
  border-color: #38bdf8;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  font-weight: 700;
}

.orbit-map-layer select {
  color: #ffffff;
  background: #081a36;
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  min-height: 32px;
}

/* แถบเลือกดาวเทียมและสถานี */
.globe-selection {
  background: #06152b;
  border-bottom: 1.5px solid rgba(56, 189, 248, 0.25);
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  display: flex;
  flex-wrap: wrap;
}

.globe-selection select {
  color: #ffffff;
  background: #081a36;
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 6px;
  min-height: 32px;
  padding: 4px 10px;
  font-size: 0.82rem;
  font-weight: 600;
}

.setting-btn {
  background: #081a36;
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-btn:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #7dd3fc;
}

/* แถบสรุปพาส */
.tracker-pass-summary {
  color: #e0f2fe;
  background: #071933;
  border-bottom: 1.5px solid rgba(56, 189, 248, 0.25);
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 8px 14px;
  font-size: 13px;
  display: flex;
}

.tracker-aos {
  color: #4ade80;
  font-weight: 700;
}

.tracker-los {
  color: #fb7185;
  font-weight: 700;
}

/* Telemetry HUD */
.globe-telemetry {
  pointer-events: none;
  color: #ffffff;
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 25;
  max-width: calc(100% - 80px);
}

.globe-prediction {
  color: #ffffff;
  background: rgba(6, 19, 36, 0.95);
  border: 1.5px solid #38bdf8;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
}

.globe-selected-name {
  border-left: 2.5px solid #00e5ff;
  margin-left: 6px;
  padding-left: 8px;
  font-weight: 700;
  font-size: 0.92rem;
}

.globe-status-dot {
  background: #74869a;
  border-radius: 50%;
  width: 8px;
  height: 8px;
}

.globe-status-dot.is-available {
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
}

.globe-readings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.globe-readings > span {
  background: rgba(6, 19, 36, 0.95);
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-bottom: 3px solid #38bdf8;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
}

.globe-readings small {
  color: #7dd3fc;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.globe-readings strong {
  white-space: nowrap;
  font-size: 0.92rem;
  font-weight: 700;
  color: #ffffff;
}

/* ปุ่มซูม */
.globe-zoom {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.globe-zoom button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(8, 24, 44, 0.95);
  border: 1.5px solid #38bdf8;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  transition: all 0.15s;
}

.globe-zoom button:hover {
  background: #0284c7;
  border-color: #7dd3fc;
  color: #ffffff;
}

/* แถบควบคุมด้านล่าง */
.globe-toolbar {
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  z-index: 25;
  pointer-events: none;
  background: linear-gradient(to top, rgba(5, 16, 30, 0.98), transparent);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 22px 14px 10px;
}

.globe-gesture-hint {
  color: #bae6fd;
  font-size: 0.78rem;
  font-weight: 500;
  pointer-events: none;
}

.globe-actions {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.globe-actions button {
  background: rgba(8, 24, 44, 0.95);
  border: 1.5px solid #38bdf8;
  color: #ffffff;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(6px);
  transition: all 0.15s;
}

.globe-actions button:hover {
  background: #0284c7;
  border-color: #7dd3fc;
  color: #ffffff;
}

.globe-actions button.is-active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.5);
}

/* แถบสถานะล่างสุด */
.globe-data-status {
  background: #0a1728;
  border-top: 2px solid #204060;
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #bae6fd;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* Leaflet & Marker */
:deep(.leaflet-container) {
  background-color: #071322 !important;
  font-family: 'Prompt', sans-serif !important;
}

:deep(.sat-custom-icon),
:deep(.location-custom-icon) {
  background: transparent !important;
  border: none !important;
}
</style>
