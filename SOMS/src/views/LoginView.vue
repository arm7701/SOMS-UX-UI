<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/LoginView.vue
 * วัตถุประสงค์: หน้าจอเข้าสู่ระบบ (Login Screen) ธีมอวกาศ (Cosmic Space Theme)
 * ฟีเจอร์:
 * - อนิเมชั่นอวกาศ Canvas 60FPS: ดวงดาวระยิบระยับ (Twinkling Stars), ฝนดาวตก (Shooting Meteors),
 *   เครือข่ายดาวเทียมในอวกาศ (Constellation Mesh), เมฆเนบิวลาเรืองแสง (Nebula Aurora Glow)
 * - โลโก้ตราสัญลักษณ์ ISR (SPACE ISR Shield) ขนาดพอดี สมส่วน ทั้งบนการ์ดและในบรรยากาศอวกาศ
 * - รองรับ Parallax ตอบสนองการเลื่อนเมาส์อย่างนุ่มนวล
 * ============================================================================
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { LogIn, Eye, EyeOff, User, Lock, Sparkles, Orbit, Globe } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')
const loading = ref(false)
const cardMinimized = ref(false)

const handleLogin = async () => {
  if (!username.value.trim()) {
    errorMessage.value = 'กรุณากรอก Username'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const result = await authStore.login(username.value.trim(), password.value)
    if (result.setupRequired) {
      router.push('/setup-password')
    } else {
      appStore.showToast('ยินดีต้อนรับ', `เข้าสู่ระบบสำเร็จในฐานะ ${authStore.displayName}`)
      router.push('/dashboard')
    }
  } catch (err) {
    errorMessage.value = err.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล'
  } finally {
    loading.value = false
  }
}

// ทางลัดสำหรับทดสอบระบบ (Dev Friendly)
const autofillDev = () => {
  username.value = 'developer'
  password.value = 'password1234'
}

// ============================================================================
// ระบบอนิเมชั่นอวกาศ (Interactive Space Canvas Engine)
// ============================================================================
const spaceCanvasRef = ref(null)
let animId = null
let stars = []
let meteors = []
let earthGlobe = null
let mouseX = 0
let mouseY = 0
let targetMouseX = 0
let targetMouseY = 0

class Star {
  constructor(w, h) {
    this.reset(w, h, true)
  }

