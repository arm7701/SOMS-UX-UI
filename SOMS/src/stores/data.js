/**
 * ============================================================================
 * ไฟล์: src/stores/data.js
 * วัตถุประสงค์: Pinia Store สำหรับแคชข้อมูล Lookup พื้นฐาน (ดาวเทียม, ระบบย่อย,
 * รายการภารกิจ, ปัญหา, รายชื่อผู้ใช้) และฟังก์ชันตัวช่วยแปลงค่า (Formatters)
 * ============================================================================
 */

import { defineStore } from 'pinia'
import { api } from '@/api/client'
import { defaultSatellites, satelliteNameMap, passSequenceMap } from '@/config'

export const useDataStore = defineStore('data', {
  state: () => ({
    lookups: {
      satellites: [...defaultSatellites],
      subsystems: [],
      missions: [],
      troubles: [],
      users: []
    },
    loading: false
  }),

  actions: {
    /**
     * ดึงข้อมูล Lookup ทั้งหมดจากเซิร์ฟเวอร์
     */
    async fetchLookups() {
      this.loading = true
      try {
        const data = await api.get('/lookups')
        if (data) {
          this.lookups = {
            satellites: data.satellites?.length ? data.satellites : this.lookups.satellites,
            subsystems: data.subsystems || [],
            missions: data.missions || [],
            troubles: data.troubles || [],
            users: data.users || []
          }
        }
      } catch (err) {
        console.warn('โหลด lookups ไม่สำเร็จ:', err.message)
      } finally {
        this.loading = false
      }
    },

    /**
     * คืนค่าชื่อดาวเทียมจาก NORAD ID
     * @param {number|string} noradId
     * @returns {string} เช่น 'NAPA-1 N' หรือ 'NAPA-2 N'
     */
    getSatelliteName(noradId) {
      return satelliteNameMap[Number(noradId)] || `SAT-${noradId || '-'}`
    },

    /**
     * คืนค่าชื่อรอบพาส (Pass Sequence Name)
     * @param {number|string} seq
     * @returns {string} เช่น 'DayPass-1'
     */
    getPassName(seq) {
      return passSequenceMap[Number(seq)] || `Pass ${seq || '-'}`
    },

    /**
     * คืนค่าชื่อย่อ หรือชื่อเต็มของผู้ใช้งาน
     * @param {number|string} userId
     * @returns {string}
     */
    getUserDisplay(userId) {
      const u = this.lookups.users.find(item => String(item.rbac_id) === String(userId))
      return u?.rbac_shortname || u?.rbac_fullname || String(userId || '-')
    },

    /**
     * คืนค่าชื่อระบบย่อยจาก Subsystem ID
     * @param {number|string} subId
     * @returns {string}
     */
    getSubsystemName(subId) {
      const s = this.lookups.subsystems.find(item => String(item.sub_id) === String(subId))
      return s?.sub_name || String(subId || '-')
    }
  }
})
