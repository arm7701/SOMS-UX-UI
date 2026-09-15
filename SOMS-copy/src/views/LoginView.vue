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
  Orbit,
  FastForward,
  AlertTriangle,
  ShieldCheck,
  Radio,
  LockKeyhole
} from 'lucide-vue-next'

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

// ข้อมูล HUD ทางยุทธการสำหรับติดตามดาวเทียม
const hudReticle = ref({
  visible: false,
  x: 0,
  y: 0,
  assetCode: 'DEFENSE SATELLITE ASSET',
  status: 'ORBITAL PASS LOCKED',
  linkMode: 'ENCRYPTED CARRIER'
})

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
// Three.js 3D WebGL Engine (Tactical Space Scene)
// ============================================================================
const canvasRef = ref(null)
let animId = null
let renderer = null
let scene = null
let camera = null
let earthMesh = null
let earthAtmosphere = null
let satGroup = null
let flightCurve = null
let starsPoints = null
let trailPoints = null
let trailGeo = null
let ionParticles = []
let portLedMat = null
let stbdLedMat = null

let transitionStartTime = 0
const TRANSITION_DURATION = 4600 // 4.6 วินาที นุ่มนวล พอดีสายตา ไม่นานเกินไป

// ฟังก์ชันเริ่มแอนิเมชันเปลี่ยนผ่าน
const startCinematicSequence = () => {
  isTransitioning.value = true
  transitionStartTime = performance.now()

  // เตรียมอนุภาคไอพ่นพลาสมาให้เริ่มที่ตัวดาวเทียมทันที
  if (satGroup && trailGeo) {
    satGroup.visible = true
    if (trailPoints) trailPoints.visible = true
    const nozzleWorld = new THREE.Vector3(0, 0, -8.3)
    satGroup.localToWorld(nozzleWorld)
    for (let i = 0; i < ionParticles.length; i++) {
      ionParticles[i].x = nozzleWorld.x
      ionParticles[i].y = nozzleWorld.y
      ionParticles[i].z = nozzleWorld.z
      ionParticles[i].life = Math.random()
    }
  }
}

