<script setup>
/**
 * ============================================================================
 * ไฟล์: src/components/layout/AppSidebar.vue
 * วัตถุประสงค์: แถบเมนูด้านข้าง (Sidebar Navigation) ธีมดำเทา Obsidian & Titanium
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
  <div
    class="flex-shrink-0 transition-all duration-300 ease-in-out h-full"
    :class="appStore.sidebarOpen ? 'w-64 lg:border-r lg:border-space-700 lg:bg-space-900/98' : 'w-0 border-r-0 overflow-hidden'"
  >
    <!-- Backdrop สำหรับจอมือถือ/แท็บเล็ต เมื่อเปิด Drawer -->
    <div
      v-if="appStore.sidebarOpen"
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
      @click="appStore.sidebarOpen = false"
    ></div>

    <!-- Sidebar Container: ออกแบบให้เด้งเข้าเด้งออกอย่างนุ่มนวลทั้งบน Desktop และ Mobile -->
    <aside
      class="fixed lg:sticky top-0 lg:top-16 z-40 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-space-900/98 backdrop-blur-md border-r border-space-700 transition-all duration-300 ease-in-out flex flex-col justify-between overflow-hidden shadow-2xl lg:shadow-none"
      :class="appStore.sidebarOpen
        ? 'translate-x-0 opacity-100'
        : '-translate-x-full lg:translate-x-0 opacity-0 pointer-events-none'"
    >
      <!-- กล่องด้านในคงความกว้าง 64 (256px) ไว้เพื่อไม่ให้เนื้อหาบีบตัวขณะอนิเมชันเปิด/ปิด -->
      <div class="w-64 h-full flex flex-col justify-between flex-shrink-0">
        <!-- Mobile Header in Drawer -->
        <div class="p-4 border-b border-space-700 flex items-center justify-between lg:hidden bg-space-850">
          <div class="flex items-center gap-2">
            <img src="/src/assets/png-isr.png" alt="ISR Logo" class="h-6 w-auto" />
            <span class="font-bold text-sm text-white font-prompt">SOIS เมนูระบบ</span>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-space-800 transition-colors"
            @click="appStore.sidebarOpen = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto p-3 space-y-6">
          <!-- Group 1: Operations -->
          <div>
            <h4 class="px-3 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 font-prompt">
              ระบบปฏิบัติการดาวเทียม
            </h4>
            <div class="space-y-1.5">
              <router-link
                v-for="item in mainLinks"
                :key="item.path"
                :to="item.path"
                class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 font-prompt group"
                :class="isActive(item.path)
                  ? 'bg-[#1b2b44] text-white font-bold border border-cyan-400/60 shadow-md shadow-cyan-950/40'
                  : 'text-slate-200 hover:bg-space-800 hover:text-white'"
                @click="handleLinkClick"
              >
                <component
                  :is="item.icon"
                  class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
                  :class="isActive(item.path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'"
                />
                <span>{{ item.label }}</span>
              </router-link>
            </div>
          </div>

          <!-- Group 2: System Logs & Audit -->
          <div>
            <h4 class="px-3 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 font-prompt">
              ประวัติและตรวจสอบ
            </h4>
            <div class="space-y-1.5">
              <router-link
                v-for="item in systemLinks"
                :key="item.path"
                :to="item.path"
                class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 font-prompt group"
                :class="isActive(item.path)
                  ? 'bg-[#1b2b44] text-white font-bold border border-cyan-400/60 shadow-md shadow-cyan-950/40'
                  : 'text-slate-200 hover:bg-space-800 hover:text-white'"
                @click="handleLinkClick"
              >
                <component
                  :is="item.icon"
                  class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
                  :class="isActive(item.path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'"
                />
                <span>{{ item.label }}</span>
              </router-link>
            </div>
          </div>

          <!-- Group 3: Administrator (Only for Admin role) -->
          <div v-if="authStore.isAdmin">
            <h4 class="px-3 text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 font-prompt">
              ผู้ดูแลระบบ (ADMIN)
            </h4>
            <div class="space-y-1.5">
              <router-link
                v-for="item in adminLinks"
                :key="item.path"
                :to="item.path"
                class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 font-prompt group"
                :class="isActive(item.path)
                  ? 'bg-[#1b2b44] text-white font-bold border border-cyan-400/60 shadow-md shadow-cyan-950/40'
                  : 'text-slate-200 hover:bg-space-800 hover:text-white'"
                @click="handleLinkClick"
              >
                <component
                  :is="item.icon"
                  class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
                  :class="isActive(item.path) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'"
                />
                <span>{{ item.label }}</span>
              </router-link>
            </div>
          </div>
        </nav>

        <!-- Bottom Status Widget -->
        <div class="p-3 border-t border-space-700 bg-space-950/60">
          <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-space-850 border border-space-700 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-slate-200 font-medium">เชื่อมต่อศูนย์ควบคุม</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
