<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppSidebar.vue
 * วัตถุประสงค์: แถบเมนูด้านข้าง (Sidebar Navigation)
 * จัดกลุ่มเมนูอย่างเป็นระเบียบ แบ่งเป็น ส่วนปฏิบัติการ, ประวัติ/Log และส่วนผู้ดูแลระบบ
 * รองรับการย่อ/ขยาย และแสดงผลแบบ Offcanvas บนจอมือถือ/แท็บเล็ต
 * ============================================================================
 */
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { X } from 'lucide-vue-next'
import { mainLinks, systemLinks, adminLinks } from '@/config'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const isActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard' || route.path === '/'
  return route.path.startsWith(path)
}

const handleLinkClick = () => {
  // หากเป็นหน้าจอมือถือ/แท็บเล็ต ให้ปิด Drawer เมื่อคลิกลิงก์ แต่บน Desktop ให้เปิดค้างไว้ตามปกติ
  if (typeof window !== 'undefined' && window.innerWidth < 1024 && appStore.sidebarOpen) {
    appStore.sidebarOpen = false
  }
}
</script>

<template>
  <div class="flex-shrink-0">
    <!-- Backdrop สำหรับจอมือถือ/แท็บเล็ต เมื่อเปิด Drawer -->
    <div
      v-if="appStore.sidebarOpen"
      class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
      @click="appStore.sidebarOpen = false"
    ></div>

    <!-- Sidebar Container: ออกแบบให้เต็มความสูง 100% ไร้รอยต่อ ไม่มีช่องว่างแหว่งด้านล่าง -->
    <aside
      class="fixed lg:static top-0 z-40 h-screen lg:h-full bg-[#040e21]/95 backdrop-blur-xl border-r border-sky-500/25 transition-all duration-300 ease-in-out flex flex-col justify-between overflow-hidden shadow-2xl lg:shadow-none flex-shrink-0"
      :class="appStore.sidebarOpen
        ? 'w-64 translate-x-0 opacity-100'
        : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 opacity-0 pointer-events-none'"
    >
      <!-- กล่องด้านในคงความกว้าง 64 (256px) ไว้เพื่อไม่ให้เนื้อหาบีบตัวขณะอนิเมชันเปิด/ปิด -->
      <div class="w-64 h-full flex flex-col justify-between flex-shrink-0">
        <!-- Mobile Header in Drawer -->
        <div class="p-4 border-b border-sky-500/25 flex items-center justify-between lg:hidden bg-[#040e21]">
          <div class="flex items-center gap-2">
            <img src="/src/assets/png-isr.png" alt="ISR Logo" class="h-6 w-auto" />
            <span class="font-bold text-sm text-white font-prompt">SOIS เมนูระบบ</span>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sky-900/40 transition-colors"
            @click="appStore.sidebarOpen = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-6">
        <!-- Group 1: Operations -->
        <div>
          <h4 class="px-3 text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2.5 font-prompt">
            ระบบปฏิบัติการดาวเทียม
          </h4>
          <div class="space-y-1">
            <router-link
              v-for="item in mainLinks"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-150"
              :class="isActive(item.path)
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/30 ring-1 ring-cyan-300/40'
                : 'text-slate-200 hover:bg-sky-500/15 hover:text-white hover:border-l-2 hover:border-cyan-400'"
              @click="handleLinkClick"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" :class="isActive(item.path) ? 'text-white' : 'text-sky-300'" />
              <span>{{ item.label }}</span>
            </router-link>
          </div>
        </div>

        <!-- Group 2: System Logs & Audit -->
        <div>
          <h4 class="px-3 text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2.5 font-prompt">
            ประวัติและตรวจสอบ
          </h4>
          <div class="space-y-1">
            <router-link
              v-for="item in systemLinks"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-150"
              :class="isActive(item.path)
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/30 ring-1 ring-cyan-300/40'
                : 'text-slate-200 hover:bg-sky-500/15 hover:text-white hover:border-l-2 hover:border-cyan-400'"
              @click="handleLinkClick"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" :class="isActive(item.path) ? 'text-white' : 'text-sky-300'" />
              <span>{{ item.label }}</span>
            </router-link>
          </div>
        </div>

        <!-- Group 3: Administrator (Only for Admin role) -->
        <div v-if="authStore.isAdmin">
          <h4 class="px-3 text-xs sm:text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2.5 font-prompt">
            ผู้ดูแลระบบ (ADMIN)
          </h4>
          <div class="space-y-1">
            <router-link
              v-for="item in adminLinks"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-150"
              :class="isActive(item.path)
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/30 ring-1 ring-cyan-300/40'
                : 'text-slate-200 hover:bg-sky-500/15 hover:text-white hover:border-l-2 hover:border-cyan-400'"
              @click="handleLinkClick"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" :class="isActive(item.path) ? 'text-white' : 'text-sky-300'" />
              <span>{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Bottom Status Widget -->
      <div class="p-3 border-t border-sky-500/25 bg-[#030a17]/90">
        <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#061833] border border-sky-400/30 text-xs sm:text-sm shadow-xs">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></span>
          <span class="text-white font-bold">เชื่อมต่อศูนย์ควบคุม (ONLINE)</span>
        </div>
      </div>
      </div>
    </aside>
  </div>
</template>
