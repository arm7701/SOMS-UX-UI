/**
 * ============================================================================
 * ไฟล์: src/stores/auth.js
 * วัตถุประสงค์: Pinia Store สำหรับจัดการสถานะการยืนยันตัวตน (Authentication),
 * สิทธิ์ผู้ใช้งาน (Roles/Permissions) และการเข้า/ออกจากระบบ
 * ============================================================================
 */

import { defineStore } from 'pinia'
import { api } from '@/api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {object|null} ข้อมูลผู้ใช้งานปัจจุบัน เช่น { rbac_id, rbac_fullname, rbac_role, ... } */
    user: null,
    /** @type {boolean} กำลังตรวจสอบ Session หรือกำลังล็อกอินอยู่หรือไม่ */
    loading: true,
    /** @type {boolean} ผู้ใช้ต้องเปลี่ยนรหัสผ่านก่อนเข้าใช้งานหรือไม่ */
    setupRequired: false,
    /** @type {string|null} ข้อความแจ้งเตือนข้อผิดพลาดล่าสุด */
    error: null
  }),

  getters: {
    /**
     * ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
     * @returns {boolean}
     */
    isAuthenticated: (state) => Boolean(state.user && !state.setupRequired),

    /**
     * ตรวจสอบว่าเป็นผู้ดูแลระบบ (Admin) หรือไม่
     * ในระบบเดิม Account ID 14 หรือ username 'developer' จะได้สิทธิ์เข้าถึงเมนู ADMIN
     * @returns {boolean}
     */
    isAdmin: (state) => {
      if (!state.user) return false
      return Number(state.user.rbac_id) === 14 || state.user.rbac_username === 'developer'
    },

    /**
     * ดึงชื่อและยศเต็มของผู้ใช้
     * @returns {string}
     */
    displayName: (state) => state.user?.rbac_fullname || state.user?.rbac_username || 'ผู้ปฏิบัติงาน',

    /**
     * หน้าที่ของผู้ใช้งาน (MD: Mission Director, FMO, GSO)
     * @returns {string}
     */
    userRole: (state) => state.user?.rbac_role || '-'
  },

  actions: {
    /**
     * ตรวจสอบ Session ปัจจุบันกับ Backend
     */
    async checkSession() {
      this.loading = true
      this.error = null
      try {
        const session = await api.get('/auth/session')
        this.user = session.user || null
        this.setupRequired = Boolean(session.setupRequired)
      } catch (err) {
        console.warn('ไม่สามารถดึง Session ได้:', err.message)
        this.user = null
      } finally {
        this.loading = false
      }
    },

    /**
     * เข้าสู่ระบบด้วย Username และ Password
     * @param {string} username - ชื่อผู้ใช้ (ไม่ต้องใส่ @rtaf.mi.th)
     * @param {string} password - รหัสผ่าน
     */
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const result = await api.post('/auth/login', { username, password })
        this.user = result.user
        this.setupRequired = Boolean(result.setupRequired)
        return result
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * ตั้งรหัสผ่านใหม่ (สำหรับกรณีผู้ใช้ใหม่ หรือถูกแอดมินรีเซ็ตรหัสผ่าน)
     * @param {string} password - รหัสผ่านใหม่
     */
    async setupPassword(password) {
      this.loading = true
      this.error = null
      try {
        const result = await api.post('/auth/setup-password', { password })
        this.user = result.user
        this.setupRequired = false
        return result
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * ออกจากระบบ (Logout)
     */
    async logout() {
      this.loading = true
      try {
        await api.post('/auth/logout')
      } catch (err) {
        console.warn('Logout warning:', err.message)
      } finally {
        this.user = null
        this.setupRequired = false
        this.loading = false
      }
    }
  }
})
