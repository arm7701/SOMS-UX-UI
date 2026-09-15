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
import { LogIn, Eye, EyeOff, User, Lock, Sparkles, Orbit } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')
const loading = ref(false)

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

    <!-- 4. Background Tactical Emblem with Orbital Compass (โลโก้ตราสัญลักษณ์อวกาศขนาดพอดี พร้อมวงโคจร) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 flex items-center justify-center">
      <div class="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
        <!-- Outer Dashed Tactical Orbit Ring -->
        <div class="absolute inset-0 rounded-full border border-sky-400/20 border-dashed animate-spin-ultra-slow"></div>
        <!-- Inner Scanning Orbit Ring -->
        <div class="absolute inset-8 rounded-full border border-cyan-400/25 animate-spin-reverse"></div>
        <!-- Secondary Orbital Ring -->
        <div class="absolute inset-16 rounded-full border border-blue-400/20"></div>
        <!-- Radar Pulse Glow Aura -->
        <div class="absolute inset-20 rounded-full bg-gradient-to-tr from-sky-500/10 via-cyan-400/15 to-transparent blur-2xl animate-pulse-slow"></div>

        <!-- Perfectly Proportioned Background Crest Watermark (ความกว้างสมส่วน 210px-240px ไม่เทอะทะ) -->
        <img
          src="/src/assets/png-isr.png"
          alt="SPACE ISR Crest Insignia"
          class="w-48 sm:w-56 h-auto object-contain opacity-[0.22] filter drop-shadow-[0_0_35px_rgba(56,189,248,0.5)] contrast-125 animate-float"
        />
      </div>
    </div>

    <!-- 5. Main Login Card Container (การ์ดเข้าสู่ระบบ ยกระดับมิติความลึกด้วย Glassmorphism) -->
    <div class="relative z-10 w-full max-w-[480px]">
      <div class="bg-[#08182f]/92 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border-2 border-sky-400/40 shadow-[0_20px_60px_rgba(1,8,20,0.9),0_0_40px_rgba(56,189,248,0.18)] transition-all font-prompt">
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
