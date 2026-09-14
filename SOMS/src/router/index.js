/**
 * ============================================================================
 * ไฟล์: src/router/index.js
 * วัตถุประสงค์: ระบบกำหนดเส้นทาง (Vue Router 4) และระบบตรวจสอบสิทธิ์ (Route Guard)
 * แยกไฟล์หน้าจอชัดเจน มีการตรวจสอบสิทธิ์ Admin และจัดการ Session อย่างปลอดภัย
 * ============================================================================
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'ภาพรวมระบบ' }
  },
  {
    path: '/passes',
    name: 'Passes',
    component: () => import('@/views/PassesView.vue'),
    meta: { requiresAuth: true, title: 'แผนการผ่านดาวเทียม' }
  },
  {
    path: '/satellite-data',
    name: 'OrbitalAltitude',
    component: () => import('@/views/OrbitalAltitudeView.vue'),
    meta: { requiresAuth: true, title: 'ระดับความสูงวงโคจร' }
  },
  {
    path: '/planner',
    name: 'Planner',
    component: () => import('@/views/SatPassPlannerView.vue'),
    meta: { requiresAuth: true, title: 'SAT PASS PLANNER' }
  },
  {
    path: '/space-weather',
    name: 'SpaceWeather',
    component: () => import('@/views/SpaceWeatherView.vue'),
    meta: { requiresAuth: true, title: 'สภาพอวกาศ' }
  },
  {
    path: '/operations',
    name: 'Operations',
    component: () => import('@/views/OperationsView.vue'),
    meta: { requiresAuth: true, title: 'ตารางผู้ปฏิบัติเวร' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/ReportsView.vue'),
    meta: { requiresAuth: true, title: 'รายงานภารกิจดาวเทียม' }
  },
  {
    path: '/reports/new',
    name: 'ReportCreate',
    component: () => import('@/views/ReportCreateView.vue'),
    meta: { requiresAuth: true, title: 'สร้างรายงานภารกิจใหม่' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/LogsView.vue'),
    meta: { requiresAuth: true, title: 'บันทึกกิจกรรมระบบ' }
  },
  // เมนูเฉพาะผู้ดูแลระบบ (Admin)
  {
    path: '/missions',
    name: 'Missions',
    component: () => import('@/views/MissionsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'จัดการภารกิจ' }
  },
  {
    path: '/troubles',
    name: 'Troubles',
    component: () => import('@/views/TroublesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'ปัญหาและระบบย่อย' }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, title: 'จัดการผู้ใช้งาน' }
  },
  // เส้นทางยืนยันตัวตน
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'เข้าสู่ระบบ' }
  },
  {
    path: '/setup-password',
    name: 'SetupPassword',
    component: () => import('@/views/SetupPasswordView.vue'),
    meta: { title: 'ตั้งรหัสผ่าน' }
  },
  // กรณีพิมพ์ URL ไม่ถูกต้อง ให้ย้อนกลับหน้าแรก
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

let sessionChecked = false

// Navigation Guard: ตรวจสอบสิทธิ์การเข้าถึงแต่ละหน้า
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // ตรวจสอบ Session เมื่อเปิดเว็บครั้งแรก
  if (!sessionChecked) {
    await authStore.checkSession()
    sessionChecked = true
  }

  // อัปเดต Title ของเบราว์เซอร์
  document.title = to.meta.title
    ? `${to.meta.title} - Satellite Operations Information System`
    : 'Satellite Operations Information System'

  // กรณีผู้ใช้ต้องตั้งรหัสผ่านใหม่
  if (authStore.setupRequired && to.path !== '/setup-password') {
    return next('/setup-password')
  }

  // หน้าที่ต้องล็อกอินก่อนเข้า
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // หน้าสำหรับผู้ใช้ที่ยังไม่ล็อกอินเท่านั้น (เช่น หน้า Login)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  // หน้าเฉพาะ Admin เท่านั้น
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/dashboard')
  }

  next()
})
