<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/common/SomsLogo.vue
 * วัตถุประสงค์: ตราสัญลักษณ์และโลโก้ตัวหนังสือทางการ (Official Emblem & Wordmark)
 * สไตล์: Aerospace Command / Futuristic Space Agency / Clean & Authoritative
 * ฟอนต์โลโก้: Orbitron (Aerospace Sci-Fi) & Chakra Petch / Prompt
 * ============================================================================
 */
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
  <!-- 1. HERO VARIANT (สำหรับหน้า Login และจุดต้อนรับหลัก) -->
  <!-- เรียบหรู สง่างาม ไร้เส้นขีดรบกวนตา ฟอนต์ Orbitron สไตล์ Aerospace ทรงพลัง -->
  <!-- ===================================================================== -->
  <div
    v-if="variant === 'hero'"
    class="soms-hero-logo flex flex-col select-none"
    :class="[
      align === 'responsive' ? 'items-center lg:items-start text-center lg:text-left' :
      align === 'center' ? 'items-center text-center' : 'items-start text-left'
    ]"
  >
    <!-- Emblem Container (ไม่มีกรอบขีดๆ สะอาดตา มีมิติความลึกสมจริง) -->
    <div class="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center mb-6">
      <!-- Soft Ambient Aura Glow -->
      <div class="absolute inset-2 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none soms-pulse-glow"></div>

      <!-- Main Aerospace Mission Patch Emblem -->
      <svg
        class="w-full h-full filter drop-shadow-[0_4px_24px_rgba(14,165,233,0.4)] relative z-10"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- Neon Cyan / Deep Sapphire Gradient -->
          <linearGradient id="patch-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="50%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#1e3a8a" />
          </linearGradient>

          <!-- Deep Obsidian Titanium Glass Background -->
          <linearGradient id="patch-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0d1b2f" stop-opacity="0.95" />
            <stop offset="60%" stop-color="#07101e" stop-opacity="0.98" />
            <stop offset="100%" stop-color="#030710" stop-opacity="1" />
          </linearGradient>

          <!-- Glowing SOMS Lettermark Gradient (White to Ice Cyan) -->
          <linearGradient id="patch-soms-text" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="45%" stop-color="#f0f9ff" />
            <stop offset="100%" stop-color="#38bdf8" />
          </linearGradient>

          <!-- 3D Metallic Gold Wing Chevrons -->
          <linearGradient id="patch-gold-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="40%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="patch-gold-right" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fde047" />
            <stop offset="40%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>

          <!-- Orbital Arc Gradient -->
          <linearGradient id="patch-orbit-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
            <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.3" />
          </linearGradient>

          <!-- Soft Neon Glow Filter -->
          <filter id="patch-text-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 1. Outer Aerospace Shield Base -->
        <polygon
          points="100,14 172,52 172,146 100,186 28,146 28,52"
          fill="url(#patch-bg)"
          stroke="#1e3a8a"
          stroke-width="2"
        />

        <!-- 2. Cyber Inset Accent Border -->
        <polygon
          points="100,20 166,55 166,143 100,180 34,143 34,55"
          fill="none"
          stroke="url(#patch-rim)"
          stroke-width="1.8"
          opacity="0.9"
        />

        <!-- 3. Inner Clean Horizon Arc (Smooth, no dashed noise) -->
        <path
          d="M 38 128 C 55 78, 145 68, 164 60"
          fill="none"
          stroke="url(#patch-orbit-glow)"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          d="M 38 128 C 55 78, 145 68, 164 60"
          fill="none"
          stroke="#ffffff"
          stroke-width="1"
          stroke-linecap="round"
          opacity="0.7"
        />

        <!-- 4. Satellite at Orbit Apogee with 4-Point Starflare -->
        <g transform="translate(156, 62)">
          <!-- Glowing Starflare -->
          <path d="M 0,-9 L 2,-2 L 9,0 L 2,2 L 0,9 L -2,2 L -9,0 L -2,-2 Z" fill="#ffffff" filter="drop-shadow(0 0 6px #38bdf8)" />
          <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
          <!-- Satellite Solar Panels -->
          <line x1="-10" y1="5" x2="-4" y2="2" stroke="#38bdf8" stroke-width="2" />
          <line x1="4" y1="-2" x2="10" y2="-5" stroke="#38bdf8" stroke-width="2" />
        </g>

        <!-- 5. 3D Faceted Gold Chevrons at Base (ปีกทองคำทรงภูมิฐาน) -->
        <g transform="translate(0, 12)">
          <!-- Upper Wing Left & Right -->
          <polygon points="60,132 100,115 100,123 60,136" fill="url(#patch-gold-left)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
          <polygon points="140,132 100,115 100,123 140,136" fill="url(#patch-gold-right)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
          <!-- Lower Wing Left & Right -->
          <polygon points="70,142 100,129 100,135 70,146" fill="url(#patch-gold-left)" opacity="0.9" />
          <polygon points="130,142 100,129 100,135 130,146" fill="url(#patch-gold-right)" opacity="0.9" />
          <!-- Center Gold Diamond -->
          <polygon points="100,110 103,115 100,120 97,115" fill="#fef08a" />
        </g>

        <!-- 6. SOMS Aerospace Wordmark (Orbitron Font: Sharp, High-Tech, Beautiful) -->
        <g transform="translate(0, 2)">
          <!-- Background Glow -->
          <text
            x="100"
            y="104"
            font-family="'Orbitron', sans-serif"
            font-size="34"
            font-weight="900"
            letter-spacing="3.5"
            text-anchor="middle"
            fill="#38bdf8"
            filter="url(#patch-text-glow)"
            opacity="0.8"
          >
            SOMS
          </text>
          <!-- Crisp Foreground Lettering -->
          <text
            x="100"
            y="104"
            font-family="'Orbitron', sans-serif"
            font-size="34"
            font-weight="900"
            letter-spacing="3.5"
            text-anchor="middle"
            fill="url(#patch-soms-text)"
          >
            SOMS
          </text>
        </g>
      </svg>
    </div>

    <!-- Title & Wordmark Lockup (สง่างาม คมชัด ไม่ล้นขอบ ไม่ซ้ำซ้อน) -->
    <div class="space-y-2 max-w-lg">
      <!-- High-tech Status Pill -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-medium tracking-wider uppercase shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>SATELLITE COMMAND & CONTROL NETWORK</span>
      </div>

      <!-- Thai Title: สองบรรทัดขนาดสมดุล ไม่ล้น ไม่ชิดขอบ มีพื้นที่หายใจ -->
      <h1 class="text-xl sm:text-2xl lg:text-[1.55rem] font-bold font-prompt text-white tracking-normal leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
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
        <span class="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 text-[10.5px] font-black font-mono text-cyan-200 shadow-xs">
          SOMS
        </span>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- 2. FULL NAVBAR / HEADER BRAND LOCKUP (ตราสัญลักษณ์ + ชื่อย่อ + ชื่อเต็ม) -->
  <!-- ===================================================================== -->
  <div v-else-if="variant === 'full'" class="soms-full-logo flex items-center gap-3 select-none group">
    <!-- Emblem Icon Badge with Orbitron Font -->
    <div class="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
      <div class="absolute inset-0 rounded-xl bg-cyan-500/15 blur-md group-hover:bg-cyan-500/30 transition-all"></div>
      <svg class="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.45)] relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nav-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#0284c7" />
          </linearGradient>
          <linearGradient id="nav-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>
        <!-- Outer Shield -->
        <polygon
          points="50,6 90,26 90,74 50,94 10,74 10,26"
          fill="#071222"
          stroke="url(#nav-rim)"
          stroke-width="2.5"
        />
        <!-- Clean Orbit Sweep Arc -->
        <path
          d="M 18 64 C 28 36, 74 32, 82 28"
          fill="none"
          stroke="#38bdf8"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <!-- Satellite Star -->
        <circle cx="82" cy="28" r="3.5" fill="#ffffff" />
        <!-- SOMS Orbitron Monogram -->
        <text
          x="50"
          y="56"
          font-family="'Orbitron', sans-serif"
          font-size="18"
          font-weight="900"
          letter-spacing="1"
          text-anchor="middle"
          fill="#ffffff"
        >
          SOMS
        </text>
        <!-- Gold Wings -->
        <path
          d="M 32,70 L 50,61 L 68,70 L 50,65 Z"
          fill="url(#nav-gold)"
        />
      </svg>
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
      <svg class="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" viewBox="0 0 100 100" fill="none">
        <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" fill="#071222" stroke="#38bdf8" stroke-width="2.5" />
        <text x="50" y="56" font-family="'Orbitron', sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="#ffffff">SOMS</text>
        <path d="M 32,70 L 50,61 L 68,70 L 50,65 Z" fill="#f59e0b" />
      </svg>
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
    <svg class="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" viewBox="0 0 100 100" fill="none">
      <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" fill="#071222" stroke="#38bdf8" stroke-width="2.5" />
      <text x="50" y="56" font-family="'Orbitron', sans-serif" font-size="18" font-weight="900" text-anchor="middle" fill="#ffffff">SOMS</text>
    </svg>
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
