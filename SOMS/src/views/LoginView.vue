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
  <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#0a2342] via-[#103b6e] to-[#185396] text-slate-100">
    <!-- Ambient Space Lighting & Colors (ธีมมืดฟ้าไล่สว่าง สว่างมีมิติ) -->
    <div class="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-sky-400/30 blur-[130px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-blue-500/30 blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-cyan-400/25 blur-[150px] pointer-events-none"></div>

    <!-- Tactical Grid Matrix Pattern -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80f_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80f_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

    <!-- Orbital Concentric Rings (เส้นสายวงโคจรจำลอง) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-sky-400/15 pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-blue-400/15 pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full border border-cyan-400/10 pointer-events-none"></div>

    <!-- Grand ISR Watermark Logo (ลายน้ำ โลโก้ ISR ขนาดใหญ่ในพื้นหลัง) -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center">
      <img
        src="/src/assets/png-isr.png"
        alt="ISR Crest Watermark"
        class="w-[460px] sm:w-[620px] max-w-none h-auto object-contain opacity-[0.14] filter contrast-125"
      />
    </div>

    <!-- Main Login Card Container -->
    <div class="relative z-10 w-full max-w-[480px]">
      <!-- Main Login Card with Glassmorphism Elevation -->
      <div class="bg-[#0b1f38]/95 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border-2 border-sky-400/40 shadow-[0_20px_60px_rgba(2,12,27,0.85)] transition-all font-prompt">
        <!-- Brand Header -->
        <div class="text-center mb-8">
          <div class="inline-flex p-3.5 rounded-2xl bg-gradient-to-b from-[#0e2c52] to-[#081b33] border-2 border-sky-400/40 text-sky-400 mb-4 shadow-lg shadow-sky-950/70">
            <img
              src="/src/assets/png-isr.png"
              alt="ISR Logo"
              class="h-14 w-auto object-contain mx-auto filter drop-shadow-[0_2px_10px_rgba(56,189,248,0.45)]"
              onerror="this.style.display='none'"
            />
          </div>
          <div>
            <h1 class="text-2xl sm:text-[28px] font-bold text-white tracking-[0.02em] leading-snug">
              Satellite Operations
            </h1>
            <p class="text-sm sm:text-[15px] uppercase tracking-[0.14em] text-cyan-300 font-bold mt-2">
              Information System (SOIS)
            </p>
          </div>
        </div>

        <!-- Error Message Box -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500/60 text-rose-100 text-sm sm:text-base font-semibold flex items-center gap-2.5 shadow-md"
        >
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Username Input -->
          <div>
            <label for="username" class="block text-sm sm:text-base font-bold text-white mb-2.5 tracking-wide">
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
                class="w-full pl-12 pr-4 py-3.5 text-base sm:text-[17px] font-semibold rounded-xl border-2 border-sky-400/50 bg-[#081e38] text-white placeholder:text-sky-200/80 focus:outline-hidden focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/25 transition-all font-prompt tracking-wide shadow-inner"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm sm:text-base font-bold text-white mb-2.5 tracking-wide">
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
                class="w-full pl-12 pr-12 py-3.5 text-base sm:text-[17px] font-semibold rounded-xl border-2 border-sky-400/50 bg-[#081e38] text-white placeholder:text-sky-200/80 focus:outline-hidden focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/25 transition-all font-prompt tracking-wide shadow-inner"
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
          <div class="flex items-center justify-between text-sm sm:text-[15px] pt-1 pb-0.5">
            <label class="flex items-center gap-2.5 cursor-pointer text-white hover:text-cyan-200 transition-colors select-none font-medium">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-5 h-5 rounded-md bg-[#081e38] border-2 border-sky-400/60 text-sky-400 focus:ring-cyan-400/30 focus:ring-offset-0 cursor-pointer"
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
        <div class="mt-8 pt-6 border-t border-sky-400/30 text-center">
          <p class="text-xs sm:text-sm font-bold tracking-[0.14em] text-cyan-200 uppercase">
            Space Intelligence Surveillance and Reconnaissance
          </p>
          <p class="text-sm sm:text-base text-white font-semibold mt-2 tracking-wide">
            ศูนย์ปฏิบัติการทางอวกาศ กองทัพอากาศ
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
