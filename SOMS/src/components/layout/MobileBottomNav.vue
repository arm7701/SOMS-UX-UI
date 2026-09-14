<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/MobileBottomNav.vue
 * วัตถุประสงค์: แถบเมนูลัดลอยตัวด้านล่างสำหรับสมาร์ตโฟน (Mobile Bottom Navigation Dock)
 * ออกแบบเพื่อการใช้งานด้วยนิ้วโป้งมือเดียว (One-Handed Operation)
 * แสดงเฉพาะบนหน้าจอขนาดเล็ก (< 1024px)
 * ============================================================================
 */
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Menu } from 'lucide-vue-next'
import { mobileNavItems as navItems } from '@/config'

const route = useRoute()
const appStore = useAppStore()

const isActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard' || route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-space-900/95 backdrop-blur-md border-t border-slate-200 dark:border-space-700 shadow-lg px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
    aria-label="เมนูนำทางด่วนด้านล่าง"
  >
    <div class="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-150 w-full active:scale-95"
        :class="isActive(item.path)
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'"
      >
        <div
          class="p-1 rounded-lg transition-colors"
          :class="isActive(item.path) ? 'bg-blue-50 dark:bg-blue-950/60' : ''"
        >
          <component :is="item.icon" class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-prompt tracking-tight">{{ item.label }}</span>
      </router-link>

      <!-- ปุ่มเปิดแถบเมนูทั้งหมด (All Menu Drawer) -->
      <button
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-150 w-full active:scale-95"
        :class="appStore.sidebarOpen
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'"
        @click="appStore.toggleSidebar"
      >
        <div
          class="p-1 rounded-lg transition-colors"
          :class="appStore.sidebarOpen ? 'bg-blue-50 dark:bg-blue-950/60' : ''"
        >
          <Menu class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-prompt tracking-tight">เมนูอื่น</span>
      </button>
    </div>
  </nav>
</template>