  reset(w, h, randomY = false) {
    this.x = Math.random() * w
    this.y = randomY ? Math.random() * h : -10
    this.z = Math.random() * 0.8 + 0.2 // Depth factor (0.2 = distant, 1.0 = close)
    this.size = (Math.random() * 1.5 + 0.6) * this.z
    this.baseAlpha = Math.random() * 0.5 + 0.4
    this.alpha = this.baseAlpha
    this.twinkleSpeed = Math.random() * 0.03 + 0.012
    this.twinklePhase = Math.random() * Math.PI * 2
    this.vx = (Math.random() - 0.5) * 0.12 * this.z
    this.vy = (Math.random() * 0.18 + 0.04) * this.z

    const colors = ['#ffffff', '#bae6fd', '#7dd3fc', '#67e8f9', '#f0f9ff']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update(w, h, parallaxX, parallaxY) {
    this.x += this.vx + parallaxX * this.z * 0.018
    this.y += this.vy + parallaxY * this.z * 0.018
    this.twinklePhase += this.twinkleSpeed
    this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.35

    if (this.x < -20) this.x = w + 20
    if (this.x > w + 20) this.x = -20
    if (this.y > h + 20) this.reset(w, h, false)
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = Math.max(0.1, Math.min(1, this.alpha))
    ctx.fillStyle = this.color
    if (this.size > 1.2) {
      ctx.shadowBlur = 6
      ctx.shadowColor = this.color
    }
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

class Meteor {
  constructor(w, h) {
    this.reset(w, h)
  }

  reset(w, h) {
    this.x = Math.random() * (w * 0.9) + w * 0.1
    this.y = Math.random() * (h * 0.35) - 40
    this.length = Math.random() * 110 + 90
    this.speed = Math.random() * 8 + 10
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25 // ~45 deg diagonal
    this.vx = -Math.cos(this.angle) * this.speed
    this.vy = Math.sin(this.angle) * this.speed
    this.alpha = 1.0
    this.decay = Math.random() * 0.018 + 0.012
    this.active = true
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.alpha -= this.decay
    if (this.alpha <= 0) {
      this.active = false
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return
    ctx.save()
    const tailX = this.x - this.vx * (this.length / this.speed)
    const tailY = this.y - this.vy * (this.length / this.speed)

    const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y)
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)')
    grad.addColorStop(0.65, `rgba(56, 189, 248, ${this.alpha * 0.6})`)
    grad.addColorStop(1, `rgba(255, 255, 255, ${this.alpha})`)

    ctx.strokeStyle = grad
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(this.x, this.y)
    ctx.stroke()

    // Glowing head
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
    ctx.shadowBlur = 12
    ctx.shadowColor = '#38bdf8'
    ctx.beginPath()
    ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

// ============================================================================
// ข้อมูลภูมิศาสตร์และพิกัดทวีปสำหรับเรนเดอร์ลูกโลก 3 มิติ (Earth Globe Dataset)
// ============================================================================
const DEG2RAD = Math.PI / 180

// เวกเตอร์โครงร่างทวีปหลัก (Continental Outlines [lat, lon])
const CONTINENTS = [
  // ยูเรเชีย & เอเชีย & ยุโรป & ตะวันออกกลาง
  [
    [71, 28], [70, 60], [73, 80], [76, 105], [77, 135], [72, 145], [65, 170], [60, 163],
    [54, 156], [50, 143], [43, 132], [38, 128], [35, 129], [34, 120], [39, 118], [31, 122],
    [23, 117], [22, 114], [21, 108], [11, 109], [10, 104], [13, 100], [8, 100], [1, 104],
    [7, 99], [16, 96], [22, 91], [21, 87], [13, 80], [8, 77], [16, 73], [24, 69],
    [25, 62], [24, 57], [17, 54], [13, 45], [13, 43], [28, 34], [31, 35], [36, 36],
    [37, 28], [41, 28], [40, 23], [37, 22], [41, 14], [44, 12], [43, 4], [36, -5],
    [39, -9], [43, -9], [44, -1], [49, -2], [53, 5], [54, 9], [58, 11], [58, 16],
    [64, 21], [66, 24], [71, 28]
  ],
  // อินโดจีน & เอเชียตะวันออกเฉียงใต้ (ไทย, พม่า, ลาว, กัมพูชา, เวียดนาม, มาเลเซีย)
  [
    [22, 100], [21, 104], [21, 108], [18, 106], [16, 108], [12, 109], [10, 107], [10, 104],
    [13.7, 100.5], [11, 99], [6, 100], [2, 103], [1.3, 104], [4, 101], [8, 98], [14, 98],
    [16, 96], [20, 93], [22, 98], [22, 100]
  ],
  // เกาะอังกฤษ
  [
    [58, -3], [58, -5], [55, -5], [51, -5], [50, -1], [51, 1], [54, 0], [56, -2], [58, -3]
  ],
  // ประเทศญี่ปุ่น
  [
    [45, 142], [43, 145], [40, 140], [35, 140], [33, 135], [31, 131], [34, 131], [37, 137],
    [41, 141], [45, 142]
  ],
  // อินโดนีเซีย / สุมาตรา
  [
    [5, 95], [3, 98], [-1, 103], [-5, 106], [-6, 103], [-3, 100], [1, 98], [5, 95]
  ],
  // อินโดนีเซีย / ชวา
  [
    [-6, 106], [-7, 110], [-8, 114], [-8, 112], [-7, 107], [-6, 106]
  ],
  // บอร์เนียว
  [
    [7, 117], [5, 119], [1, 118], [-3, 116], [-4, 113], [-1, 110], [2, 110], [4, 114], [7, 117]
  ],
  // ฟิลิปปินส์
  [
    [18, 121], [16, 122], [13, 124], [9, 126], [6, 125], [8, 123], [12, 121], [15, 120], [18, 121]
  ],
  // ทวีปแอฟริกา
  [
    [37, 10], [36, 11], [32, 24], [31, 32], [28, 34], [22, 37], [12, 44], [11, 51],
    [3, 48], [-4, 40], [-11, 40], [-17, 38], [-25, 33], [-34, 26], [-35, 20], [-30, 17],
    [-23, 14], [-16, 12], [-5, 12], [4, 9], [6, 2], [5, -4], [5, -9], [12, -16],
    [15, -17], [21, -17], [28, -13], [33, -8], [36, -5], [36, 1], [37, 10]
  ],
  // มาดากัสการ์
  [
    [-12, 49], [-16, 50], [-25, 47], [-25, 44], [-20, 44], [-15, 47], [-12, 49]
  ],
  // ทวีปอเมริกาเหนือ
  [
    [71, -156], [70, -130], [68, -100], [60, -65], [47, -53], [44, -65], [35, -75], [25, -80],
    [29, -89], [29, -95], [26, -97], [20, -97], [16, -93], [14, -88], [9, -79], [8, -82],
    [16, -95], [20, -105], [23, -110], [32, -117], [37, -122], [48, -125], [54, -130], [59, -140],
    [60, -150], [58, -160], [65, -168], [71, -156]
  ],
  // ทวีปอเมริกาใต้
  [
    [12, -72], [11, -63], [7, -58], [-2, -44], [-6, -35], [-13, -39], [-23, -42], [-33, -51],
    [-42, -64], [-53, -68], [-55, -66], [-50, -75], [-40, -74], [-30, -72], [-18, -71], [-5, -81],
    [1, -79], [9, -77], [12, -72]
  ],
  // ทวีปออสเตรเลีย
  [
    [-11, 142], [-15, 145], [-23, 151], [-32, 153], [-38, 147], [-38, 140], [-32, 132], [-35, 117],
    [-32, 115], [-22, 114], [-17, 122], [-14, 127], [-12, 131], [-12, 136], [-11, 142]
  ],
  // นิวซีแลนด์
  [
    [-35, 174], [-39, 178], [-41, 175], [-46, 168], [-44, 169], [-41, 173], [-37, 175], [-35, 174]
  ],
  // ทวีปแอนตาร์กติกา (ขั้วโลกใต้)
  [
    [-65, -60], [-68, -30], [-70, 0], [-66, 30], [-66, 60], [-66, 90], [-65, 120], [-66, 150],
    [-72, 170], [-76, -170], [-74, -140], [-70, -100], [-65, -60]
  ]
]

// เมืองหลักสำหรับแสดงแสงไฟยามค่ำคืน (City Night Lights)
const MAJOR_CITIES = [
  { name: 'Bangkok', lat: 13.75, lon: 100.51, isHQ: true },
  { name: 'Chiang Mai', lat: 18.79, lon: 98.98 },
  { name: 'Phuket', lat: 7.88, lon: 98.39 },
  { name: 'Tokyo', lat: 35.68, lon: 139.76 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Seoul', lat: 37.56, lon: 126.97 },
  { name: 'Beijing', lat: 39.9, lon: 116.4 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { name: 'Hong Kong', lat: 22.31, lon: 114.16 },
  { name: 'Delhi', lat: 28.61, lon: 77.2 },
  { name: 'Dubai', lat: 25.2, lon: 55.27 },
  { name: 'London', lat: 51.5, lon: -0.12 },
  { name: 'Paris', lat: 48.85, lon: 2.35 },
  { name: 'New York', lat: 40.71, lon: -74.0 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Sydney', lat: -33.86, lon: 151.2 }
]

// ตรวจสอบว่าพิกัดอยู่ในทวีปหรือไม่
function isPointInPoly(pt, poly) {
  let inside = false
  const x = pt[1]
  const y = pt[0]
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][1], yi = poly[i][0]
    const xj = poly[j][1], yj = poly[j][0]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

// ย่อยเส้นขอบทวีปให้โค้งรับรูปทรงกลมอย่างเรียบเนียน
function subdividePoly(poly, maxDeg = 7) {
  const result = []
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i]
    const p2 = poly[(i + 1) % poly.length]
    result.push(p1)

    const dLat = p2[0] - p1[0]
    let dLon = p2[1] - p1[1]
    if (dLon > 180) dLon -= 360
    if (dLon < -180) dLon += 360

    const dist = Math.hypot(dLat, dLon)
    if (dist > maxDeg) {
      const steps = Math.ceil(dist / maxDeg)
      for (let s = 1; s < steps; s++) {
        const frac = s / steps
        result.push([p1[0] + dLat * frac, p1[1] + dLon * frac])
      }
    }
  }
  return result
}

// การฉายพิกัด 3D แบบ Orthographic
function projectPoint(latRad, lonRad, rotY, tiltZ = 0.409, pitchX = 0.18) {
  const lon = lonRad + rotY
  const cosLat = Math.cos(latRad)
  const x1 = cosLat * Math.sin(lon)
  const y1 = -Math.sin(latRad)
  const z1 = cosLat * Math.cos(lon)

  // Pitch around X axis
  const y2 = y1 * Math.cos(pitchX) - z1 * Math.sin(pitchX)
  const z2 = y1 * Math.sin(pitchX) + z1 * Math.cos(pitchX)
  const x2 = x1

  // Tilt around Z axis (Earth axial tilt ~23.4 deg)
  const x3 = x2 * Math.cos(tiltZ) - y2 * Math.sin(tiltZ)
  const y3 = x2 * Math.sin(tiltZ) + y2 * Math.cos(tiltZ)
  const z3 = z2

  return { x: x3, y: y3, z: z3 }
}

// ตัดเส้นขอบฟ้า (Horizon Clipping at z = 0) ป้องกันเส้นพาดหลังลูกโลก
function clipSegment(p1, p2) {
  if (p1.z >= 0 && p2.z >= 0) {
    return [{ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }]
  }
  if (p1.z < 0 && p2.z < 0) {
    return []
  }
  const t = (0 - p1.z) / (p2.z - p1.z)
  let ix = p1.x + t * (p2.x - p1.x)
  let iy = p1.y + t * (p2.y - p1.y)
  const len = Math.hypot(ix, iy) || 1
  ix /= len
  iy /= len

  if (p1.z >= 0) {
    return [{ x1: p1.x, y1: p1.y, x2: ix, y2: iy }]
  } else {
    return [{ x1: ix, y1: iy, x2: p2.x, y2: p2.y }]
  }
}

// ฉายพิกัดวงโคจรในอวกาศ (3D Orbit Projection)
function projectOrbitPoint(theta, rMult, inc, node, tiltZ = 0.409, pitchX = 0.18) {
  const xOrb = Math.cos(theta) * rMult
  const yOrb = Math.sin(theta) * Math.cos(inc) * rMult
  const zOrb = Math.sin(theta) * Math.sin(inc) * rMult

  const cosNode = Math.cos(node), sinNode = Math.sin(node)
  const xNode = xOrb * cosNode + zOrb * sinNode
  const yNode = yOrb
  const zNode = -xOrb * sinNode + zOrb * cosNode

  const cosPitch = Math.cos(pitchX), sinPitch = Math.sin(pitchX)
  const yPitch = yNode * cosPitch - zNode * sinPitch
  const zPitch = yNode * sinPitch + zNode * cosPitch
  const xPitch = xNode

  const cosTilt = Math.cos(tiltZ), sinTilt = Math.sin(tiltZ)
  const xFinal = xPitch * cosTilt - yPitch * sinTilt
  const yFinal = xPitch * sinTilt + yPitch * cosTilt
  const zFinal = zPitch

  return { x: xFinal, y: yFinal, z: zFinal }
}

// ============================================================================
// คลาสลูกโลก 3 มิติ (Earth Globe Engine)
// ============================================================================
class EarthGlobe {
  constructor() {
    this.rotY = 0.75 // หมุนเริ่มที่ภูมิภาคเอเชีย / ประเทศไทย
    this.rotSpeed = 0.0016 // ความเร็วหมุนรอบตัวเองอย่างนุ่มนวล
    this.tiltZ = 0.409 // แกนโลกเอียง 23.4 องศา
    this.pitchX = 0.20 // มุมมองลาดเอียงเล็กน้อยให้เห็นมิติทรงกลม
    this.frameCount = 0

    // เวกเตอร์ทิศทางแสงอาทิตย์ (Sun Light Direction in Space)
    this.sun = { x: -0.65, y: -0.45, z: 0.61 }
    const sunLen = Math.hypot(this.sun.x, this.sun.y, this.sun.z)
    this.sun.x /= sunLen
    this.sun.y /= sunLen
    this.sun.z /= sunLen

    // ดาวเทียมนภา-1 (NAPA-1: LEO วงโคจรต่ำ ความสูง 500 กม.)
    this.sat1 = {
      name: 'NAPA-1 (RTAF-SAT-1)',
      type: 'LEO Recon',
      rMult: 1.34,
      inc: 0.82,
      node: 0.45,
      angle: 0.3,
      speed: 0.0068,
      color: '#38bdf8',
      trail: []
    }

    // ดาวเทียมนภา-2 (NAPA-2: SSO Polar วงโคจรสัมพันธ์กับดวงอาทิตย์ 520 กม.)
    this.sat2 = {
      name: 'NAPA-2 (RTAF-SAT-2)',
      type: 'SSO Optical ISR',
      rMult: 1.46,
      inc: 1.68,
      node: 2.15,
      angle: 2.2,
      speed: 0.0052,
      color: '#34d399',
      trail: []
    }

    this.initGeometry()
  }

  initGeometry() {
    // 1. ตารางจุดข้อมูลแผ่นดินทวีป (High-density Land Dot Matrix)
    this.landPoints = []
    for (let lat = -76; lat <= 76; lat += 3.4) {
      const cosLat = Math.cos(lat * DEG2RAD)
      const lonStep = cosLat > 0.2 ? Math.max(3.4, 3.4 / cosLat) : 14
      for (let lon = -180; lon < 180; lon += lonStep) {
        for (const poly of CONTINENTS) {
          if (isPointInPoly([lat, lon], poly)) {
            this.landPoints.push({
              latRad: lat * DEG2RAD,
              lonRad: lon * DEG2RAD,
              isCity: false
            })
            break
          }
        }
      }
    }

    // 2. เส้นขอบทวีปที่ปรับความละเอียดแล้ว
    this.subdividedCoastlines = CONTINENTS.map(poly => subdividePoly(poly, 7))

    // 3. จุดพิกัดเมืองไฟราตรี
    this.cities = MAJOR_CITIES.map(c => ({
      ...c,
      latRad: c.lat * DEG2RAD,
      lonRad: c.lon * DEG2RAD
    }))
  }

  update(parallaxX = 0, parallaxY = 0) {
    this.frameCount++
    this.rotY += this.rotSpeed

    // อัปเดตตำแหน่งดาวเทียม 1 (NAPA-1)
    this.sat1.angle += this.sat1.speed
    const pSat1 = projectOrbitPoint(this.sat1.angle, this.sat1.rMult, this.sat1.inc, this.sat1.node, this.tiltZ, this.pitchX)
    this.sat1.pos = pSat1
    this.sat1.trail.push(pSat1)
    if (this.sat1.trail.length > 28) this.sat1.trail.shift()

    // อัปเดตตำแหน่งดาวเทียม 2 (NAPA-2)
    this.sat2.angle += this.sat2.speed
    const pSat2 = projectOrbitPoint(this.sat2.angle, this.sat2.rMult, this.sat2.inc, this.sat2.node, this.tiltZ, this.pitchX)
    this.sat2.pos = pSat2
    this.sat2.trail.push(pSat2)
    if (this.sat2.trail.length > 28) this.sat2.trail.shift()
  }

  // วาดเลเยอร์หลังลูกโลก (วงโคจรซีกหลัง, ละอองแสงบรรยากาศภายนอก)
  drawBack(ctx, cx, cy, R) {
    ctx.save()
    // 1. วงแหวนบรรยากาศเรืองแสงชั้นนอก (Atmospheric Corona / Fresnel Scattering)
    const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.34)
    outerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)')
    outerGlow.addColorStop(0.35, 'rgba(14, 165, 233, 0.16)')
    outerGlow.addColorStop(0.7, 'rgba(2, 132, 199, 0.05)')
    outerGlow.addColorStop(1, 'rgba(2, 6, 23, 0)')
    ctx.fillStyle = outerGlow
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.34, 0, Math.PI * 2)
    ctx.fill()

    // 2. ขีดวัดพิกัดวงโคจรเชิงยุทธการชั้นนอกสุด (Tactical Outer Ring Compass)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 12])
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // 3. เส้นวงโคจรดาวเทียมซีกหลังลูกโลก (z < 0)
    this.drawOrbitArc(ctx, cx, cy, R, this.sat1, true)
    this.drawOrbitArc(ctx, cx, cy, R, this.sat2, true)

    // วาดดาวเทียมหากอยู่ด้านหลังและไม่อยู่หลังทรงกลมลูกโลก
    if (this.sat1.pos && this.sat1.pos.z < 0) {
      this.drawSatellite(ctx, cx, cy, R, this.sat1, true)
    }
    if (this.sat2.pos && this.sat2.pos.z < 0) {
      this.drawSatellite(ctx, cx, cy, R, this.sat2, true)
    }

    ctx.restore()
  }

  // วาดตัวลูกโลก 3 มิติ (Ocean, Coastlines, Land Matrix, Day/Night Shading, Cities)
  drawGlobe(ctx, cx, cy, R) {
    ctx.save()

    // ตัดขอบเขตเรนเดอร์เฉพาะทรงกลมลูกโลก
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.clip()

    // 1. มหาสมุทรอวกาศสีน้ำเงินลึก (Deep Space Ocean Base Gradient)
    const oceanGrad = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.38, R * 0.08, cx, cy, R)
    oceanGrad.addColorStop(0, '#0c2748')
    oceanGrad.addColorStop(0.5, '#071830')
    oceanGrad.addColorStop(1, '#020914')
    ctx.fillStyle = oceanGrad
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

    // 2. เส้นโครงข่ายพิกัดละติจูด & ลองจิจูด (Graticule Grid Lines)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'
    ctx.lineWidth = 0.85

    // ลองจิจูด (ทุก 30 องศา)
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath()
      let started = false
      for (let lat = -80; lat <= 80; lat += 5) {
        const p = projectPoint(lat * DEG2RAD, lon * DEG2RAD, this.rotY, this.tiltZ, this.pitchX)
        if (p.z > 0) {
          const sx = cx + p.x * R
          const sy = cy + p.y * R
          if (!started) {
            ctx.moveTo(sx, sy)
            started = true
          } else {
            ctx.lineTo(sx, sy)
          }
        } else {
          started = false
        }
      }
      ctx.stroke()
    }

    // ละติจูด (เส้นศูนย์สูตร, ทรอปิก, อาร์กติก)
    const parallels = [-66.5, -45, -23.5, 0, 23.5, 45, 66.5]
    for (const lat of parallels) {
      ctx.beginPath()
      let started = false
      for (let lon = -180; lon <= 180; lon += 6) {
        const p = projectPoint(lat * DEG2RAD, lon * DEG2RAD, this.rotY, this.tiltZ, this.pitchX)
        if (p.z > 0) {
          const sx = cx + p.x * R
          const sy = cy + p.y * R
          if (!started) {
            ctx.moveTo(sx, sy)
            started = true
          } else {
            ctx.lineTo(sx, sy)
          }
        } else {
          started = false
        }
      }
      ctx.stroke()
    }

    // 3. โครงข่ายจุดแผ่นดินทวีปเชิงยุทธการ (Tactical Land Dot Matrix)
    for (let i = 0; i < this.landPoints.length; i++) {
      const pt = this.landPoints[i]
      const p = projectPoint(pt.latRad, pt.lonRad, this.rotY, this.tiltZ, this.pitchX)
      if (p.z > 0) {
        const sunFactor = p.x * this.sun.x + p.y * this.sun.y + p.z * this.sun.z
        const sx = cx + p.x * R
        const sy = cy + p.y * R

        if (sunFactor > -0.05) {
          const lightAlpha = Math.min(0.85, 0.35 + sunFactor * 0.55)
          ctx.fillStyle = `rgba(56, 189, 248, ${lightAlpha})`
          const dotSize = 1.35 * (0.8 + 0.35 * p.z)
          ctx.beginPath()
          ctx.arc(sx, sy, dotSize, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = 'rgba(14, 116, 144, 0.28)'
          ctx.beginPath()
          ctx.arc(sx, sy, 0.95, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // 4. เส้นขอบฝั่งทวีปคมชัด (Illuminated Vector Coastlines)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.58)'
    ctx.lineWidth = 1.2
    for (const poly of this.subdividedCoastlines) {
      for (let i = 0; i < poly.length; i++) {
        const p1Raw = poly[i]
        const p2Raw = poly[(i + 1) % poly.length]
        const p1 = projectPoint(p1Raw[0] * DEG2RAD, p1Raw[1] * DEG2RAD, this.rotY, this.tiltZ, this.pitchX)
        const p2 = projectPoint(p2Raw[0] * DEG2RAD, p2Raw[1] * DEG2RAD, this.rotY, this.tiltZ, this.pitchX)

        const segs = clipSegment(p1, p2)
        for (const seg of segs) {
          ctx.beginPath()
          ctx.moveTo(cx + seg.x1 * R, cy + seg.y1 * R)
          ctx.lineTo(cx + seg.x2 * R, cy + seg.y2 * R)
          ctx.stroke()
        }
      }
    }

    // 5. แสงไฟเมืองยามค่ำคืน (Twinkling Night City Lights)
    for (const city of this.cities) {
      const p = projectPoint(city.latRad, city.lonRad, this.rotY, this.tiltZ, this.pitchX)
      if (p.z > 0) {
        const sunFactor = p.x * this.sun.x + p.y * this.sun.y + p.z * this.sun.z
        if (sunFactor < 0.25) {
          const sx = cx + p.x * R
          const sy = cy + p.y * R
          ctx.fillStyle = city.isHQ ? '#facc15' : '#fbbf24'
          ctx.shadowBlur = city.isHQ ? 8 : 4
          ctx.shadowColor = '#f59e0b'
          ctx.beginPath()
          ctx.arc(sx, sy, city.isHQ ? 2.6 : 1.8, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
    }

    // 6. เงาแสงอาทิตย์ตกกระทบ (Day/Night Terminator Shading)
    const termGrad = ctx.createLinearGradient(
      cx + this.sun.x * R * 0.9,
      cy + this.sun.y * R * 0.9,
      cx - this.sun.x * R * 0.9,
      cy - this.sun.y * R * 0.9
    )
    termGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
    termGrad.addColorStop(0.48, 'rgba(3, 10, 26, 0.25)')
    termGrad.addColorStop(0.72, 'rgba(2, 6, 20, 0.72)')
    termGrad.addColorStop(1, 'rgba(1, 4, 14, 0.92)')
    ctx.fillStyle = termGrad
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

    // 7. แสงสะท้อนริมขอบชั้นบรรยากาศ (Inner Fresnel Atmosphere Glow)
    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.74, cx, cy, R)
    rimGrad.addColorStop(0, 'rgba(56, 189, 248, 0)')
    rimGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.18)')
    rimGrad.addColorStop(1, 'rgba(56, 189, 248, 0.55)')
    ctx.fillStyle = rimGrad
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

    ctx.restore()
  }

  // วาดเลเยอร์หน้าลูกโลก (สถานีภาคพื้นดินไทย, วงโคจรซีกหน้า, ตัวดาวเทียม และ HUD)
  drawFront(ctx, cx, cy, R) {
    ctx.save()

    // 1. สถานีภาคพื้นดินศูนย์ปฏิบัติการทางอวกาศ กองทัพอากาศ (RTAF SOC Bangkok Beacon)
    const bkk = projectPoint(13.75 * DEG2RAD, 100.51 * DEG2RAD, this.rotY, this.tiltZ, this.pitchX)
    if (bkk.z > 0.02) {
      const bx = cx + bkk.x * R
      const by = cy + bkk.y * R

      // คลื่นเรดาร์แผ่ขยาย (3 Expanding Radar Rings)
      for (let i = 0; i < 3; i++) {
        const ringProg = ((this.frameCount * 0.7 + i * 14) % 42) / 42
        const ringRadius = ringProg * 38 + 5
        const ringAlpha = (1 - ringProg) * 0.75 * bkk.z
        ctx.strokeStyle = `rgba(34, 211, 238, ${ringAlpha})`
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.arc(bx, by, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // จุดศูนย์กลางเรดาร์สีมรกตกระพริบ
      ctx.fillStyle = '#34d399'
      ctx.shadowBlur = 12
      ctx.shadowColor = '#10b981'
      ctx.beginPath()
      ctx.arc(bx, by, 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // เป้ากากบาทเรดาร์ (Tactical Reticle Crosshair)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      ctx.moveTo(bx - 8, by); ctx.lineTo(bx - 3, by)
      ctx.moveTo(bx + 3, by); ctx.lineTo(bx + 8, by)
      ctx.moveTo(bx, by - 8); ctx.lineTo(bx, by - 3)
      ctx.moveTo(bx, by + 3); ctx.lineTo(bx, by + 8)
      ctx.stroke()

      // เส้นโยง Telemetry HUD Badge
      const leaderEndX = bx + 45
      const leaderEndY = by - 35
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(bx + 20, by - 35)
      ctx.lineTo(leaderEndX + 115, leaderEndY)
      ctx.stroke()

      // กล่องข้อมูลสถานีภาคพื้นดินไทย
      ctx.fillStyle = 'rgba(7, 24, 46, 0.88)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.65)'
      ctx.lineWidth = 1
      const cardW = 125, cardH = 28
      ctx.beginPath()
      ctx.roundRect(leaderEndX - 10, leaderEndY - cardH, cardW, cardH, 5)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#38bdf8'
      ctx.font = 'bold 9px Prompt, sans-serif'
      ctx.fillText('🇹🇭 RTAF SOC : BANGKOK', leaderEndX - 4, leaderEndY - 16)
      ctx.fillStyle = '#67e8f9'
      ctx.font = '8px Prompt, monospace'
      ctx.fillText('13.75°N 100.51°E • ONLINE', leaderEndX - 4, leaderEndY - 6)
    }

    // 2. เส้นวงโคจรดาวเทียมซีกหน้าลูกโลก (z >= 0)
    this.drawOrbitArc(ctx, cx, cy, R, this.sat1, false)
    this.drawOrbitArc(ctx, cx, cy, R, this.sat2, false)

    // 3. วาดตัวดาวเทียมด้านหน้า (เมื่อ z >= 0)
    if (this.sat1.pos && this.sat1.pos.z >= 0) {
      this.drawSatellite(ctx, cx, cy, R, this.sat1, false)
    }
    if (this.sat2.pos && this.sat2.pos.z >= 0) {
      this.drawSatellite(ctx, cx, cy, R, this.sat2, false)
    }

    ctx.restore()
  }

  // วาดส่วนโค้งของวงโคจร (แยก z < 0 หลังโลก และ z >= 0 หน้าโลก)
  drawOrbitArc(ctx, cx, cy, R, sat, isBack) {
    const steps = 100
    ctx.strokeStyle = isBack
      ? `rgba(56, 189, 248, 0.16)`
      : sat.color === '#38bdf8' ? 'rgba(56, 189, 248, 0.48)' : 'rgba(52, 211, 153, 0.45)'
    ctx.lineWidth = isBack ? 1 : 1.3
    ctx.setLineDash(isBack ? [2, 8] : [5, 6])

    ctx.beginPath()
    let started = false
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2
      const p = projectOrbitPoint(th, sat.rMult, sat.inc, sat.node, this.tiltZ, this.pitchX)
      const matches = isBack ? p.z < 0 : p.z >= 0
      if (matches) {
        const sx = cx + p.x * R
        const sy = cy + p.y * R
        if (!started) {
          ctx.moveTo(sx, sy)
          started = true
        } else {
          ctx.lineTo(sx, sy)
        }
      } else {
        started = false
      }
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // วาดตัวดาวเทียม นภา-1 / นภา-2 พร้อมแผงโซลาร์เซลล์และป้าย HUD
  drawSatellite(ctx, cx, cy, R, sat, isBack) {
    const sx = cx + sat.pos.x * R
    const sy = cy + sat.pos.y * R
    const alpha = isBack ? 0.35 : 1.0

    ctx.save()
    ctx.globalAlpha = alpha

    // ลำแสงเลเซอร์สื่อสารลงสู่พื้นโลก (Downlink Beam)
    if (!isBack) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(cx + (sat.pos.x / sat.rMult) * R, cy + (sat.pos.y / sat.rMult) * R)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // แผงโซลาร์เซลล์ซ้าย-ขวา
    ctx.fillStyle = '#0284c7'
    ctx.strokeStyle = sat.color
    ctx.lineWidth = 1
    // Solar wing left
    ctx.fillRect(sx - 11, sy - 2.5, 6, 5)
    ctx.strokeRect(sx - 11, sy - 2.5, 6, 5)
    // Solar wing right
    ctx.fillRect(sx + 5, sy - 2.5, 6, 5)
    ctx.strokeRect(sx + 5, sy - 2.5, 6, 5)

    // บอดี้ตัวดาวเทียมตรงกลาง
    ctx.fillStyle = '#f8fafc'
    ctx.shadowBlur = isBack ? 2 : 8
    ctx.shadowColor = sat.color
    ctx.fillRect(sx - 3, sy - 3.5, 6, 7)
    ctx.shadowBlur = 0

    // ไฟสัญญาณบอกตำแหน่งกระพริบ (Navigation Strobe)
    const strobe = Math.floor(this.frameCount / 18) % 2 === 0
    ctx.fillStyle = strobe ? (sat.color === '#38bdf8' ? '#38bdf8' : '#34d399') : '#f43f5e'
    ctx.beginPath()
    ctx.arc(sx, sy, 1.6, 0, Math.PI * 2)
    ctx.fill()

    // ป้าย HUD ชื่อดาวเทียม (เฉพาะเมื่ออยู่ด้านหน้า)
    if (!isBack) {
      ctx.fillStyle = 'rgba(6, 18, 38, 0.85)'
      ctx.strokeStyle = sat.color
      ctx.lineWidth = 0.8
      const badgeW = 108, badgeH = 22
      const badgeX = sx + 12
      const badgeY = sy - 11
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 8.5px Prompt, sans-serif'
      ctx.fillText(`▲ ${sat.name}`, badgeX + 4, badgeY + 10)
      ctx.fillStyle = sat.color
      ctx.font = '7.5px Prompt, monospace'
      ctx.fillText(`${sat.type} • ACTIVE`, badgeX + 4, badgeY + 18)
    }

    ctx.restore()
  }
}

const handleMouseMove = (e) => {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  targetMouseX = (e.clientX - cx) * 0.1
  targetMouseY = (e.clientY - cy) * 0.1
}

const initSpaceCanvas = () => {
  const canvas = spaceCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  let width = (canvas.width = window.innerWidth)
  let height = (canvas.height = window.innerHeight)

  const handleResize = () => {
    if (!canvas) return
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    stars = Array.from({ length: 140 }, () => new Star(width, height))
  }

  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)

  stars = Array.from({ length: 140 }, () => new Star(width, height))
  meteors = []
  earthGlobe = new EarthGlobe()

  let frameCount = 0

  const animate = () => {
    frameCount++
    // Smooth mouse parallax easing
    mouseX += (targetMouseX - mouseX) * 0.05
    mouseY += (targetMouseY - mouseY) * 0.05

    ctx.clearRect(0, 0, width, height)

    // Periodic Meteor Spawn (every 180-260 frames)
    if (frameCount % 200 === 0 || (frameCount > 80 && meteors.length === 0 && Math.random() < 0.02)) {
      if (meteors.length < 3) {
        meteors.push(new Meteor(width, height))
      }
    }

    // Draw Constellation Mesh (Nearby stars connection)
    const activeForegroundStars = stars.filter(s => s.z > 0.55)
    ctx.save()
    for (let i = 0; i < activeForegroundStars.length; i++) {
      for (let j = i + 1; j < activeForegroundStars.length; j++) {
        const dx = activeForegroundStars[i].x - activeForegroundStars[j].x
        const dy = activeForegroundStars[i].y - activeForegroundStars[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 85) {
          const alpha = (1 - dist / 85) * 0.14
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(activeForegroundStars[i].x, activeForegroundStars[i].y)
          ctx.lineTo(activeForegroundStars[j].x, activeForegroundStars[j].y)
          ctx.stroke()
        }
      }
    }
    ctx.restore()

    // Update & Draw Stars
    for (const star of stars) {
      star.update(width, height, mouseX, mouseY)
      star.draw(ctx)
    }

    // Update & Draw Meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      meteors[i].update()
      meteors[i].draw(ctx)
      if (!meteors[i].active) {
        meteors.splice(i, 1)
      }
    }

    // 4. เรนเดอร์ลูกโลก 3 มิติเชิงยุทธการ (Tactical 3D Earth Globe)
    if (earthGlobe) {
      const globeCx = width / 2 + mouseX * 0.12
      const globeCy = height / 2 + mouseY * 0.12
      const globeRadius = Math.max(160, Math.min(Math.min(width, height) * 0.36, 420))

      earthGlobe.update(mouseX, mouseY)
      earthGlobe.drawBack(ctx, globeCx, globeCy, globeRadius)
      earthGlobe.drawGlobe(ctx, globeCx, globeCy, globeRadius)
      earthGlobe.drawFront(ctx, globeCx, globeCy, globeRadius)
    }

    animId = requestAnimationFrame(animate)
  }

  animate()

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', handleMouseMove)
    if (animId) cancelAnimationFrame(animId)
  }
}

let cleanupCanvas = null

onMounted(() => {
  cleanupCanvas = initSpaceCanvas()
})

onUnmounted(() => {
  if (cleanupCanvas) cleanupCanvas()
})
</script>

<template>
  <div class="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#030816] text-slate-100 select-none">
    <!-- 1. Interactive Space Canvas (ดวงดาวระยิบระยับ, ดาวตก, เส้นสายอวกาศ) -->
    <canvas
      ref="spaceCanvasRef"
      class="absolute inset-0 w-full h-full pointer-events-none z-0"
    ></canvas>

    <!-- 2. Cosmic Ambient Nebulae (กลุ่มเมฆเนบิวลาเรืองแสงหลายมิติ) -->
    <div class="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[160px] pointer-events-none animate-pulse-slow"></div>
    <div class="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-blue-600/20 blur-[170px] pointer-events-none animate-pulse-slow" style="animation-delay: 2.5s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] rounded-full bg-sky-500/10 blur-[180px] pointer-events-none"></div>

    <!-- 3. Tactical Orbital Rings & Grid (เส้นโครงข่ายพิกัดวงโคจรในอวกาศ) -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80c_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80c_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

    <!-- 4. Background Tactical Emblem Watermark (โปร่งแสงเบาบาง เพื่อขับให้ลูกโลก 3D โดดเด่น) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 flex items-center justify-center">
      <div class="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
        <img
          src="/src/assets/png-isr.png"
          alt="SPACE ISR Crest Insignia"
          class="w-44 sm:w-52 h-auto object-contain opacity-[0.07] filter drop-shadow-[0_0_40px_rgba(56,189,248,0.3)] contrast-125"
        />
      </div>
    </div>

    <!-- 5. Main Login Card Container (การ์ดเข้าสู่ระบบ ยกระดับมิติความลึกด้วย Glassmorphism) -->
    <div
      :class="[
        'relative z-10 w-full max-w-[480px] transition-all duration-500',
        cardMinimized ? 'opacity-10 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      ]"
    >
      <div class="bg-[#07172c]/90 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border-2 border-sky-400/40 shadow-[0_20px_60px_rgba(1,8,20,0.95),0_0_40px_rgba(56,189,248,0.2)] transition-all font-prompt">
        <!-- Brand Header with Perfectly Sized Hero Emblem -->
        <div class="text-center mb-7">
          <!-- Hero Logo Container with Luminous Crest Pedestal -->
          <div class="inline-flex relative group mb-4">
            <!-- Glowing Aura Behind Logo -->
            <div class="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse-slow"></div>

            <!-- Logo Pedestal Badge -->
            <div class="relative px-6 py-4 rounded-2xl bg-gradient-to-b from-[#0e2c52] via-[#091f3a] to-[#051426] border-2 border-sky-400/60 shadow-xl shadow-sky-950/80 flex items-center justify-center">
              <img
                src="/src/assets/png-isr.png"
                alt="SPACE ISR Emblem"
                class="h-20 sm:h-24 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.6)] transition-transform duration-300 group-hover:scale-105"
                onerror="this.style.display='none'"
              />
            </div>
          </div>

          <!-- Brand Title & Department Subtitle -->
          <div>
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-2 shadow-xs">
              <Orbit class="w-3.5 h-3.5 animate-spin-slow text-cyan-300" />
              <span>Space Intelligence Surveillance & Reconnaissance</span>
            </div>
            <h1 class="text-2xl sm:text-[28px] font-extrabold text-white tracking-[0.02em] leading-snug drop-shadow-sm">
              Satellite Operations
            </h1>
            <p class="text-sm sm:text-[15px] uppercase tracking-[0.16em] text-cyan-300 font-bold mt-1">
              Information System (SOIS)
            </p>
          </div>
        </div>

        <!-- Error Message Box -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 rounded-xl bg-rose-950/85 border-2 border-rose-500/70 text-rose-100 text-sm sm:text-base font-semibold flex items-center gap-2.5 shadow-md"
        >
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="handleLogin">
          <!-- Username Input -->
          <div>
            <label for="username" class="block text-sm sm:text-base font-bold text-white mb-2 tracking-wide">
              Username <span class="text-cyan-200 font-medium">(ชื่อผู้ใช้งาน)</span>
            </label>
            <div class="relative">
              <User class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300 pointer-events-none" />
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autocomplete="username"
                placeholder="ระบุ username (ไม่ต้องใส่ @rtaf.mi.th)"
                class="w-full pl-12 pr-4 py-3.5 text-base sm:text-[17px] font-semibold rounded-xl border-2 border-sky-400/50 bg-[#06152a] text-white placeholder:text-sky-200/75 focus:outline-hidden focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/25 transition-all font-prompt tracking-wide shadow-inner"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm sm:text-base font-bold text-white mb-2 tracking-wide">
              Password <span class="text-cyan-200 font-medium">(รหัสผ่าน)</span>
            </label>
            <div class="relative">
              <Lock class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300 pointer-events-none" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="ระบุรหัสผ่าน หรือเว้นว่างหากยังไม่เคยตั้ง"
                class="w-full pl-12 pr-12 py-3.5 text-base sm:text-[17px] font-semibold rounded-xl border-2 border-sky-400/50 bg-[#06152a] text-white placeholder:text-sky-200/75 focus:outline-hidden focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/25 transition-all font-prompt tracking-wide shadow-inner"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-white transition-colors p-1.5 cursor-pointer"
                title="แสดง/ซ่อนรหัสผ่าน"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Remember me & Quick Dev Fill -->
          <div class="flex items-center justify-between text-sm sm:text-[15px] pt-1 pb-1">
            <label class="flex items-center gap-2.5 cursor-pointer text-white hover:text-cyan-200 transition-colors select-none font-medium">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-5 h-5 rounded-md bg-[#06152a] border-2 border-sky-400/60 text-sky-400 focus:ring-cyan-400/30 focus:ring-offset-0 cursor-pointer"
              />
              <span class="tracking-wide">จดจำการเข้าสู่ระบบ</span>
            </label>

            <button
              type="button"
              class="text-cyan-300 hover:text-white hover:underline inline-flex items-center gap-1.5 font-bold transition-colors tracking-wide cursor-pointer"
              @click="autofillDev"
            >
              <Sparkles class="w-4 h-4 text-cyan-300" />
              <span>ใช้บัญชี Developer</span>
            </button>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:via-sky-400 hover:to-blue-500 active:scale-[0.99] disabled:opacity-50 text-white text-base sm:text-[18px] font-bold tracking-wide shadow-xl shadow-sky-500/30 transition-all flex items-center justify-center gap-3 mt-4 cursor-pointer"
          >
            <LogIn class="w-5 h-5 text-white" :class="loading ? 'animate-pulse' : ''" />
            <span>{{ loading ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบ (Sign In)' }}</span>
          </button>
        </form>

        <!-- Footer Notice -->
        <div class="mt-7 pt-5 border-t border-sky-400/30 text-center">
          <p class="text-xs sm:text-sm font-bold tracking-[0.14em] text-cyan-200 uppercase">
            Space Intelligence Surveillance and Reconnaissance
          </p>
          <p class="text-sm sm:text-base text-white font-semibold mt-1.5 tracking-wide">
            ศูนย์ปฏิบัติการทางอวกาศ กองทัพอากาศ
          </p>
        </div>
      </div>
    </div>

    <!-- 6. Interactive Globe View Toggle Button (ปุ่มสลับมุมมองชมลูกโลก 3D เต็มจอ) -->
    <button
      type="button"
      @click="cardMinimized = !cardMinimized"
      class="fixed bottom-5 right-5 z-30 px-4 py-2.5 rounded-xl bg-[#081b33]/90 hover:bg-[#0c284a] border-2 border-sky-400/50 hover:border-cyan-300 text-cyan-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.7)] transition-all cursor-pointer select-none group"
      :title="cardMinimized ? 'แสดงกล่องเข้าสู่ระบบ' : 'ซ่อนหน้าต่างเพื่อชมลูกโลก 3 มิติเต็มจอ'"
    >
      <Globe class="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
      <span>{{ cardMinimized ? 'แสดงหน้าต่างเข้าสู่ระบบ' : 'ชมลูกโลก 3D เต็มจอ' }}</span>
    </button>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(0.4deg);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-ultra-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 0.65;
    transform: scale(1.05);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-spin-slow {
  animation: spin-slow 12s linear infinite;
}

.animate-spin-ultra-slow {
  animation: spin-ultra-slow 45s linear infinite;
}

.animate-spin-reverse {
  animation: spin-reverse 30s linear infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 5s ease-in-out infinite;
}
</style>
