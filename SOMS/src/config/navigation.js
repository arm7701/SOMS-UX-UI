/**
 * ============================================================================
 * ไฟล์: src/config/navigation.js
 * วัตถุประสงค์: ศูนย์รวมการตั้งค่าเมนูนำทางทั้งหมดของระบบ (Central Navigation Config)
 * ----------------------------------------------------------------------------
 * 💡 คำแนะนำสำหรับ Developer:
 * หากต้องการ "เพิ่มเมนูใหม่", "แก้ไขชื่อเมนู", หรือ "เปลี่ยนไอคอน":
 * 1. นำเข้าไอคอนจาก 'lucide-vue-next'
 * 2. เพิ่มรายการในอาร์เรย์ที่ต้องการ:
 *    - mainLinks: เมนูหลักสำหรับเจ้าหน้าที่ปฏิบัติการทั่วไป
 *    - systemLinks: เมนูประวัติและบันทึกระบบ
 *    - adminLinks: เมนูเฉพาะผู้ดูแลระบบ (Admin)
 *    - mobileNavItems: เมนูลัด 4 ปุ่มบนแถบลอยด้านล่างของหน้าจอมือถือ
 * 3. อย่าลืมสร้าง View ใน src/views/ และลงทะเบียน Route ใน src/router/index.js
 * ============================================================================
 */

import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  Compass,
  SunMedium,
  Users,
  FileText,
  History,
  Target,
  AlertOctagon,
  ShieldCheck
} from 'lucide-vue-next'

/**
 * 1. เมนูหลักสำหรับเจ้าหน้าที่ปฏิบัติการ (Operational Menus)
 */
export const mainLinks = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    label: 'ภาพรวมระบบ (Dashboard)',
    icon: LayoutDashboard,
    description: 'สรุปสถานะดาวเทียม สภาพอวกาศ รอบพาส และโทรมาตร'
  },
  {
    name: 'Passes',
    path: '/passes',
    label: 'แผนผ่านดาวเทียม (Pass Detail)',
    icon: CalendarDays,
    description: 'ตารางคำนวณรอบพาส เวลา AOS/LOS และมุมยก'
  },
  {
    name: 'OrbitalAltitude',
    path: '/satellite-data',
    label: 'ระดับความสูงวงโคจร (Altitude)',
    icon: LineChart,
    description: 'ระดับความสูงวงโคจรเปรียบเทียบ NAPA-1 และ NAPA-2'
  },
  {
    name: 'Planner',
    path: '/planner',
    label: 'วางแผนพาส (SAT PASS PLANNER)',
    icon: Compass,
    description: 'เครื่องมือจำลองมุมถ่ายภาพ แผนที่ Leaflet และพิกัดเป้าหมาย'
  },
  {
    name: 'SpaceWeather',
    path: '/space-weather',
    label: 'สภาพอวกาศ (Space Weather)',
    icon: SunMedium,
    description: 'ดัชนี R, S, G Scale ตามมาตรฐาน NOAA'
  },
  {
    name: 'Operations',
    path: '/operations',
    label: 'ตารางผู้ปฏิบัติเวร (Operator List)',
    icon: Users,
    description: 'ปฏิทินเวรปฏิบัติการ MD, FMO และ GSO'
  },
  {
    name: 'Reports',
    path: '/reports',
    label: 'รายงานภารกิจ (Reports)',
    icon: FileText,
    description: 'บันทึกและจัดพิมพ์รายงานผลการปฏิบัติการ'
  }
]

/**
 * 2. เมนูระบบและประวัติ (System & History Menus)
 */
export const systemLinks = [
  {
    name: 'Logs',
    path: '/logs',
    label: 'บันทึกกิจกรรม (Activity Logs)',
    icon: History,
    description: 'Audit trail และ Activity logs ของระบบ'
  }
]

/**
 * 3. เมนูสำหรับผู้ดูแลระบบ (Admin Only Menus)
 */
export const adminLinks = [
  {
    name: 'Missions',
    path: '/missions',
    label: 'จัดการภารกิจ (Missions)',
    icon: Target,
    description: 'กำหนดหมวดหมู่และประเภทภารกิจดาวเทียม'
  },
  {
    name: 'Troubles',
    path: '/troubles',
    label: 'ปัญหา/ข้อขัดข้อง (Troubles)',
    icon: AlertOctagon,
    description: 'จัดการระบบย่อย ADCS, EPS, COMM, OBP และข้อผิดพลาด'
  },
  {
    name: 'Users',
    path: '/users',
    label: 'จัดการผู้ใช้งาน (User Management)',
    icon: ShieldCheck,
    description: 'จัดการสิทธิ์ บัญชีผู้ปฏิบัติการ และรีเซ็ตรหัสผ่าน'
  }
]

/**
 * 4. เมนูลัดแถบล่างสำหรับสมาร์ตโฟน (Mobile Bottom Dock Items - แสดง 4 เมนูหลัก)
 */
export const mobileNavItems = [
  { name: 'Dashboard', path: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { name: 'Passes', path: '/passes', label: 'แผนพาส', icon: CalendarDays },
  { name: 'Planner', path: '/planner', label: 'วางแผน', icon: Compass },
  { name: 'Reports', path: '/reports', label: 'รายงาน', icon: FileText }
]
