<script setup>
/**
 * ============================================================================
 * ไฟล์: src/App.vue
 * วัตถุประสงค์: Root Component ของแอปพลิเคชัน
 * จัดการ Layout โครงสร้างหน้าจอ (Navbar, Sidebar, Main Content, Footer, Toasts)
 * พร้อมระบบจัดการธีมและสถานะการยืนยันตัวตน (Obsidian Charcoal & Titanium Slate)
 * ============================================================================
 */
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import CommandPalette from '@/components/common/CommandPalette.vue'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(() => {
  appStore.initTheme()
})

// ตรวจสอบว่าเป็นหน้า Login หรือหน้าตั้งรหัสผ่านหรือไม่ (ไม่ต้องแสดง Sidebar/Navbar)
const isAuthPage = computed(() => {
  return ['Login', 'SetupPassword'].includes(route.name)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-[#0a2342] via-[#103b6e] to-[#185396] text-slate-100 font-sans relative selection:bg-sky-500 selection:text-white overflow-x-hidden">
    <!-- แถบเรืองแสงสีฟ้าสว่างด้านบนสุด (Top Sky Gradient Accent Line) -->
    <div class="h-1 w-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 fixed top-0 left-0 right-0 z-50 pointer-events-none shadow-[0_0_16px_rgba(56,189,248,0.9)]"></div>

    <!-- แสงเรืองรองมืดฟ้าไล่สว่าง สว่างขึ้น มีชีวิตชีวา (Ambient Luminous Sky/Cyan Radial Glows) -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-sky-400/25 blur-[120px]"></div>
      <div class="absolute top-1/3 -left-32 w-[600px] h-[600px] rounded-full bg-blue-400/22 blur-[130px]"></div>
      <div class="absolute -bottom-32 right-1/4 w-[700px] h-[700px] rounded-full bg-cyan-400/20 blur-[140px]"></div>
    </div>

    <!-- Toast Notifications ลอยมุมขวาบน -->
    <ToastContainer />

    <!-- Global Command Palette (Ctrl+K) -->
    <CommandPalette v-model="appStore.commandPaletteOpen" />

    <!-- หน้าจอ Login / Setup Password แบบ Standalone Card -->
    <Transition name="auth-fade" mode="out-in">
      <div v-if="isAuthPage" key="auth-screen" class="flex-1 flex flex-col relative z-10">
        <router-view />
      </div>

      <!-- โครงสร้างหน้าจอหลักของระบบ (Main Layout) -->
      <div v-else key="main-screen" class="flex-1 flex flex-col min-h-screen relative z-10">
        <!-- Navbar ด้านบน (Sticky Top, Full Width) -->
        <AppNavbar />

        <!-- พื้นที่กลางเชื่อมต่อระหว่าง Navbar และ Footer -->
        <div class="flex-1 flex w-full min-h-0">
          <!-- Sidebar ด้านข้าง -->
          <AppSidebar />

          <!-- ส่วนแสดงผลเนื้อหาหลัก (Main Content: ขยายเต็มพื้นที่หน้าจอ 100% ไร้ขอบข้างเหลือทิ้ง รองรับมัลติแพลตฟอร์ม) -->
          <div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <main
              id="main"
              class="flex-1 p-3.5 sm:p-5 lg:p-6 xl:p-8 w-full max-w-none transition-all duration-300 pb-20 lg:pb-10"
            >
              <router-view v-slot="{ Component }">
                <Transition name="fade" mode="out-in">
                  <component :is="Component" />
                </Transition>
              </router-view>
            </main>
          </div>
        </div>

        <!-- Footer ด้านล่างสุด เต็มความกว้างหน้าจอ (100% Full-Width Grounding Footer) -->
        <AppFooter class="pb-16 lg:pb-0" />

        <!-- แถบเมนูด้านล่างสำหรับจอมือถือ (Mobile Bottom Dock) -->
        <MobileBottomNav />
      </div>
    </Transition>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* รอยต่อระหว่างหน้าจอ Login และ Dashboard ให้สมูท นุ่มนวล ไร้รอยต่อ */
.auth-fade-enter-active {
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.auth-fade-leave-active {
  transition: opacity 0.3s ease-in;
}
.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}
</style>
