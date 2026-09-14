/**
 * ============================================================================
 * ไฟล์: src/config/apiEndpoints.js
 * วัตถุประสงค์: รวมรายการ API Endpoints ทั้งหมดของระบบ (API Endpoints Dictionary)
 * ----------------------------------------------------------------------------
 * 💡 คำแนะนำสำหรับ Developer:
 * เมื่อต้องการเชื่อมต่อหรือเรียกใช้งาน API แต่ละเส้น สามารถอ้างอิง URL และ Method จากที่นี่ได้
 * ============================================================================
 */

export const API_ENDPOINTS = {
  // 1. ระบบยืนยันตัวตน (Authentication)
  AUTH: {
    LOGIN: { path: '/auth/login', method: 'POST', desc: 'เข้าสู่ระบบ (Username & Password)' },
    LOGOUT: { path: '/auth/logout', method: 'POST', desc: 'ออกจากระบบ' },
    SETUP_PASSWORD: { path: '/auth/setup-password', method: 'POST', desc: 'ตั้งรหัสผ่านใหม่ (ครั้งแรก/รีเซ็ต)' }
  },

  // 2. ข้อมูลหลักและแดชบอร์ด (Core & Dashboard)
  DASHBOARD: {
    GET_ALL: { path: '/dashboard', method: 'GET', desc: 'ดึงข้อมูลภาพรวมแดชบอร์ดทั้งหมด' }
  },
  LOOKUPS: {
    GET_ALL: { path: '/lookups', method: 'GET', desc: 'ดึงข้อมูลแคชพื้นฐาน (ดาวเทียม, ระบบย่อย, ผู้ใช้)' }
  },

  // 3. แผนพาสและการโคจร (Passes & Orbits)
  PASSES: {
    GET_LIST: { path: '/passes', method: 'GET', desc: 'ดึงตารางรอบพาสผ่านดาวเทียม' }
  },
  SATELLITES: {
    GET_ALTITUDE: { path: '/satellite-data', method: 'GET', desc: 'ดึงข้อมูลระดับความสูง NAPA-1/2' }
  },
  SPACE_WEATHER: {
    GET_DATA: { path: '/space-weather', method: 'GET', desc: 'ดึงข้อมูลสภาพอวกาศ R, S, G Scale' }
  },

  // 4. การจัดการเวร (Operations Duty)
  OPERATIONS: {
    GET_MONTH: { path: '/operations', method: 'GET', desc: 'ดึงตารางเวรตามเดือนและปี' },
    ADD_DUTY: { path: '/operations', method: 'POST', desc: 'บันทึกเวรใหม่' },
    UPDATE_DUTY: { path: '/operations', method: 'PUT', desc: 'แก้ไขข้อมูลเวร' },
    DELETE_DUTY: { path: '/operations', method: 'DELETE', desc: 'ลบข้อมูลเวร' }
  },

  // 5. รายงานภารกิจ (Mission Reports)
  REPORTS: {
    GET_LIST: { path: '/reports', method: 'GET', desc: 'ดึงรายการรายงานภารกิจทั้งหมด' },
    GET_DETAIL: { path: '/reports/:id', method: 'GET', desc: 'ดึงรายละเอียดรายงานฉบับเต็ม' },
    CREATE: { path: '/reports', method: 'POST', desc: 'สร้างรายงานภารกิจใหม่' },
    DELETE: { path: '/reports/:id', method: 'DELETE', desc: 'ลบรายงานภารกิจ' }
  },

  // 6. บันทึกประวัติและระบบย่อย (Logs & Audit)
  LOGS: {
    GET_LIST: { path: '/logs', method: 'GET', desc: 'ดึงประวัติ Audit และ Activity Logs' }
  },

  // 7. ส่วนผู้ดูแลระบบ (Admin CRUD)
  ADMIN: {
    USERS: { path: '/users', desc: 'จัดการรายชื่อผู้ใช้และสิทธิ์' },
    MISSIONS: { path: '/missions', desc: 'จัดการประเภทภารกิจ' },
    TROUBLES: { path: '/troubles', desc: 'จัดการปัญหาและระบบย่อย' }
  }
}
