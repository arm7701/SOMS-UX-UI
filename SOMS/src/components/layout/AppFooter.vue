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
  <footer class="w-full py-3.5 px-4 sm:px-6 lg:px-8 border-t border-sky-200/80 dark:border-sky-800/40 text-xs text-slate-500 dark:text-sky-300/80 bg-white/80 dark:bg-space-900/90 backdrop-blur-md transition-colors">
    <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
      <p class="font-medium">
        © {{ currentYear }} SPACE INTELLIGENCE SURVEILLANCE AND RECONNAISSANCE DIVISION (ISR)
      </p>
      <div class="flex items-center gap-3 text-[11px]">
        <span>SOMS v2.0 (Vue 3)</span>
        <span>•</span>
        <span class="text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          System Online
        </span>
      </div>
    </div>
  </footer>
</template>
