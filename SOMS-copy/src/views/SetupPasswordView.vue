<script setup>
/**
 * ============================================================================
 * ไฟล์: src/views/SetupPasswordView.vue
 * วัตถุประสงค์: หน้าจอตั้งรหัสผ่านใหม่ (Setup Password Screen)
 * สำหรับกรณีผู้ใช้งานใหม่ที่เพิ่งเข้าสู่ระบบ หรือผู้ใช้ที่ถูกแอดมินสั่งรีเซ็ตรหัสผ่าน
 * ============================================================================
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { KeyRound, Check, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const loading = ref(false)

const handleSetup = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'
    return
  }

  // ตรวจสอบความยาวรหัสผ่าน (10-72 ไบต์)
  const bytes = new TextEncoder().encode(password.value).length
  if (bytes < 10 || bytes > 72) {
    errorMessage.value = 'รหัสผ่านต้องมีความยาวระหว่าง 10–72 ไบต์ (ตัวอักษรไทยนับ 3 ไบต์/ตัว)'
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    await authStore.setupPassword(password.value)
    appStore.showToast('สำเร็จ', 'บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว')
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'บันทึกรหัสผ่านไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

const backToLogin = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-[#0a0d12] via-[#13161c] to-[#1b1f28] text-slate-100">
    <!-- Ambient Stealth Lighting & Colors -->
    <div class="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-zinc-600/12 blur-[130px] pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-slate-500/10 blur-[140px] pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-neutral-600/10 blur-[150px] pointer-events-none"></div>

    <!-- Tactical Grid Matrix Pattern -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

    <!-- Orbital Concentric Rings -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-zinc-500/15 pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-slate-500/15 pointer-events-none"></div>

    <!-- Grand ISR Watermark Logo -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex items-center justify-center">
      <img
        src="/src/assets/png-isr.png"
        alt="ISR Crest Watermark"
        class="w-[460px] sm:w-[620px] max-w-none h-auto object-contain opacity-[0.10] filter grayscale contrast-125"
      />
    </div>

    <!-- Main Container -->
    <div class="relative z-10 w-full max-w-md">
      <div class="bg-space-850/95 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/60 shadow-2xl shadow-black/60">
        <!-- Header -->
        <div class="text-center space-y-2 mb-6">
          <div class="inline-flex p-3.5 rounded-2xl bg-zinc-850 border border-zinc-700 text-zinc-200 mb-1 shadow-inner">
            <KeyRound class="w-7 h-7" />
          </div>
          <h1 class="text-xl font-bold font-prompt text-white">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p class="text-xs text-zinc-400">
            กรุณากำหนดรหัสผ่านใหม่เพื่อความปลอดภัยในการเข้าใช้งานระบบ
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs"
        >
          {{ errorMessage }}
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSetup">
          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              รหัสผ่านใหม่ (New Password) <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="ความยาวอย่างน้อย 10 ตัวอักษร"
              class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-700 bg-[#12141a] text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-300 mb-1">
              ยืนยันรหัสผ่านใหม่ (Confirm Password) <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
              class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-700 bg-[#12141a] text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-800 hover:from-zinc-600 hover:to-slate-700 border border-zinc-500/60 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-black/60 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.99]"
          >
            <Check class="w-4 h-4 text-emerald-400" />
            <span>{{ loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}</span>
          </button>
        </form>

        <div class="text-center mt-4">
          <button
            type="button"
            class="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
            @click="backToLogin"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>กลับไปยังหน้าเข้าสู่ระบบ</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