// ฟังก์ชันสร้าง Texture ทวีปและไฟเมืองกลางคืนบนโลกแบบ Procedural High-Res
function createEarthCanvasTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // มหาสมุทรสีดำออบซิเดียนลึก
  ctx.fillStyle = '#060912'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // วาดโครงร่างทวีปจำลองแบบยุทธการ (Tactical Continents)
  ctx.fillStyle = '#0c1322'
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1.5

  // 1. ทวีปเอเชีย & ยุโรป (Eurasia)
  ctx.beginPath()
  ctx.ellipse(1350, 360, 480, 240, -0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 2. เอเชียตะวันออกเฉียงใต้ & ออสเตรเลีย
  ctx.beginPath()
  ctx.ellipse(1550, 680, 240, 160, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 3. ทวีปแอฟริกา
  ctx.beginPath()
  ctx.ellipse(1080, 520, 210, 280, 0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 4. ทวีปอเมริกาเหนือ
  ctx.beginPath()
  ctx.ellipse(450, 340, 320, 200, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 5. ทวีปอเมริกาใต้
  ctx.beginPath()
  ctx.ellipse(620, 650, 180, 260, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // จุดแสงไฟเมืองหลวงสำคัญ (Fiber-Optic Micro Cities)
  const cityDots = [
    // ประเทศไทยและอินโดจีน (Bangkok, Hanoi, Singapore, Jakarta)
    { x: 1480, y: 480, r: 2.4, col: '#fef08a' },
    { x: 1475, y: 485, r: 1.8, col: '#fde047' },
    { x: 1500, y: 450, r: 1.8, col: '#fef08a' },
    { x: 1495, y: 550, r: 2.6, col: '#ffffff' }, // Singapore
    { x: 1520, y: 620, r: 2.0, col: '#fde047' }, // Jakarta
    // เอเชียตะวันออก (Tokyo, Osaka, Shanghai, Beijing, Seoul)
    { x: 1720, y: 380, r: 2.8, col: '#ffffff' }, // Tokyo
    { x: 1705, y: 390, r: 2.0, col: '#fef08a' }, // Osaka
    { x: 1610, y: 410, r: 2.5, col: '#ffffff' }, // Shanghai
    { x: 1580, y: 340, r: 2.2, col: '#fef08a' }, // Beijing
    { x: 1650, y: 360, r: 2.0, col: '#fef08a' }, // Seoul
    // ยุโรปและตะวันออกกลาง
    { x: 1330, y: 450, r: 2.4, col: '#fde047' }, // Mumbai
    { x: 1210, y: 430, r: 2.2, col: '#fef08a' }, // Gulf
    { x: 1040, y: 280, r: 2.6, col: '#ffffff' }, // London/Paris
    { x: 1080, y: 300, r: 2.2, col: '#fef08a' }  // Central Europe
  ]

  cityDots.forEach(dot => {
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
    ctx.fillStyle = dot.col
    ctx.shadowColor = dot.col
    ctx.shadowBlur = 6
    ctx.fill()

    // แสงเรืองรอบเมือง
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.r * 2.8, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(253, 224, 71, 0.15)'
    ctx.shadowBlur = 0
    ctx.fill()
  })

  // กระจายจุดไฟเมืองไมโครทั่วโลกตามแนวชายฝั่ง
  for (let i = 0; i < 750; i++) {
    const x = Math.random() * canvas.width
    const y = 180 + Math.random() * 680
    ctx.beginPath()
    ctx.arc(x, y, Math.random() * 1.2 + 0.6, 0, Math.PI * 2)
    ctx.fillStyle = Math.random() > 0.6 ? '#fef08a' : 'rgba(255, 255, 255, 0.85)'
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

// ฟังก์ชันสร้าง Texture ละอองทรงกลมเรืองแสงนุ่มนวลสำหรับไอพ่นพลาสมา (ป้องกันบั๊กสี่เหลี่ยม)
function createIonGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
  grad.addColorStop(0.25, 'rgba(56, 189, 248, 0.85)')
  grad.addColorStop(0.55, 'rgba(14, 165, 233, 0.35)')
  grad.addColorStop(1, 'rgba(2, 132, 199, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  let w = window.innerWidth
  let h = window.innerHeight

  // 1. Scene & Camera Setup
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x060911, 0.0014)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000)
  camera.position.set(0, 10, 62)
  camera.lookAt(0, 0, 0)

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
  const ambientLight = new THREE.AmbientLight(0x1e293b, 1.3)
  scene.add(ambientLight)

  // แสงหลักสะท้อนตัวถังและปีกโซลาร์เซลล์
  const frontKeyLight = new THREE.DirectionalLight(0xffffff, 2.8)
  frontKeyLight.position.set(50, 45, 45)
  scene.add(frontKeyLight)

  // แสงอาทิตย์ไกลสะท้อนขอบฟ้าอวกาศ
  const sunLight = new THREE.DirectionalLight(0xe0f2fe, 2.0)
  sunLight.position.set(110, 25, -60)
  scene.add(sunLight)

  // แสงสะท้อนสีฟ้าไททาเนียมจากชั้นบรรยากาศโลก
  const earthBounceLight = new THREE.DirectionalLight(0x38bdf8, 0.6)
  earthBounceLight.position.set(-40, -30, 20)
  scene.add(earthBounceLight)

  // 4. Starfield (ดวงดาวอวกาศลึก 3,800 ดวง)
  const starGeo = new THREE.BufferGeometry()
  const starCount = 3800
  const starPos = new Float32Array(starCount * 3)
  const starColors = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount; i++) {
    const idx = i * 3
    const radius = 320 + Math.random() * 650
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)

    starPos[idx] = radius * Math.sin(phi) * Math.cos(theta)
    starPos[idx + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starPos[idx + 2] = radius * Math.cos(phi)

    const colRand = Math.random()
    if (colRand > 0.85) {
      starColors[idx] = 0.88; starColors[idx + 1] = 0.94; starColors[idx + 2] = 1.0
    } else if (colRand > 0.7) {
      starColors[idx] = 1.0; starColors[idx + 1] = 0.95; starColors[idx + 2] = 0.82
    } else {
      starColors[idx] = 0.96; starColors[idx + 1] = 0.96; starColors[idx + 2] = 0.98
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

  const starMat = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    sizeAttenuation: true
  })
  starsPoints = new THREE.Points(starGeo, starMat)
  scene.add(starsPoints)

  // 5. Tactical Dark Earth (ทรงกลมโลก 3D พื้นผิวมหาสมุทร ทวีป และไฟเมือง)
  const earthRadius = 120
  const earthCenter = new THREE.Vector3(0, -110, -30)

  const earthTexture = createEarthCanvasTexture()
  const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64)
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.88,
    metalness: 0.16
  })
  earthMesh = new THREE.Mesh(earthGeo, earthMat)
  earthMesh.position.copy(earthCenter)
  earthMesh.rotation.x = 0.24
  earthMesh.rotation.z = -0.15
  earthMesh.rotation.y = 2.1
  scene.add(earthMesh)

  // วงโครงข่ายพิกัดละติจูดทางยุทธการ
  const tacticalGridGroup = new THREE.Group()
  for (let lat = -50; lat <= 50; lat += 20) {
    const rad = (lat * Math.PI) / 180
    const ringR = earthRadius * Math.cos(rad) * 1.002
    const ringY = earthRadius * Math.sin(rad)
    const ringGeo = new THREE.RingGeometry(ringR - 0.18, ringR + 0.18, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = ringY
    tacticalGridGroup.add(ring)
  }
  earthMesh.add(tacticalGridGroup)

  // ขอบชั้นบรรยากาศสีฟ้าแซฟไฟร์เรืองแสงนุ่มนวล (Sapphire Atmospheric Rim Glow Shader)
  const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.025, 64, 64)
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
        // Fresnel Rim falloff ปลอดภัยต่อ GPU ไม่เกิดค่าลบหรือ NaN
        float fresnel = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        float intensity = pow(fresnel, 2.6);
        gl_FragColor = vec4(0.22, 0.74, 0.97, 1.0) * intensity * 0.85;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
  earthAtmosphere = new THREE.Mesh(atmoGeo, atmoMat)
  earthAtmosphere.position.copy(earthCenter)
  scene.add(earthAtmosphere)

  // 6. Stealth Titanium Satellite Model (NAPA-2 Reconnaissance Craft)
  satGroup = new THREE.Group()

  // 6.1 ตัวถังไททาเนียมทรงลูกบาศก์ทหาร
  const bodyGeo = new THREE.BoxGeometry(4.4, 4.4, 10.2)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x242e40,
    metalness: 0.88,
    roughness: 0.24
  })
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  satGroup.add(bodyMesh)

  // 6.2 แผ่นกันความร้อนแคปตันสีบรอนซ์ทองเข้ม
  const foilGeo = new THREE.BoxGeometry(4.5, 4.5, 5.6)
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.85,
    roughness: 0.28
  })
  const foilMesh = new THREE.Mesh(foilGeo, foilMat)
  satGroup.add(foilMesh)

  // 6.3 เลนส์กล้องสำรวจภาคพื้นดินกระจกแซฟไฟร์
  const lensBarrelGeo = new THREE.CylinderGeometry(1.3, 1.45, 1.8, 32)
  const lensBarrelMat = new THREE.MeshStandardMaterial({
    color: 0x0b111e,
    metalness: 0.92,
    roughness: 0.16
  })
  const lensBarrel = new THREE.Mesh(lensBarrelGeo, lensBarrelMat)
  lensBarrel.rotation.x = Math.PI / 2
  lensBarrel.position.set(0, -2.4, 1.6)
  satGroup.add(lensBarrel)

  const lensGlassGeo = new THREE.CircleGeometry(1.2, 32)
  const lensGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.98,
    roughness: 0.04
  })
  const lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMat)
  lensGlass.rotation.x = Math.PI / 2
  lensGlass.position.set(0, -2.4, 2.51)
  satGroup.add(lensGlass)

  // จานสายอากาศรับสัญญาณภาคพื้นดิน (High-Gain Earth Communications Dish)
  const dishGeo = new THREE.SphereGeometry(1.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  const dishMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide })
  const dishMesh = new THREE.Mesh(dishGeo, dishMat)
  dishMesh.position.set(0, -2.5, -2.0)
  dishMesh.rotation.x = Math.PI
  satGroup.add(dishMesh)

  // 6.4 ปีกแผงโซลาร์เซลล์สีดำซิลิคอนอวกาศ
  const wingArmGeo = new THREE.BoxGeometry(1.6, 0.3, 0.5)
  const wingArmMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 })

  const wingPanelGeo = new THREE.BoxGeometry(12.0, 0.22, 5.8)
  const wingPanelMat = new THREE.MeshStandardMaterial({
    color: 0x090e17,
    metalness: 0.70,
    roughness: 0.16
  })

  // ปีกกราบซ้าย
  const portArm = new THREE.Mesh(wingArmGeo, wingArmMat)
  portArm.position.set(-3.0, 0, 0)
  satGroup.add(portArm)

  const portWing = new THREE.Mesh(wingPanelGeo, wingPanelMat)
  portWing.position.set(-9.4, 0, 0)
  satGroup.add(portWing)

  const gridLineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 })
  const portGridGeo = new THREE.BufferGeometry()
  const portGridPts = []
  for (let x = -14.8; x <= -4.0; x += 2.2) {
    portGridPts.push(new THREE.Vector3(x, 0.15, -2.7), new THREE.Vector3(x, 0.15, 2.7))
  }
  portGridGeo.setFromPoints(portGridPts)
  const portGrid = new THREE.LineSegments(portGridGeo, gridLineMat)
  satGroup.add(portGrid)

  // ปีกกราบขวา
  const stbdArm = new THREE.Mesh(wingArmGeo, wingArmMat)
  stbdArm.position.set(3.0, 0, 0)
  satGroup.add(stbdArm)

  const stbdWing = new THREE.Mesh(wingPanelGeo, wingPanelMat)
  stbdWing.position.set(9.4, 0, 0)
  satGroup.add(stbdWing)

  const stbdGridGeo = new THREE.BufferGeometry()
  const stbdGridPts = []
  for (let x = 4.0; x <= 14.8; x += 2.2) {
    stbdGridPts.push(new THREE.Vector3(x, 0.15, -2.7), new THREE.Vector3(x, 0.15, 2.7))
  }
  stbdGridGeo.setFromPoints(stbdGridPts)
  const stbdGrid = new THREE.LineSegments(stbdGridGeo, gridLineMat)
  satGroup.add(stbdGrid)

  // 6.5 เสาอากาศแส้ UHF/VHF
  const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 6.8, 8)
  const antMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.15 })

  const ant1 = new THREE.Mesh(antGeo, antMat)
  ant1.position.set(-1.8, 1.8, 5.2)
  ant1.rotation.x = -Math.PI / 4
  ant1.rotation.z = -Math.PI / 6
  satGroup.add(ant1)

  const ant2 = new THREE.Mesh(antGeo, antMat)
  ant2.position.set(1.8, 1.8, 5.2)
  ant2.rotation.x = -Math.PI / 4
  ant2.rotation.z = Math.PI / 6
  satGroup.add(ant2)

  // 6.6 ไฟนำร่องและไฟกะพริบนาวิเกชันระดับทหาร
  const ledGeo = new THREE.SphereGeometry(0.28, 16, 16)
  portLedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e })
  const portLed = new THREE.Mesh(ledGeo, portLedMat)
  portLed.position.set(-15.4, 0, 0)
  satGroup.add(portLed)

  stbdLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 })
  const stbdLed = new THREE.Mesh(ledGeo, stbdLedMat)
  stbdLed.position.set(15.4, 0, 0)
  satGroup.add(stbdLed)

  // 6.7 หัวฉีดและเปลวไอพ่นพลาสมา (Ion Thruster)
  const nozzleGeo = new THREE.CylinderGeometry(0.5, 0.8, 1.2, 16)
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.22 })
  const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat)
  nozzle.position.set(0, 0, -5.6)
  satGroup.add(nozzle)

  // เปลวไอพ่นพลาสมาหลัก
  const plumeGeo = new THREE.ConeGeometry(0.7, 5.2, 16, 1, true)
  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  })
  const thrusterPlume = new THREE.Mesh(plumeGeo, plumeMat)
  thrusterPlume.rotation.x = Math.PI / 2
  thrusterPlume.position.set(0, 0, -8.3)
  satGroup.add(thrusterPlume)

  // 6.8 ละอองอนุภาคไอพ่นพลาสมาท้ายเครื่องแบบกลมเรืองแสงนุ่มนวล (Soft Circular Ion Exhaust Embers)
  const trailCount = 40
  trailGeo = new THREE.BufferGeometry()
  const trailPositions = new Float32Array(trailCount * 3)

  for (let i = 0; i < trailCount; i++) {
    ionParticles.push({
      x: 0,
      y: 0,
      z: 0,
      life: Math.random(),
      speed: 0.02 + Math.random() * 0.025,
      spreadX: (Math.random() - 0.5) * 0.8,
      spreadY: (Math.random() - 0.5) * 0.8,
      spreadZ: (Math.random() - 0.5) * 0.8
    })
  }

  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
  const ionTexture = createIonGlowTexture()
  const trailMat = new THREE.PointsMaterial({
    size: 3.2,
    map: ionTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
  trailPoints = new THREE.Points(trailGeo, trailMat)
  trailPoints.visible = false
  scene.add(trailPoints)

  satGroup.position.set(-42, 28, 80)
  satGroup.scale.set(0.9, 0.9, 0.9)
  satGroup.visible = false
  scene.add(satGroup)

  // =============================================================
  // 7. เส้นวิถีวงโคจร 3 มิติ โคจรรอบโลกแท้จริง (Keplerian Orbit Flyby & Arc)
  // 1. เริ่มต้นโฉบเฉี่ยวผ่านหน้ากล้องระยะประชิด (Close-up Dramatic Flyby)
  // 2. แล้วตีวงเลี้ยวโคจรรอบโลกเลียบแนวขอบฟ้า (Orbit Around Earth Horizon)
  // =============================================================
  flightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-42, 28, 80),   // จุดเริ่มต้น: ลอยลงมาจากอวกาศลึกด้านหน้า-ซ้าย
    new THREE.Vector3(-12, 14, 38),   // โฉบผ่านหน้ากล้องระยะประชิด ชัดเจน สวยงาม (Dramatic Close-up Pass)
    new THREE.Vector3(12, 12, 5),     // พุ่งผ่านหน้ากล้อง เริ่มตีวงเลี้ยวขวาเข้าสู่ระนาบวงโคจร
    new THREE.Vector3(38, 11, -25),   // โคจรเลียบแนวขอบฟ้าโลกอันโค้งมนสง่างาม
    new THREE.Vector3(68, 8, -65),    // โคจรรอบโลกตามแนวเส้นรอบวงชั้นบรรยากาศ
    new THREE.Vector3(105, 4, -120)   // ลอยมุ่งหน้าสู่อรุณอวกาศไกลลิบอย่างนุ่มนวล
  ])

  // เส้นประวงโคจรเรืองแสงสีสเลท
  const pathPoints = flightCurve.getPoints(100)
  const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints)
  const pathMat = new THREE.LineDashedMaterial({
    color: 0x64748b,
    dashSize: 3.5,
    gapSize: 4.5,
    transparent: true,
    opacity: 0.35
  })
  const pathLine = new THREE.Line(pathGeo, pathMat)
  pathLine.computeLineDistances()
  scene.add(pathLine)

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

  // 8. Render & Animation Loop
  const baseCamPos = new THREE.Vector3(0, 10, 62)
  const currentCamPos = baseCamPos.clone()
  const currentLookAt = new THREE.Vector3(0, 0, 0)

  const clock = new THREE.Clock()

  const renderLoop = () => {
    const delta = clock.getDelta()
    const now = performance.now()

    // โลกและดาวหมุนช้าๆ ตลอดเวลา
    if (earthMesh) {
      earthMesh.rotation.y += delta * 0.016
    }
    if (starsPoints) {
      starsPoints.rotation.y += delta * 0.003
    }

    // กะพริบไฟนำร่องนาวิเกชันสีเขียว-แดง
    if (portLedMat && stbdLedMat) {
      const strobe = (Math.sin(now * 0.007) > 0) ? 1.0 : 0.25
      portLedMat.opacity = strobe
      stbdLedMat.opacity = strobe
    }

    if (!isTransitioning.value) {
      // โหมดปกติก่อนล็อกอิน: ลอยนิ่งๆ สบายตา สไตล์ Aerospace Command
      const time = now * 0.0005
      camera.position.x = Math.sin(time) * 2.0
      camera.position.y = 10 + Math.cos(time * 0.7) * 1.2
      camera.position.z = 62
      camera.lookAt(0, 0, 0)
    } else {
      // โหมดภาพยนตร์เปลี่ยนผ่าน: ดาวเทียมโฉบผ่านกล้องแล้วไปโคจรรอบโลก
      satGroup.visible = true
      if (trailPoints) trailPoints.visible = true

      const elapsed = now - transitionStartTime
      const rawProgress = Math.min(1, Math.max(0, elapsed / TRANSITION_DURATION))
      transitionProgress.value = rawProgress

      // Easing Function: Easing Cubic เพื่อความนุ่มนวล สมูท ละมุนสายตา
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const p = easeInOutCubic(rawProgress)

      // พิกัดดาวเทียมบนเส้นทางบิน 3 มิติ
      const satPos = flightCurve.getPointAt(p)
      satGroup.position.copy(satPos)

      // ทิศทางการบิน (Flight Vector Tangent)
      const tangent = flightCurve.getTangentAt(p).normalize()
      const forwardTarget = satPos.clone().add(tangent)
      satGroup.lookAt(forwardTarget)

      // เอียงปีกตามแรงเหวี่ยงโคจรรอบโลก (Banking & Roll)
      satGroup.rotateZ(Math.sin(p * Math.PI) * 0.38)

      // กะพริบของไอพ่นพลาสมา
      if (thrusterPlume) {
        const flicker = 0.85 + Math.random() * 0.3
        thrusterPlume.scale.set(flicker, 1.0 + Math.random() * 0.35, flicker)
      }

      // อัปเดตละอองอนุภาคไอพ่นพลาสมา (Ion Exhaust Particles) ให้พุ่งออกจากท้ายเครื่อง
      if (trailGeo) {
        const pPositions = trailGeo.attributes.position.array
        const nozzleOffset = new THREE.Vector3(0, 0, -8.3)
        const nozzleWorld = nozzleOffset.clone().applyMatrix4(satGroup.matrixWorld)

        for (let i = 0; i < trailCount; i++) {
          const part = ionParticles[i]
          part.life += part.speed
          if (part.life >= 1.0) {
            part.life = 0
            part.x = nozzleWorld.x + (Math.random() - 0.5) * 0.35
            part.y = nozzleWorld.y + (Math.random() - 0.5) * 0.35
            part.z = nozzleWorld.z + (Math.random() - 0.5) * 0.35
            part.spreadX = (Math.random() - 0.5) * 0.6
            part.spreadY = (Math.random() - 0.5) * 0.6
            part.spreadZ = (Math.random() - 0.5) * 0.6
          }
          const i3 = i * 3
          const dist = part.life * 13.0
          pPositions[i3] = part.x - tangent.x * dist + part.spreadX * part.life * 1.8
          pPositions[i3 + 1] = part.y - tangent.y * dist + part.spreadY * part.life * 1.8
          pPositions[i3 + 2] = part.z - tangent.z * dist + part.spreadZ * part.life * 1.8
        }
        trailGeo.attributes.position.needsUpdate = true
      }

      // ปรับขนาดดาวเทียมตามมิติความลึก (Perspective Scale)
      const distScale = 0.85 + (1 - p) * 0.3
      satGroup.scale.set(distScale, distScale, distScale)

      // -------------------------------------------------------------
      // มุมกล้องมองตามดาวเทียมไป (Dynamic Cinematic Camera Pursuit)
      // เมื่อดาวเทียมผ่านกล้องไปแล้ว กล้องจะแพนหันตามและซูมมองตามดาวเทียมไปโคจรรอบโลก
      // -------------------------------------------------------------
      const targetCamPos = new THREE.Vector3(
        baseCamPos.x + (satPos.x * 0.28),
        baseCamPos.y + (satPos.y - 10) * 0.22,
        baseCamPos.z - (p * 26)
      )
      currentCamPos.lerp(targetCamPos, 0.065)
      camera.position.copy(currentCamPos)

      // จุดเล็งกล้อง (Look-At Target) หันตามดาวเทียมแบบสมูท
      const targetLookAt = new THREE.Vector3(
        satPos.x * 0.88,
        satPos.y * 0.84,
        satPos.z * 0.78
      )
      currentLookAt.lerp(targetLookAt, 0.075)
      camera.lookAt(currentLookAt)

      // -------------------------------------------------------------
      // พิกัด 2D บนจอสำหรับ HUD Reticle Target Lock
      // -------------------------------------------------------------
      const projected = satPos.clone().project(camera)
      const screenX = ((projected.x + 1) * w) / 2
      const screenY = ((-projected.y + 1) * h) / 2

      // แสดง HUD ในช่วงที่ดาวเทียมเริ่มเข้าสู่วงโคจร
      if (rawProgress > 0.15 && rawProgress < 0.92) {
        hudReticle.value.visible = true
        hudReticle.value.x = screenX
        hudReticle.value.y = screenY
      } else {
        hudReticle.value.visible = false
      }

      // ม่านดำส่งผ่านเข้าสู่ Dashboard
      if (rawProgress > 0.86) {
        curtainOpacity.value = (rawProgress - 0.86) / 0.14
      }

      // จบการเปลี่ยนผ่านเข้าสู่หน้าหลัก
      if (rawProgress >= 1.0 && !skipRequested.value) {
        skipRequested.value = true
        appStore.showToast(
          'เชื่อมต่อระบบวงโคจรสำเร็จ',
          'เข้าสู่ระบบ SOIS เข้าสู่คอนโซลปฏิบัติการ'
        )
        router.push(destinationPath)
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
  <div class="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-[#060911] text-slate-100 font-prompt select-none">
    <!-- 1. Deep Space 3D WebGL Canvas (Tactical Earth & 3D Satellite) -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>

    <!-- 2. Subtle Dark Titanium Nebulae (โทนดำเทาไททาเนียม ไม่แสบตา) -->
    <div
      class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-slate-700/10 blur-[150px] pointer-events-none transition-opacity duration-1000"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>
    <div
      class="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-zinc-700/10 blur-[160px] pointer-events-none transition-opacity duration-1000"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>

    <!-- 3. Tactical Coordinate Grid & Telemetry Lines -->
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,#3341550c_1px,transparent_1px),linear-gradient(to_bottom,#3341550c_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none transition-opacity duration-700"
      :class="isTransitioning ? 'opacity-20' : 'opacity-100'"
    ></div>

    <!-- ===================================================================== -->
    <!-- 4. MAIN SPLIT COMMAND LAYOUT (จัดวางแยกส่วนซ้าย-ขวาอย่างสง่างาม ไม่ซ้อนทับ ไม่ลายตา) -->
    <!-- ===================================================================== -->
    <div
      class="relative z-20 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-700 ease-out"
      :class="isTransitioning ? 'opacity-0 scale-95 blur-md pointer-events-none' : 'opacity-100 scale-100 blur-0'"
    >
      <!-- ฝั่งซ้าย (Hero Emblem & Authority Branding) -->
      <div class="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
        <!-- Centerpiece Logo with 3D Orbit Rings -->
        <div class="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center cursor-pointer" @dblclick="autofillDev" title="Double-click for testing">
          <!-- 3D Orbit Rings -->
          <div class="orbit-ring-3d orbit-ring-1">
            <div class="orbit-satellite-dot dot-1"></div>
          </div>
          <div class="orbit-ring-3d orbit-ring-2">
            <div class="orbit-satellite-dot dot-2"></div>
          </div>
          <div class="orbit-ring-3d orbit-ring-3"></div>

          <!-- ISR Official Crest -->
          <div class="relative z-10 logo-float-container">
            <img
              src="/src/assets/png-isr.png"
              alt="ISR Emblem"
              class="w-36 sm:w-44 h-auto object-contain filter drop-shadow-[0_0_25px_rgba(148,163,184,0.35)] brightness-110"
            />
          </div>
        </div>

        <!-- Typography & Credentials Notice -->
        <div class="space-y-2 max-w-lg">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101726]/90 border border-slate-600/80 text-slate-200 text-xs font-semibold tracking-wider uppercase shadow-md">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
            <span>RESTRICTED ACCESS // LEVEL 4 AUTHORIZATION</span>
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-wide font-prompt leading-tight">
            Satellite Operations
          </h1>
          <p class="text-base sm:text-lg uppercase tracking-[0.16em] text-slate-300 font-bold font-prompt">
            Information System (SOIS)
          </p>
          <p class="text-sm text-slate-300 font-prompt pt-1">
            ศูนย์ปฏิบัติการทางอวกาศ กองทัพอากาศ · RTAF Space Operations Command
          </p>
        </div>

        <!-- Security Gateway Tags -->
        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-slate-300 font-mono">
          <span class="px-2.5 py-1 rounded-md bg-[#0f172a]/80 border border-slate-700 flex items-center gap-1.5">
            <Radio class="w-3 h-3 text-emerald-400" />
            <span>GATEWAY: ACTIVE</span>
          </span>
          <span class="px-2.5 py-1 rounded-md bg-[#0f172a]/80 border border-slate-700 flex items-center gap-1.5">
            <LockKeyhole class="w-3 h-3 text-slate-400" />
            <span>ENCRYPTED PROTOCOL</span>
          </span>
          <span class="px-2.5 py-1 rounded-md bg-[#0f172a]/80 border border-slate-700">
            SECURE DEFENSE NETWORK
          </span>
        </div>
      </div>

      <!-- ฝั่งขวา (Login Authorization Form Card) -->
      <div class="lg:col-span-5 flex justify-center lg:justify-end w-full">
        <div
          class="w-full max-w-[430px] transition-all duration-300"
          :class="isShaking ? 'animate-shake' : ''"
        >
          <div class="bg-[#0c121e]/96 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border-2 border-slate-700 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(15,23,42,0.6)]">
            <!-- Card Header -->
            <div class="mb-6 text-left">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                <span class="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">SYSTEM ACCESS GATE</span>
              </div>
              <h2 class="text-2xl font-bold font-prompt text-white tracking-wide">
                เข้าสู่ระบบปฏิบัติการ
              </h2>
              <p class="text-xs text-slate-300 mt-1 font-prompt">
                กรุณาระบุข้อมูลประจำตัวที่ได้รับอนุญาตเพื่อเข้าสู่ระบบ
              </p>
            </div>

            <!-- Error Message Box -->
            <div
              v-if="errorMessage"
              class="mb-5 p-3.5 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-100 text-xs sm:text-sm font-semibold flex items-center gap-2.5 font-prompt shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <AlertTriangle class="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Login Form -->
            <form class="space-y-4" @submit.prevent="handleLogin">
              <!-- Username Input -->
              <div>
                <label for="username" class="block text-sm font-bold text-white mb-1.5 font-prompt tracking-wide">
                  Username <span class="text-slate-200 font-medium">(ชื่อผู้ใช้งาน)</span>
                </label>
                <div class="relative">
                  <User class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    id="username"
                    v-model="username"
                    type="text"
                    required
                    autocomplete="username"
                    placeholder="ระบุชื่อผู้ใช้งาน (Username)"
                    class="w-full pl-11 pr-4 py-3.5 text-base font-semibold rounded-xl border-2 border-slate-600 bg-[#090e18] text-white placeholder:text-slate-400 font-prompt focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/30 transition-all shadow-inner"
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div>
                <label for="password" class="block text-sm font-bold text-white mb-1.5 font-prompt tracking-wide">
                  Password <span class="text-slate-200 font-medium">(รหัสผ่าน)</span>
                </label>
                <div class="relative">
                  <Lock class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="ระบุรหัสผ่านเข้าสู่ระบบ"
                    class="w-full pl-11 pr-11 py-3.5 text-base font-semibold rounded-xl border-2 border-slate-600 bg-[#090e18] text-white placeholder:text-slate-400 font-prompt focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/30 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors p-1.5 cursor-pointer"
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
                <label class="flex items-center gap-2.5 cursor-pointer text-slate-100 hover:text-white transition-colors font-prompt font-medium">
                  <input
                    v-model="rememberMe"
                    type="checkbox"
                    class="rounded border-2 border-slate-500 bg-[#090e18] text-slate-400 focus:ring-slate-400/20 w-4 h-4 cursor-pointer"
                  />
                  <span>จดจำการเข้าสู่ระบบ</span>
                </label>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="loading || isTransitioning"
                class="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-zinc-700 hover:from-slate-600 hover:to-zinc-600 active:scale-[0.99] disabled:opacity-50 text-white text-base font-bold shadow-xl shadow-black/80 border-2 border-slate-400/60 transition-all flex items-center justify-center gap-2.5 mt-4 font-prompt tracking-wider cursor-pointer"
              >
                <LogIn class="w-4 h-4 text-white" :class="loading ? 'animate-pulse' : ''" />
                <span>{{ loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ (Sign In)' }}</span>
              </button>
            </form>

            <!-- Card Footer Notice -->
            <div class="mt-6 pt-4 border-t border-slate-700/80 text-center text-xs font-prompt">
              <p class="text-slate-200 font-medium leading-relaxed">
                ระบบสารสนเทศความมั่นคงทางอวกาศ · สงวนสิทธิ์สำหรับเจ้าหน้าที่เวรปฏิบัติการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 5. TACTICAL HUD SATELLITE TRACKING RETICLE (เป้าเล็งและข้อมูลโทรมาตรล็อกติดดาวเทียม 3D) -->
    <!-- ===================================================================== -->
    <div
      v-if="isTransitioning && hudReticle.visible"
      class="fixed pointer-events-none z-30 transition-all duration-75"
      :style="{
        left: `${hudReticle.x}px`,
        top: `${hudReticle.y}px`,
        transform: 'translate(-50%, -50%)'
      }"
    >
      <!-- Tactical Target Lock Brackets -->
      <div class="relative w-28 h-28 flex items-center justify-center">
        <span class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.4)]"></span>
        <span class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.4)]"></span>
        <span class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.4)]"></span>
        <span class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-300 shadow-[0_0_6px_rgba(203,213,225,0.4)]"></span>

        <!-- Center Crosshair & Rotating Ring -->
        <div class="w-16 h-16 rounded-full border border-slate-500/50 border-dashed animate-spin" style="animation-duration: 10s;"></div>
        <div class="w-2 h-2 rounded-full bg-slate-200 shadow-[0_0_8px_#ffffff] animate-ping"></div>

        <!-- Leader Line & Telemetry Data Card (ปลอดภัย ไม่เปิดเผยข้อมูลลับ) -->
        <div class="absolute left-full top-1/2 -translate-y-1/2 ml-4 flex items-center">
          <div class="w-6 h-px bg-slate-400"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          <div class="ml-2.5 px-3.5 py-2.5 rounded-xl bg-[#0c121e]/95 backdrop-blur-md border border-slate-700 shadow-2xl min-w-[210px] text-xs font-mono">
            <div class="flex items-center justify-between gap-2 pb-1 border-b border-slate-700">
              <span class="text-slate-200 font-bold font-prompt text-[11px] flex items-center gap-1">
                <Orbit class="w-3.5 h-3.5 text-slate-300 animate-spin" style="animation-duration: 4s;" />
                <span>{{ hudReticle.assetCode }}</span>
              </span>
              <span class="text-emerald-400 text-[10px] font-bold">LOCKED</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-2 text-[11px]">
              <div>
                <span class="text-slate-400 text-[9px] block">TRAJECTORY</span>
                <span class="text-white font-bold">ORBITAL PASS</span>
              </div>
              <div>
                <span class="text-slate-400 text-[9px] block">CHANNEL</span>
                <span class="text-slate-200 font-bold">SECURE LINK</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 6. TOP AUTHORIZATION BANNER (แถบแจ้งสถานะยืนยันตัวตน - ปลอดภัย ไม่เปิดเผยชื่อลับ) -->
    <!-- ===================================================================== -->
    <div
      v-if="isTransitioning"
      class="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-2xl bg-[#0c121e]/95 backdrop-blur-md border border-slate-700 shadow-2xl flex items-center gap-3 font-prompt animate-pulse"
    >
      <div class="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
      <div class="text-left">
        <span class="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
          AUTHENTICATION SUCCESSFUL // ACCESS GRANTED
        </span>
        <span class="text-[11px] text-slate-200 font-medium block">
          กำลังสร้างการเชื่อมต่อเข้ารหัส... กำลังนำทางเข้าสู่คอนโซลปฏิบัติการ
        </span>
      </div>
    </div>

    <!-- 7. SKIP INTRO BUTTON -->
    <div
      v-if="isTransitioning"
      class="fixed bottom-6 right-6 z-30 flex items-center gap-3"
    >
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c121e]/90 hover:bg-[#1e293b] text-slate-200 hover:text-white border border-slate-700 text-xs font-bold font-prompt backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer"
        @click="skipTransition"
      >
        <span>ข้ามแอนิเมชัน (Skip Intro)</span>
        <FastForward class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- 8. CINEMATIC BLACKOUT / SYSTEM REVEAL CURTAIN -->
    <div
      class="fixed inset-0 bg-[#060911] pointer-events-none z-50 transition-opacity duration-300"
      :style="{ opacity: curtainOpacity }"
    ></div>
  </div>
</template>

<style scoped>
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
