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
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-[#090b0f] via-[#10141b] to-[#171c26] text-slate-100 font-sans relative selection:bg-zinc-600 selection:text-white overflow-x-hidden">
    <!-- แถบเรืองแสงสีเงินไททาเนียมด้านบนสุด (Top Titanium Silver Gradient Accent Line) -->
    <div class="h-1 w-full bg-gradient-to-r from-zinc-600 via-slate-300 to-zinc-500 fixed top-0 left-0 right-0 z-50 pointer-events-none shadow-[0_0_12px_rgba(255,255,255,0.25)]"></div>

    <!-- แสงเรืองรองโทนดำเทา มิติสุขุม ล้ำสมัย (Ambient Stealth Titanium Radial Glows) -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-zinc-600/10 blur-[120px]"></div>
      <div class="absolute top-1/3 -left-32 w-[600px] h-[600px] rounded-full bg-slate-500/8 blur-[130px]"></div>
      <div class="absolute -bottom-32 right-1/4 w-[700px] h-[700px] rounded-full bg-neutral-600/10 blur-[140px]"></div>
    </div>

    <!-- Toast Notifications ลอยมุมขวาบน -->
    <ToastContainer />

    <!-- Global Command Palette (Ctrl+K) -->
    <CommandPalette v-model="appStore.commandPaletteOpen" />

    <!-- หน้าจอ Login / Setup Password แบบ Standalone Card -->
    <div v-if="isAuthPage" class="flex-1 flex flex-col relative z-10">
      <router-view />
    </div>

    <!-- โครงสร้างหน้าจอหลักของระบบ (Main Layout) -->
    <div v-else class="flex-1 flex flex-col min-h-screen relative z-10">
      <!-- Navbar ด้านบน (Sticky Top, Full Width) -->
      <AppNavbar />

      <!-- พื้นที่กลางเชื่อมต่อระหว่าง Navbar และ Footer -->
      <div class="flex-1 flex w-full min-h-0">
        <!-- Sidebar ด้านข้าง -->
        <AppSidebar />

        <!-- ส่วนแสดงผลเนื้อหาหลัก (Main Content: ขยายเต็มจอได้อย่างราบรื่นเมื่อยุบ Sidebar) -->
        <div class="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <main
            id="main"
            class="flex-1 p-3 sm:p-5 lg:p-6 w-full transition-all duration-300 pb-16 lg:pb-8"
            :class="route.name === 'Dashboard' ? 'max-w-none px-3 sm:px-5 lg:px-6' : 'max-w-7xl mx-auto'"
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
</style>
