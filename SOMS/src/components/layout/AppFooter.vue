<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppFooter.vue
 * วัตถุประสงค์: ส่วนท้ายของหน้าเว็บ แสดงลิขสิทธิ์และสังกัดหน่วยงาน ISR
 * ============================================================================
 */
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full py-3.5 px-4 sm:px-6 lg:px-8 border-t border-sky-500/20 text-xs text-sky-200/80 bg-[#040e21]/95 backdrop-blur-xl transition-colors">
    <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
      <p class="font-semibold text-sky-200">
        © {{ currentYear }} SPACE INTELLIGENCE SURVEILLANCE AND RECONNAISSANCE DIVISION (ISR)
      </p>
      <div class="flex items-center gap-3 text-xs">
        <span class="text-cyan-300 font-mono font-bold">SOIS v2.0</span>
        <span class="text-sky-500">•</span>
        <span class="text-emerald-400 font-bold flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          Operations Center Online
        </span>
      </div>
    </div>
  </footer>
</template>
