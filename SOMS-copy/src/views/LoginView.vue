<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/LoginView.vue
 * วัตถุประสงค์: หน้าจอเข้าสู่ระบบ (Login Screen) สไตล์ทางการ สบายตา สีสุภาพ
 * ออกแบบให้การ์ดเด่นชัด มีมิติ ไม่กลืนไปกับพื้นหลัง มีระบบแสดง/ซ่อนรหัสผ่าน
 * ============================================================================
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { LogIn, Eye, EyeOff, ShieldCheck, User, Lock, Sparkles } from 'lucide-vue-next'

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
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#0a0d12] via-[#13161c] to-[#1b1f28] text-slate-100">
    <!-- Ambient Stealth Lighting & Colors (ธีมโทนดำเทา สุขุม ล้ำสมัย) -->
    <div class="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-zinc-600/15 blur-[130px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-slate-500/12 blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-slate-400/15 blur-[150px] pointer-events-none"></div>

    <!-- Tactical Grid Matrix Pattern -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

    <!-- Orbital Concentric Rings (เส้นสายวงโคจรจำลอง) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-zinc-500/20 pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-slate-500/20 pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full border border-neutral-500/15 pointer-events-none"></div>

    <!-- Grand ISR Watermark Logo (ลายน้ำ โลโก้ ISR ขนาดใหญ่ในพื้นหลัง) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center">
      <img
        src="/src/assets/png-isr.png"
        alt="ISR Crest Watermark"
        class="w-[460px] sm:w-[620px] max-w-none h-auto object-contain opacity-[0.24] sm:opacity-[0.28] filter brightness-110 contrast-105 drop-shadow-[0_0_35px_rgba(255,255,255,0.08)]"
      />
    </div>

    <!-- Main Login Card Container -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Main Login Card with Glassmorphism Elevation -->
      <div class="bg-space-850/95 backdrop-blur-xl rounded-3xl p-7 sm:p-8 border border-zinc-700/60 shadow-2xl shadow-black/60 transition-all">
        <!-- Brand Header -->
        <div class="text-center space-y-3 mb-6">
          <div class="inline-flex p-3.5 rounded-2xl bg-zinc-850/90 border border-zinc-700/80 text-zinc-200 mb-1 shadow-inner shadow-black/40">
            <img
              src="/src/assets/png-isr.png"
              alt="ISR Logo"
              class="h-11 w-auto object-contain mx-auto drop-shadow-md"
              onerror="this.style.display='none'"
            />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold font-prompt text-white tracking-[0.04em]">
              Satellite Operations
            </h1>
            <p class="text-xs uppercase tracking-[0.14em] text-slate-300 font-semibold mt-1 font-prompt">
              Information System (SOIS)
            </p>
          </div>
        </div>

        <!-- Error Message Box -->
        <div
          v-if="errorMessage"
          class="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 font-prompt tracking-[0.02em]"
        >
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <!-- Username Input -->
          <div>
            <label for="username" class="block text-xs font-semibold text-slate-200 mb-1.5 font-prompt tracking-[0.025em]">
              Username (ชื่อผู้ใช้งาน)
            </label>
            <div class="relative">
              <User class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autocomplete="username"
                placeholder="ระบุ username (ไม่ต้องใส่ @rtaf.mi.th)"
                class="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-zinc-700/90 bg-[#111620] text-white placeholder:text-slate-400 placeholder:tracking-[0.02em] tracking-[0.025em] font-prompt focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:border-zinc-400 transition-all"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-xs font-semibold text-slate-200 mb-1.5 font-prompt tracking-[0.025em]">
              Password (รหัสผ่าน)
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="ระบุรหัสผ่าน หรือเว้นว่างหากยังไม่เคยตั้ง"
                class="w-full pl-11 pr-11 py-3 text-sm rounded-xl border border-zinc-700/90 bg-[#111620] text-white placeholder:text-slate-400 placeholder:tracking-[0.02em] tracking-[0.025em] font-prompt focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:border-zinc-400 transition-all"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Remember me & Quick Dev Fill -->
          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors font-prompt tracking-[0.02em]">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="rounded border-zinc-700 bg-zinc-800 text-zinc-300 focus:ring-zinc-500/20 w-4 h-4"
              />
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>

            <button
              type="button"
              class="text-amber-300 hover:text-amber-200 hover:underline inline-flex items-center gap-1.5 transition-colors font-prompt tracking-[0.02em] font-medium"
              @click="autofillDev"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>ใช้บัญชี Developer</span>
            </button>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-600 border border-zinc-500/70 active:scale-[0.99] disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-black/50 transition-all flex items-center justify-center gap-2 mt-2 font-prompt tracking-[0.04em] cursor-pointer"
          >
            <LogIn class="w-4 h-4" :class="loading ? 'animate-pulse' : ''" />
            <span>{{ loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ (Sign In)' }}</span>
          </button>
        </form>

        <!-- Footer Notice -->
        <div class="mt-8 pt-6 border-t border-zinc-800/90 text-center text-xs leading-relaxed font-prompt">
          <p class="font-semibold text-slate-300 tracking-[0.12em] text-[11px]">
            SPACE INTELLIGENCE SURVEILLANCE AND RECONNAISSANCE
          </p>
          <p class="text-[11px] mt-1 text-slate-400 tracking-[0.03em]">
            ศูนย์ปฏิบัติการทางอวกาศ กองทัพอากาศ
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
