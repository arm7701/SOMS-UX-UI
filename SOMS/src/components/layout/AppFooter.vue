<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppFooter.vue
 * วัตถุประสงค์: ส่วนท้ายของหน้าเว็บ แสดงลิขสิทธิ์และสังกัดหน่วยงาน ISR (ธีมดำเทา)
 * ============================================================================
 */
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full mt-auto py-3.5 px-4 sm:px-6 border-t border-space-700 text-xs text-zinc-400 bg-space-900/95 backdrop-blur-md relative z-20 transition-colors">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left max-w-7xl mx-auto w-full">
      <p class="font-medium text-zinc-400">
        © {{ currentYear }} SPACE INTELLIGENCE SURVEILLANCE AND RECONNAISSANCE DIVISION (ISR)
      </p>
      <div class="flex items-center gap-3 text-[11px] font-mono">
        <span class="text-zinc-400">SOMS v2.0 (Vue 3)</span>
        <span class="text-space-600">•</span>
        <span class="text-emerald-400 font-medium flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          System Online
        </span>
      </div>
    </div>
  </footer>
</template>
