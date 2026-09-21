<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/LoginView.vue
 * วัตถุประสงค์: หน้าจอเข้าสู่ระบบ (Login Screen) สไตล์ Military Aerospace Command Center
 * ธีม: ดำเทาไททาเนียม (Obsidian Charcoal & Titanium Slate) ฟอนต์ Prompt 100%
 * ระบบ 3D: Three.js WebGL Scene
 *   - Tactical Dark Earth: โลก 3D โทนดำออบซิเดียน พื้นทวีปสมจริง แสงไฟเมือง Micro-Fiber Optic
 *   - Atmosphere Rim Shader: ขอบชั้นบรรยากาศสีฟ้าแซฟไฟร์เรืองแสงนุ่มนวล ปลอดภัยไร้บั๊ก NaN
 *   - Stealth Titanium Satellite (NAPA-2): โมเดล 3D โลหะไททาเนียม แผ่นแคปตัน ปีกโซลาร์เซลล์ ไฟกระพริบนาวิเกชัน
 *   - Cinematic Flyby & Orbital Arc: ดาวเทียมโฉบผ่านหน้ากล้องระยะประชิด แล้วโคจรเลี้ยวรอบโลกอย่างสง่างาม
 *   - Dynamic Camera Pursuit: มุมกล้องแพน หมุน และเหินไล่ตามดาวเทียมที่กำลังโคจรรอบโลก
 *   - Soft Circular Ion Exhaust Embers: ละอองไอพ่นพลาสมาทรงกลมเรืองแสง นุ่มนวล ไม่เป็นสี่เหลี่ยม
 *   - Classified Data Shield: ปลอดภัย ไม่เปิดเผยข้อมูลลับ บุคลากร หรือรหัสยุทธการก่อนล็อกอิน
 * ============================================================================
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import * as THREE from 'three'
import {
  LogIn,
  Eye,
  EyeOff,
  User,
  Lock,
  FastForward,
  AlertTriangle,
  ShieldCheck,
  Radio,
  LockKeyhole
} from 'lucide-vue-next'
import SomsLogo from '@/components/common/SomsLogo.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')
const loading = ref(false)
const isShaking = ref(false)

// สถานะการเปลี่ยนผ่านแบบภาพยนตร์ (Cinematic Transition State)
const isTransitioning = ref(false)
const transitionProgress = ref(0)
const curtainOpacity = ref(0)
const skipRequested = ref(false)

let destinationPath = '/dashboard'

// ทริกเกอร์แอนิเมชันการ์ดสั่นเมื่อข้อมูลไม่ถูกต้อง
const triggerShake = () => {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 600)
}

// ทางลัดกรอกข้อมูลสำหรับทดสอบระบบ (Dev Shortcut - ดับเบิ้ลคลิกที่ตราโลโก้เพื่อกรอกอัตโนมัติ)
const autofillDev = () => {
  username.value = 'developer'
  password.value = 'password1234'
}

// ============================================================================
// ฟังก์ชันจัดการการเข้าสู่ระบบ
// ============================================================================
const handleLogin = async () => {
  if (!username.value.trim()) {
    errorMessage.value = 'กรุณาระบุชื่อผู้ใช้งาน (Username)'
    triggerShake()
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const result = await authStore.login(username.value.trim(), password.value)
    destinationPath = result.setupRequired ? '/setup-password' : '/dashboard'

    // ล้างข้อความแจ้งเตือนเก่าเมื่อเข้าสู่ระบบสำเร็จ
    if (appStore.toasts) {
      appStore.toasts = []
    }

    loading.value = false
    startCinematicSequence()
  } catch (err) {
    loading.value = false
    errorMessage.value = err.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
    triggerShake()
    appStore.showToast('เข้าสู่ระบบไม่สำเร็จ', errorMessage.value, 'error')
  }
}

