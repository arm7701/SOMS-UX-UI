<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/MobileBottomNav.vue
 * วัตถุประสงค์: แถบเมนูลัดลอยตัวด้านล่างสำหรับสมาร์ตโฟน (Mobile Bottom Navigation Dock)
 * ออกแบบเพื่อการใช้งานด้วยนิ้วโป้งมือเดียว (One-Handed Operation)
 * ธีมดำเทาไททาเนียม รองรับ Safe Area Inset ของสมาร์ตโฟน
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
    class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-space-900/98 backdrop-blur-md border-t border-space-700 shadow-2xl px-2 py-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] transition-colors"
    aria-label="เมนูนำทางด่วนด้านล่าง"
  >
    <div class="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-150 w-full active:scale-95 cursor-pointer"
        :class="isActive(item.path)
          ? 'text-white font-bold'
          : 'text-zinc-400 hover:text-white font-medium'"
      >
        <div
          class="p-1.5 rounded-lg transition-colors flex items-center justify-center"
          :class="isActive(item.path) ? 'bg-zinc-800 text-white border border-zinc-600 shadow-xs' : 'text-zinc-400'"
        >
          <component :is="item.icon" class="w-4 h-4" />
        </div>
        <span
          class="text-[10px] font-prompt tracking-tight truncate max-w-full"
          :class="isActive(item.path) ? 'text-white font-semibold' : 'text-zinc-400'"
        >
          {{ item.label }}
        </span>
      </router-link>

      <!-- ปุ่มเปิดแถบเมนูทั้งหมด (All Menu Drawer) -->
      <button
        type="button"
        class="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-150 w-full active:scale-95 cursor-pointer"
        :class="appStore.sidebarOpen
          ? 'text-white font-bold'
          : 'text-zinc-400 hover:text-white font-medium'"
        @click="appStore.toggleSidebar"
      >
        <div
          class="p-1.5 rounded-lg transition-colors flex items-center justify-center"
          :class="appStore.sidebarOpen ? 'bg-zinc-800 text-white border border-zinc-600 shadow-xs' : 'text-zinc-400'"
        >
          <Menu class="w-4 h-4" />
        </div>
        <span
          class="text-[10px] font-prompt tracking-tight"
          :class="appStore.sidebarOpen ? 'text-white font-semibold' : 'text-zinc-400'"
        >
          เมนูอื่น
        </span>
      </button>
    </div>
  </nav>
</template>
