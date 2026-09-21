<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/SomsLogo.vue
 * วัตถุประสงค์: ตราสัญลักษณ์ทางการของ SOMS (แบบที่ 7: Planetary Ring & Titanium Horizon)
 * ตัดขอบเนียนระดับสตูดิโอ (Anti-Aliased Sub-pixel Matting) ไร้รอยแหว่ง ไร้ขอบหยัก
 * ============================================================================
 */
import logoImg from '@/assets/soms-logo.png'

defineProps({
  variant: {
    type: String,
    default: 'full', // 'full' | 'hero' | 'compact' | 'badge'
    validator: (v) => ['full', 'hero', 'compact', 'badge'].includes(v)
  },
  glow: {
    type: Boolean,
    default: true
  },
  align: {
    type: String,
    default: 'responsive', // 'responsive' | 'center' | 'left'
    validator: (v) => ['responsive', 'center', 'left'].includes(v)
  }
})
</script>

<template>
  <!-- ===================================================================== -->
  <!-- 1. HERO VARIANT (สำหรับหน้า Login: ขยายใหญ่ขึ้น สง่างาม สมส่วน) -->
  <!-- ===================================================================== -->
  <div
    v-if="variant === 'hero'"
    class="soms-hero-logo flex flex-col select-none"
    :class="[
      align === 'responsive' ? 'items-center lg:items-start text-center lg:text-left' :
      align === 'center' ? 'items-center text-center' : 'items-start text-left'
    ]"
  >
    <!-- Emblem Container (ขยายใหญ่ขึ้น เด่นชัด สง่างาม สมส่วนกับแผงการ์ด) -->
    <div class="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-[330px] xl:h-[330px] flex items-center justify-center mb-6">
      <!-- Soft Ambient Aura Glow -->
      <div class="absolute inset-0 rounded-full bg-cyan-500/25 blur-3xl pointer-events-none soms-pulse-glow"></div>

      <!-- Main Aerospace Planetary Emblem #07 (รีมาสเตอร์ขอบเนียนกริบ ไร้รอยหยัก ไร้คราบฝ้า 100%) -->
      <img
        :src="logoImg"
        alt="SOMS Official Emblem"
        class="w-full h-full object-contain filter drop-shadow-[0_12px_40px_rgba(14,165,233,0.55)] relative z-10 transition-transform duration-500 hover:scale-105"
      />
    </div>

    <!-- Title & Wordmark Lockup -->
    <div class="space-y-2.5 max-w-lg">
      <!-- High-tech Status Pill -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-medium tracking-wider uppercase shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>SATELLITE COMMAND & CONTROL NETWORK</span>
      </div>

      <!-- Thai Title: ขนาดตัวหนังสือเด่นชัด สง่างาม สมส่วนกับโลโก้ -->
      <h1 class="text-xl sm:text-2xl lg:text-[1.65rem] font-bold font-prompt text-white tracking-normal leading-snug drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
        <span class="block sm:whitespace-nowrap">ระบบบริหารจัดการ</span>
        <span class="block sm:whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300">
          การปฏิบัติการดาวเทียมกองทัพอากาศ
        </span>
      </h1>

      <!-- English Subtitle with SOMS badge -->
      <div class="flex items-center gap-2 flex-wrap pt-0.5" :class="align === 'center' ? 'justify-center' : ''">
        <span class="text-xs sm:text-sm font-semibold font-prompt text-cyan-300/90 tracking-wider">
          Satellite Operations Management System
        </span>
        <span class="px-2.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 text-[11px] font-black font-mono text-cyan-200 shadow-xs">
          SOMS
        </span>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- 2. FULL NAVBAR / HEADER BRAND LOCKUP (ตราสัญลักษณ์ + ชื่อย่อ + ชื่อเต็ม) -->
  <!-- ===================================================================== -->
  <div v-else-if="variant === 'full'" class="soms-full-logo flex items-center gap-3 select-none group">
    <!-- Emblem Icon Badge (แบบที่ 7 พร้อม Soft Aura) -->
    <div class="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
      <div class="absolute inset-0 rounded-full bg-cyan-500/20 blur-md group-hover:bg-cyan-500/35 transition-all"></div>
      <img
        :src="logoImg"
        alt="SOMS Official Emblem"
        class="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.55)] relative z-10 transition-transform duration-300 group-hover:scale-110"
      />
    </div>

    <!-- Typography Text Lockup (Clean & Balanced: Full System Name - No Line Break) -->
    <div class="flex flex-col justify-center min-w-0 flex-shrink-0">
      <!-- Desktop & Tablet: ชื่อเต็มครบถ้วนบนบรรทัดเดียว ไม่มีการตัดหรือตบขึ้นบรรทัดใหม่เด็ดขาด -->
      <span class="hidden sm:block text-xs sm:text-[13px] lg:text-sm font-bold font-prompt text-white tracking-tight leading-snug drop-shadow-sm whitespace-nowrap">
        ระบบบริหารจัดการการปฏิบัติการดาวเทียมกองทัพอากาศ
      </span>
      <!-- Mobile: ชื่อกระชับพอดีหน้าจอมือถือ ไม่เบียดปุ่ม ไม่ล้นจอ -->
      <span class="sm:hidden text-xs font-bold font-prompt text-white tracking-tight leading-snug whitespace-nowrap">
        ระบบปฏิบัติการดาวเทียม ทอ.
      </span>
      <!-- Subtitle: ภาษาอังกฤษสวยหรู -->
      <span class="hidden md:block text-[10px] lg:text-[10.5px] uppercase tracking-wider text-cyan-400 font-medium font-prompt leading-tight mt-0.5 whitespace-nowrap">
        Satellite Operations Management System
      </span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- 3. COMPACT VARIANT (สำหรับ Sidebar Drawer มือถือ) -->
  <!-- ===================================================================== -->
  <div v-else-if="variant === 'compact'" class="soms-compact-logo flex items-center gap-2.5 select-none">
    <div class="w-8 h-8 flex-shrink-0 flex items-center justify-center">
      <img :src="logoImg" alt="SOMS Emblem" class="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
    </div>
    <div class="flex flex-col min-w-0">
      <span class="font-bold text-sm text-white font-prompt leading-tight">
        SOMS กองทัพอากาศ
      </span>
      <span class="text-[10px] text-cyan-300 font-prompt truncate">
        Satellite Operations Management
      </span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- 4. BADGE ONLY VARIANT (ไอคอนอย่างเดียว) -->
  <!-- ===================================================================== -->
  <div v-else class="soms-badge-logo relative w-8 h-8 flex items-center justify-center select-none">
    <img :src="logoImg" alt="SOMS Emblem" class="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
  </div>
</template>

<style scoped>
.soms-hero-logo,
.soms-full-logo,
.soms-compact-logo,
.soms-badge-logo {
  isolation: isolate;
}

@keyframes soms-pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

.soms-pulse-glow {
  animation: soms-pulse-glow 4s ease-in-out infinite;
}
</style>