// ข้ามแอนิเมชันสำหรับผู้ที่ต้องการเข้าใช้งานทันที
const skipTransition = () => {
  skipRequested.value = true
  curtainOpacity.value = 1
  setTimeout(() => {
    appStore.showToast('ยินดีต้อนรับสู่ระบบ SOIS', 'เข้าสู่ระบบสำเร็จ เข้าสู่คอนโซลปฏิบัติการ')
    router.push(destinationPath)
  }, 180)
}

// ============================================================================
// Three.js 3D WebGL Engine (Earth Globe & Orbital Constellation Scene)
// ============================================================================
const canvasRef = ref(null)
let animId = null
let renderer = null
let scene = null
let camera = null
let earthMesh = null
let cloudMesh = null
let earthAtmosphere = null
let starsPoints = null
let satellitesList = []

let transitionStartTime = 0
const TRANSITION_DURATION = 1800 // 1.8 วินาที เข้าสู่วงโคจรอย่างรวดเร็ว สง่างาม สมูท ไม่กระตุก
const transitionStartCamPos = new THREE.Vector3(0, 1.5, 85)

// ฟังก์ชันเริ่มแอนิเมชันเปลี่ยนผ่าน
const startCinematicSequence = () => {
  isTransitioning.value = true
  transitionStartTime = performance.now()
  if (camera) {
    transitionStartCamPos.copy(camera.position)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// กำหนดข้อมูลกลุ่มดาวเทียมตรวจการณ์ขนาดเล็ก (Constellation of Satellites)
// ทรงตัวอยู่ในวงโคจรจริงที่มีความเอียง (Inclination) และความสูง (Radius) แตกต่างกัน
// ─────────────────────────────────────────────────────────────────────────────
const SATELLITES_DATA = [
  { name: 'NAPA-1', radius: 46, incl: 97.4, raan: 0.3, speed: 0.11, phase: 0.2, color: 0x38bdf8, beaconColor: 0x38bdf8, size: 1.0 },
  { name: 'NAPA-2', radius: 49, incl: 97.6, raan: 1.4, speed: 0.10, phase: 2.1, color: 0x38bdf8, beaconColor: 0x34d399, size: 1.1 },
  { name: 'THEOS-2', radius: 52, incl: 98.2, raan: 2.5, speed: 0.09, phase: 3.8, color: 0x34d399, beaconColor: 0x34d399, size: 1.2 },
  { name: 'SENTINEL-2A', radius: 56, incl: 98.6, raan: 3.8, speed: 0.08, phase: 4.9, color: 0x60a5fa, beaconColor: 0x60a5fa, size: 1.0 },
  { name: 'BLACKSKY-G2', radius: 47, incl: 53.0, raan: 0.8, speed: 0.12, phase: 1.5, color: 0xfbbf24, beaconColor: 0xfbbf24, size: 0.9 },
  { name: 'BLACKSKY-G3', radius: 50, incl: 45.0, raan: 2.9, speed: 0.11, phase: 5.3, color: 0xfbbf24, beaconColor: 0xfbbf24, size: 0.9 },
  { name: 'DEFENSE-LEO', radius: 44, incl: 28.5, raan: 1.8, speed: 0.13, phase: 0.9, color: 0xf43f5e, beaconColor: 0xf43f5e, size: 0.85 },
  { name: 'SPACE-RADAR', radius: 58, incl: 64.0, raan: 5.1, speed: 0.075, phase: 3.4, color: 0xa855f7, beaconColor: 0xa855f7, size: 1.1 },
  { name: 'TACTICAL-RELAY', radius: 62, incl: 18.0, raan: 4.3, speed: 0.065, phase: 2.7, color: 0x38bdf8, beaconColor: 0x38bdf8, size: 1.2 },
  { name: 'EARTH-OBS-1', radius: 54, incl: 112.0, raan: 3.2, speed: 0.085, phase: 1.1, color: 0x2dd4bf, beaconColor: 0x2dd4bf, size: 0.95 }
]

// ฟังก์ชันสร้างโมเดล 3D ดาวเทียมขนาดเล็กพร้อมแผงโซลาร์เซลล์และไฟกะพริบ
function createSatelliteMesh(sat) {
  const group = new THREE.Group()

  // 1. ตัวถังดาวเทียม (Satellite Bus)
  const isGold = sat.name.includes('THEOS') || sat.name.includes('BLACKSKY')
  const busGeo = new THREE.BoxGeometry(0.8 * sat.size, 0.8 * sat.size, 1.4 * sat.size)
  const busMat = new THREE.MeshStandardMaterial({
    color: isGold ? 0xb45309 : 0x334155,
    metalness: 0.9,
    roughness: 0.22
  })
  const bus = new THREE.Mesh(busGeo, busMat)
  group.add(bus)

  // 2. ปีกโซลาร์เซลล์คู่ซ้าย-ขวา (Dual Solar Arrays)
  const wingGeo = new THREE.BoxGeometry(2.4 * sat.size, 0.55 * sat.size, 0.06)
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    metalness: 0.82,
    roughness: 0.26
  })

  const portWing = new THREE.Mesh(wingGeo, wingMat)
  portWing.position.set(-1.8 * sat.size, 0, 0)
  group.add(portWing)

  const stbdWing = new THREE.Mesh(wingGeo, wingMat)
  stbdWing.position.set(1.8 * sat.size, 0, 0)
  group.add(stbdWing)

  // ตารางโครงโซลาร์เซลล์เรืองแสง
  const gridGeo = new THREE.BufferGeometry()
  const gridPts = []
  const span = 2.4 * sat.size
  for (let gx = -span / 2; gx <= span / 2; gx += 0.6 * sat.size) {
    gridPts.push(new THREE.Vector3(-1.8 * sat.size + gx, 0.04, -0.27 * sat.size))
    gridPts.push(new THREE.Vector3(-1.8 * sat.size + gx, 0.04, 0.27 * sat.size))
    gridPts.push(new THREE.Vector3(1.8 * sat.size + gx, 0.04, -0.27 * sat.size))
    gridPts.push(new THREE.Vector3(1.8 * sat.size + gx, 0.04, 0.27 * sat.size))
  }
  gridGeo.setFromPoints(gridPts)
  const gridLineMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.55 })
  group.add(new THREE.LineSegments(gridGeo, gridLineMat))

  // 3. เซนเซอร์กล้องสำรวจหรือจานสายอากาศ (Payload Sensor / Dish)
  const sensorGeo = new THREE.CylinderGeometry(0.22 * sat.size, 0.28 * sat.size, 0.45 * sat.size, 16)
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.12 })
  const sensor = new THREE.Mesh(sensorGeo, sensorMat)
  sensor.rotation.x = Math.PI / 2
  sensor.position.set(0, 0, 0.8 * sat.size)
  group.add(sensor)

  // 4. ไฟกะพริบสัญญาณนำร่องทางยุทธการ (Navigation Beacon LED)
  const beaconGeo = new THREE.SphereGeometry(0.18 * sat.size, 12, 12)
  const beaconMat = new THREE.MeshBasicMaterial({ color: sat.beaconColor, transparent: true, opacity: 0.95 })
  const beacon = new THREE.Mesh(beaconGeo, beaconMat)
  beacon.position.set(0, 0.5 * sat.size, 0)
  group.add(beacon)

  return { mesh: group, beaconMat }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  let w = window.innerWidth
  let h = window.innerHeight

  // 1. Scene & Camera Setup
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x060911, 0.0010)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000)
  const baseCamPos = new THREE.Vector3(0, 2, 85)
  camera.position.copy(baseCamPos)

  const earthRadius = 38
  const earthCenter = new THREE.Vector3(0, -2, -25)
  camera.lookAt(earthCenter)

  // 2. Renderer Setup
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  // 3. Lighting Setup
  // Deep space ambient light (maintains dramatic contrast for realistic space photography)
  const ambientLight = new THREE.AmbientLight(0x0e1726, 0.45)
  scene.add(ambientLight)

  // Sunlight: Brilliantly illuminates the Eastern Hemisphere (Asia, Thailand, Pacific)
  const sunLight = new THREE.DirectionalLight(0xfffaed, 3.4)
  sunLight.position.set(75, 25, 45)
  scene.add(sunLight)

  // Soft atmospheric rim light on the space edge
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6)
  rimLight.position.set(-60, -20, -15)
  scene.add(rimLight)

  // 4. Starfield (ดวงดาวอวกาศ 3,800 ดวง)
  const starGeo = new THREE.BufferGeometry()
  const starCount = 3800
  const starPos = new Float32Array(starCount * 3)
  const starColors = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount; i++) {
    const idx = i * 3
    const radius = 280 + Math.random() * 600
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)

    starPos[idx] = radius * Math.sin(phi) * Math.cos(theta)
    starPos[idx + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starPos[idx + 2] = radius * Math.cos(phi)

    const cR = Math.random()
    if (cR > 0.85) {
      starColors[idx] = 0.85; starColors[idx + 1] = 0.94; starColors[idx + 2] = 1.0
    } else if (cR > 0.7) {
      starColors[idx] = 1.0; starColors[idx + 1] = 0.95; starColors[idx + 2] = 0.85
    } else {
      starColors[idx] = 0.96; starColors[idx + 1] = 0.96; starColors[idx + 2] = 0.98
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

  const starMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    sizeAttenuation: true
  })
  starsPoints = new THREE.Points(starGeo, starMat)
  scene.add(starsPoints)

  // 5. Realistic NASA Colored Earth Globe (ลูกโลกสมจริง NASA Blue Marble พร้อม Bump Map & City Lights)
  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load('/assets/earth/earth-blue-marble.jpg')
  earthTexture.colorSpace = THREE.SRGBColorSpace

  const bumpTexture = textureLoader.load('/assets/earth/earth-topology.png')

  const nightTexture = textureLoader.load('/assets/earth/earth-night.jpg')
  nightTexture.colorSpace = THREE.SRGBColorSpace

  const cloudsTexture = textureLoader.load('/assets/earth/earth-clouds.png')
  cloudsTexture.colorSpace = THREE.SRGBColorSpace

  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64)
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.85,
    roughness: 0.65,
    metalness: 0.1,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffe2a0),
    emissiveIntensity: 0.75
  })
  earthMesh = new THREE.Mesh(earthGeo, earthMat)
  earthMesh.position.copy(earthCenter)
  // เอียงแกนโลกตามจริง (~23.4 องศา)
  earthMesh.rotation.z = -0.409
  earthMesh.rotation.x = 0.12
  earthMesh.rotation.y = 3.15 // หันโซนประเทศไทย/เอเชียตะวันออกเฉียงใต้และมหาสมุทรเข้าหากล้อง
  scene.add(earthMesh)

  // วงโครงข่ายเส้นละติจูดทางยุทธการแบบกลมกลืน
  const gridGroup = new THREE.Group()
  for (let lat = -60; lat <= 60; lat += 30) {
    const rad = (lat * Math.PI) / 180
    const ringR = earthRadius * Math.cos(rad) * 1.002
    const ringY = earthRadius * Math.sin(rad)
    const ringGeo = new THREE.RingGeometry(ringR - 0.1, ringR + 0.1, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = ringY
    gridGroup.add(ring)
  }
  earthMesh.add(gridGroup)

  // 6. ชั้นบรรยากาศและเมฆหมุนวนอิสระ (Atmospheric Cloud Layer)
  const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.014, 64, 64)
  const cloudMat = new THREE.MeshStandardMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.45,
    roughness: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })
  cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
  cloudMesh.position.copy(earthCenter)
  cloudMesh.rotation.z = -0.409
  cloudMesh.rotation.x = 0.12
  cloudMesh.rotation.y = 3.20
  scene.add(cloudMesh)

  // 7. ขอบชั้นบรรยากาศสีฟ้าแซฟไฟร์เรืองแสงนุ่มนวล (Soft Rayleigh Atmosphere Shader)
  const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.018, 64, 64)
  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float fresnel = clamp(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.0, 1.0);
        float intensity = fresnel * fresnel * fresnel;
        vec3 atmosphereColor = vec3(0.24, 0.68, 1.0);
        gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.95;
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  })
  earthAtmosphere = new THREE.Mesh(atmoGeo, atmoMat)
  earthAtmosphere.position.copy(earthCenter)
  scene.add(earthAtmosphere)

  // 8. สร้างฝูงดาวเทียมและเส้นทางวงโคจรเฉพาะดวง (Constellation of Orbiting Satellites)
  satellitesList = []
  SATELLITES_DATA.forEach(satData => {
    // 8.1 เส้นทางวงโคจร 3 มิติ (3D Orbital Trajectory Line)
    const pts = []
    const segs = 120
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(th) * satData.radius, 0, Math.sin(th) * satData.radius))
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts)
    const orbitMat = new THREE.LineBasicMaterial({
      color: satData.color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    })
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat)
    const euler = new THREE.Euler(
      (satData.incl * Math.PI) / 180,
      satData.raan,
      0,
      'YXZ'
    )
    orbitLine.rotation.copy(euler)
    orbitLine.position.copy(earthCenter)
    scene.add(orbitLine)

    // 8.2 โมเดล 3D ดาวเทียม
    const satObj = createSatelliteMesh(satData)
    scene.add(satObj.mesh)

    satellitesList.push({
      data: satData,
      mesh: satObj.mesh,
      beaconMat: satObj.beaconMat,
      euler,
      orbitLine
    })
  })

  // Resize Handler
  const handleResize = () => {
    if (!renderer || !camera) return
    w = window.innerWidth
    h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', handleResize)

  // 9. Render & Animation Loop
  const clock = new THREE.Clock()

  const renderLoop = () => {
    const delta = clock.getDelta()
    const now = performance.now()
    const timeSec = now * 0.001

    // โลกหมุนรอบตัวเองช้าๆ ตามวงโคจรจริง
    if (earthMesh) {
      earthMesh.rotation.y += delta * 0.012
    }
    // ชั้นเมฆหมุนวนคู่ขนาน
    if (cloudMesh) {
      cloudMesh.rotation.y += delta * 0.016
    }
    // ดวงดาวอวกาศหมุนเบาๆ
    if (starsPoints) {
      starsPoints.rotation.y += delta * 0.002
    }

    // อัปเดตตำแหน่งและทิศทางการโคจรของดาวเทียมแต่ละดวง
    satellitesList.forEach(sat => {
      const angle = sat.data.phase + timeSec * sat.data.speed
      // ตำแหน่งบนระนาบวงโคจร
      const localPos = new THREE.Vector3(
        Math.cos(angle) * sat.data.radius,
        0,
        Math.sin(angle) * sat.data.radius
      )
      localPos.applyEuler(sat.euler)
      const worldPos = localPos.clone().add(earthCenter)
      sat.mesh.position.copy(worldPos)

      // เวกเตอร์ความเร็ว (Tangent Vector) เพื่อหันหัวดาวเทียมไปข้างหน้า
      const localTan = new THREE.Vector3(
        -Math.sin(angle) * sat.data.radius,
        0,
        Math.cos(angle) * sat.data.radius
      )
      localTan.applyEuler(sat.euler).normalize()
      sat.mesh.lookAt(worldPos.clone().add(localTan))

      // กะพริบไฟสัญญาณนำร่อง
      if (sat.beaconMat) {
        sat.beaconMat.opacity = Math.sin(now * 0.006 + sat.data.phase) > 0 ? 1.0 : 0.25
      }
    })

    if (!isTransitioning.value) {
      // โหมดปกติก่อนเข้าสู่ระบบ: มุมกล้องลอยช้าๆ ชมลูกโลกและฝูงดาวเทียม
      camera.position.x = Math.sin(now * 0.0003) * 1.5
      camera.position.y = 1.5 + Math.cos(now * 0.00025) * 0.8
      camera.position.z = 85
      camera.lookAt(earthCenter)
    } else {
      // โหมดภาพยนตร์เปลี่ยนผ่าน (Cinematic Orbit Approach & Atmospheric Entry)
      const elapsed = now - transitionStartTime
      const rawProgress = Math.min(1, Math.max(0, elapsed / TRANSITION_DURATION))
      transitionProgress.value = rawProgress

      // Easing Cubic: นุ่มนวล สมูท ละมุนสายตา ไร้การสะดุด
      const ease = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2

      // มุมกล้องเหินเข้าสู่ระยะวงโคจรของสถานีอวกาศ (z = 48) รักษาความคมชัดของโลกรอบด้าน ไม่ซูมจนแตกเบลอ
      const targetCam = new THREE.Vector3(0, -0.5, 48)
      camera.position.lerpVectors(transitionStartCamPos, targetCam, ease)
      camera.lookAt(earthCenter)

      // เพิ่มความเร็วการหมุนของโลกและเมฆเล็กน้อยสร้างไดนามิกการโคจร
      if (earthMesh) earthMesh.rotation.y += delta * ease * 0.045
      if (cloudMesh) cloudMesh.rotation.y += delta * ease * 0.055

      // ม่านแสงไอออโนสเฟียร์และทึบแสงละมุนตาค่อยๆ ขยายคลุมอย่างนุ่มนวล
      if (rawProgress > 0.45) {
        curtainOpacity.value = Math.min(1, Math.max(0, (rawProgress - 0.45) / 0.55))
      }

      // จบการเปลี่ยนผ่าน นำทางเข้าสู่หน้าแดชบอร์ดอย่างราบรื่น
      if (rawProgress >= 1.0 && !skipRequested.value) {
        skipRequested.value = true
        router.push(destinationPath).then(() => {
          setTimeout(() => {
            appStore.showToast(
              'เชื่อมต่อระบบวงโคจรสำเร็จ',
              'ยินดีต้อนรับสู่ระบบ SOIS — เข้าสู่คอนโซลปฏิบัติการ'
            )
          }, 320)
        })
        return
      }
    }

    renderer.render(scene, camera)
    animId = requestAnimationFrame(renderLoop)
  }

  animId = requestAnimationFrame(renderLoop)

  onUnmounted(() => {
    if (animId) cancelAnimationFrame(animId)
    window.removeEventListener('resize', handleResize)
    if (renderer) {
      renderer.dispose()
    }
  })
})
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-gradient-to-br from-[#0a2342] via-[#103b6e] to-[#185396] text-slate-100 font-prompt select-none">
    <!-- 1. Deep Space 3D WebGL Canvas (Tactical Earth & 3D Satellite) -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>

    <!-- 2. Celestial Sky Ambient Radial Glows (ธีมฟ้าสว่าง Luminous Sky) -->
    <div
      class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-sky-400/22 blur-[150px] pointer-events-none transition-opacity duration-1000"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>
    <div
      class="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-cyan-400/20 blur-[160px] pointer-events-none transition-opacity duration-1000"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>

    <!-- 3. Tactical Coordinate Grid & Telemetry Lines -->
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80c_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80c_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none transition-opacity duration-700"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>

    <!-- ===================================================================== -->
    <!-- 4. MAIN SPLIT COMMAND LAYOUT (จัดวางแยกส่วนซ้าย-ขวาอย่างสง่างาม ไม่ซ้อนทับ ไม่ลายตา) -->
    <!-- ===================================================================== -->
    <div
      class="relative z-20 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-500 ease-out"
      :class="isTransitioning ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'"
    >
      <!-- ฝั่งซ้าย (Hero Emblem & Authority Branding) -->
      <div class="lg:col-span-7 flex justify-center lg:justify-start w-full">
        <div class="w-full max-w-xl command-card rounded-3xl p-7 sm:p-9 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <!-- SOMS Official Hero Wordmark & Emblem Logo -->
          <SomsLogo
            variant="hero"
            align="responsive"
            class="w-full cursor-pointer"
            @dblclick="autofillDev"
            title="Double-click for testing"
          />

          <!-- Security Gateway Tags -->
          <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs font-mono font-bold">
            <span class="px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5 shadow-sm">
              <Radio class="w-3.5 h-3.5 text-emerald-400" />
              <span>GATEWAY ACTIVE</span>
            </span>
            <span class="px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-cyan-500/50 text-cyan-200 flex items-center gap-1.5 shadow-sm">
              <LockKeyhole class="w-3.5 h-3.5 text-cyan-400" />
              <span>ENCRYPTED PROTOCOL</span>
            </span>
            <span class="px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-sky-800 text-sky-200 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck class="w-3.5 h-3.5 text-sky-400" />
              <span>DEFENSE NETWORK</span>
            </span>
          </div>
        </div>
      </div>

      <!-- ฝั่งขวา (Login Authorization Form Card) -->
      <div class="lg:col-span-5 flex justify-center lg:justify-end w-full">
        <div
          class="w-full max-w-[440px] transition-all duration-300"
          :class="isShaking ? 'animate-shake' : ''"
        >
          <div class="command-card rounded-3xl p-7 sm:p-8">
            <!-- Card Header -->
            <div class="mb-6 text-left">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
                <span class="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono">SYSTEM ACCESS GATE</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-black font-prompt text-white tracking-wide">
                เข้าสู่ระบบปฏิบัติการ
              </h2>
              <p class="text-sm text-slate-300 mt-1.5 font-prompt font-medium">
                กรุณาระบุข้อมูลประจำตัวที่ได้รับอนุญาตเพื่อเข้าสู่ระบบ
              </p>
            </div>

            <!-- Error Message Box -->
            <div
              v-if="errorMessage"
              class="mb-5 p-3.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-100 text-xs sm:text-sm font-semibold flex items-center gap-2.5 font-prompt shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertTriangle class="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Login Form -->
            <form class="space-y-4" @submit.prevent="handleLogin">
              <!-- Username Input -->
              <div>
                <label for="username" class="block text-sm font-bold text-white mb-1.5 font-prompt tracking-wide">
                  Username <span class="text-cyan-400 font-bold text-xs ml-1">(ชื่อผู้ใช้งาน)</span>
                </label>
                <div class="relative">
                  <User class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    id="username"
                    v-model="username"
                    type="text"
                    required
                    autocomplete="username"
                    placeholder="ระบุชื่อผู้ใช้งาน (Username)"
                    class="w-full pl-11 pr-4 py-3.5 text-base font-bold rounded-xl border-2 border-sky-500/40 bg-[#0e2b50] text-white placeholder:text-sky-300/50 font-prompt focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div>
                <label for="password" class="block text-sm font-bold text-white mb-1.5 font-prompt tracking-wide">
                  Password <span class="text-cyan-400 font-bold text-xs ml-1">(รหัสผ่าน)</span>
                </label>
                <div class="relative">
                  <Lock class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="ระบุรหัสผ่านเข้าสู่ระบบ"
                    class="w-full pl-11 pr-11 py-3.5 text-base font-bold rounded-xl border-2 border-sky-500/40 bg-[#0e2b50] text-white placeholder:text-sky-300/50 font-prompt focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-sky-200 hover:text-white transition-colors p-1.5 cursor-pointer"
                    title="แสดง/ซ่อนรหัสผ่าน"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Remember Me Toggle -->
              <div class="flex items-center justify-between text-sm pt-1">
                <label class="flex items-center gap-2.5 cursor-pointer text-sky-200 hover:text-white transition-colors font-prompt font-bold">
                  <input
                    v-model="rememberMe"
                    type="checkbox"
                    class="rounded border-2 border-sky-400 bg-[#0e2b50] text-cyan-400 focus:ring-cyan-400/20 w-4 h-4 cursor-pointer"
                  />
                  <span>จดจำการเข้าสู่ระบบ</span>
                </label>
              </div>

              <!-- Submit Button (คอนทราสต์สูง มีแสงเรืองรอง สไตล์แอโรสเปซ ชัดเจน ไม่มืดทึบ) -->
              <button
                type="submit"
                :disabled="loading || isTransitioning"
                class="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] disabled:opacity-50 text-white text-base font-black shadow-[0_0_25px_rgba(6,182,212,0.35)] border border-cyan-300/40 transition-all flex items-center justify-center gap-2.5 mt-4 font-prompt tracking-wider cursor-pointer"
              >
                <LogIn class="w-4 h-4 text-white" :class="loading ? 'animate-pulse' : ''" />
                <span>{{ loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ (Sign In)' }}</span>
              </button>
            </form>

            <!-- Card Footer Notice -->
            <div class="mt-6 pt-4 border-t border-sky-600/30 text-center text-xs sm:text-sm font-prompt">
              <p class="text-sky-200 font-medium leading-relaxed">
                ระบบสารสนเทศความมั่นคงทางอวกาศ · สงวนสิทธิ์สำหรับเจ้าหน้าที่เวรปฏิบัติการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 5. CINEMATIC ATMOSPHERIC BLOOM & REVEAL CURTAIN -->
    <!-- แสงเรืองรองชั้นบรรยากาศผสานม่านมืดไททาเนียม ค่อยๆ เรืองคลุมอย่างนุ่มนวล -->
    <!-- ===================================================================== -->
    <div
      class="fixed inset-0 pointer-events-none z-50"
      :style="{
        opacity: curtainOpacity,
        background: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.28) 0%, rgba(10, 35, 66, 0.95) 60%, #0a2342 100%)'
      }"
    ></div>
  </div>
</template>

<style scoped>
.command-card {
  background: rgba(19, 53, 96, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 25px 50px -12px rgba(10, 35, 66, 0.85), 0 0 35px rgba(56, 189, 248, 0.2);
}

/* ============================================================================
   แอนิเมชันการ์ดสั่นเมื่อกรอกรหัสผ่านผิด (Card Shake Animation)
   ============================================================================ */
@keyframes card-shake {
  0%, 100% {
    transform: translateX(0);
  }
  20%, 60% {
    transform: translateX(-10px);
  }
  40%, 80% {
    transform: translateX(10px);
  }
}

.animate-shake {
  animation: card-shake 0.45s ease-in-out;
}

/* ============================================================================
   3D Gyro Orbit Rings (วงแหวนวงโคจรรอบโลโก้ทางการ ISR)
   ============================================================================ */
.logo-float-container {
  animation: logo-float 4.5s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.orbit-ring-3d {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.orbit-ring-1 {
  width: 220px;
  height: 220px;
  border: 1.5px dashed rgba(100, 116, 139, 0.45);
  transform: rotateX(72deg) rotateY(-18deg);
  animation: spin-orbit-1 16s linear infinite;
}

.orbit-ring-2 {
  width: 260px;
  height: 260px;
  border: 1.5px solid rgba(71, 85, 105, 0.35);
  transform: rotateX(65deg) rotateY(32deg);
  animation: spin-orbit-2 22s linear infinite reverse;
}

.orbit-ring-3 {
  width: 290px;
  height: 290px;
  border: 1px dotted rgba(51, 65, 85, 0.3);
  transform: rotateX(80deg) rotateZ(12deg);
  animation: spin-orbit-3 28s linear infinite;
}

.orbit-satellite-dot {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.dot-1 {
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  box-shadow: 0 0 10px #ffffff;
}

.dot-2 {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  box-shadow: 0 0 8px #cbd5e1;
}

@keyframes spin-orbit-1 {
  from {
    transform: rotateX(72deg) rotateY(-18deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(72deg) rotateY(-18deg) rotateZ(360deg);
  }
}

@keyframes spin-orbit-2 {
  from {
    transform: rotateX(65deg) rotateY(32deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(65deg) rotateY(32deg) rotateZ(360deg);
  }
}

@keyframes spin-orbit-3 {
  from {
    transform: rotateX(80deg) rotateZ(12deg) rotate(0deg);
  }
  to {
    transform: rotateX(80deg) rotateZ(12deg) rotate(360deg);
  }
}
</style>
