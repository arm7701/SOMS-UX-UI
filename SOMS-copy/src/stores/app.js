/**
 * ============================================================================
 * ไฟล์: src/stores/app.js
 * วัตถุประสงค์: Pinia Store สำหรับจัดการ UI State ส่วนกลาง เช่น การสลับธีม (Light/Dark),
 * เมนูด้านข้าง (Sidebar), โหมด Mock Data และการแสดง Toast Notification
 * ============================================================================
 */

import { defineStore } from 'pinia'
import { isMockMode, setMockMode } from '@/api/client'

export const useAppStore = defineStore('app', {
  state: () => ({
    /** @type {boolean} สถานะธีม: ล็อกเป็นโทนมืดฟ้าไล่สว่างคงที่ 100% ตามความต้องการของผู้ใช้ */
    isDark: true,
    /** @type {boolean} สถานะเปิด/ปิด Sidebar (เด้งเข้า/เด้งออก) รองรับทั้งจอมือถือและเดสก์ท็อป */
    sidebarOpen: localStorage.getItem('soms_sidebar') !== 'false',
    /** @type {boolean} สถานะเปิด/ปิด Mock Data สำหรับ Dev และพรีวิว */
    mockMode: isMockMode(),
    /** @type {number} รอบการรีเฟรชข้อมูลอัตโนมัติ (วินาที: 0 = ปิด, 30, 60, 300) */
    autoRefreshSeconds: Number(localStorage.getItem('soms_auto_refresh') || 0),
    /** @type {number} ตัวนับ trigger การรีเฟรช เพื่อให้ทุกหน้าจอตรวจจับและรีเฟรชข้อมูล */
    refreshTrigger: 0,
    /** @type {Date} เวลาที่รีเฟรชข้อมูลล่าสุด */
    lastRefreshTime: new Date(),
    /** @type {boolean} สถานะเปิด/ปิด Command Palette (Ctrl+K) */
    commandPaletteOpen: false,
    /** @type {boolean} สถานะเปิด/ปิดเสียงเตือนรอบพาส (Audio Alerts) */
    audioAlertsEnabled: localStorage.getItem('soms_audio_alerts') === 'true',
    /** @type {Array<{id: number, type: string, title: string, message: string}>} รายการ Toast */
    toasts: []
  }),

  actions: {
    /**
     * ล็อกธีมเป็นโทนมืดฟ้าไล่สว่างคงที่ 100%
     */
    toggleTheme() {
      this.isDark = true
      document.documentElement.classList.add('dark')
    },

    /**
     * เริ่มต้นการทำงานของธีม: บังคับใช้โทนมืดฟ้าไล่สว่าง (Dark Navy into Radiant Luminous Sky)
     */
    initTheme() {
      this.isDark = true
      document.documentElement.classList.add('dark')
      localStorage.setItem('soms_theme', 'dark')
    },

    /**
     * สลับการเปิด/ปิด Sidebar (เด้งเข้า/เด้งออก) ด้วยปุ่มสามขีด
     */
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      localStorage.setItem('soms_sidebar', String(this.sidebarOpen))
    },

    /**
     * สลับโหมด Mock Data สำหรับ Developer
     */
    toggleMockMode() {
      this.mockMode = !this.mockMode
      setMockMode(this.mockMode)
      this.showToast(
        this.mockMode ? 'โหมดจำลอง (Mock Mode)' : 'โหมดเชื่อมต่อจริง (Live Mode)',
        this.mockMode ? 'เปิดใช้งานข้อมูลตัวอย่างเพื่อการทดสอบ UI' : 'กำลังเชื่อมต่อไปยังเซิร์ฟเวอร์จริง',
        'info'
      )
    },

    /**
     * แสดงการแจ้งเตือน Pop-up (Toast Notification)
     * @param {string} title - หัวข้อ
     * @param {string} message - ข้อความ
     * @param {'success'|'error'|'warning'|'info'} [type='success']
     */
    showToast(title, message, type = 'success') {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, title, message, type })
      // ซ่อนอัตโนมัติหลังจาก 4 วินาที
      setTimeout(() => {
        this.removeToast(id)
      }, 4000)
    },

    /**
     * ปิดการแจ้งเตือนตาม ID
     * @param {number} id
     */
    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    },

    /**
     * กำหนดรอบเวลารีเฟรชข้อมูลอัตโนมัติ (0, 30, 60, 300 วินาที)
     * @param {number} seconds
     */
    setAutoRefresh(seconds) {
      this.autoRefreshSeconds = Number(seconds)
      localStorage.setItem('soms_auto_refresh', String(seconds))
      if (seconds > 0) {
        this.showToast('เปิดการอัปเดตอัตโนมัติ', `ระบบจะดึงข้อมูลใหม่ทุกๆ ${seconds >= 60 ? (seconds / 60) + ' นาที' : seconds + ' วินาที'}`, 'info')
      } else {
        this.showToast('ปิดการอัปเดตอัตโนมัติ', 'เปลี่ยนเป็นโหมดรีเฟรชด้วยตนเอง', 'info')
      }
    },

    /**
     * ส่งสัญญาณให้ทุกหน้าจอดึงข้อมูลใหม่ทันที
     */
    triggerRefresh() {
      this.refreshTrigger++
      this.lastRefreshTime = new Date()
    },

    /**
     * สลับการเปิด/ปิดเสียงแจ้งเตือนรอบพาส (Audio Alerts)
     */
    toggleAudioAlerts() {
      this.audioAlertsEnabled = !this.audioAlertsEnabled
      localStorage.setItem('soms_audio_alerts', String(this.audioAlertsEnabled))
      if (this.audioAlertsEnabled) {
        this.playAosAlert()
        this.showToast('เปิดเสียงเตือน AOS', 'ระบบจะส่งเสียงเตือนเมื่อดาวเทียมใกล้ถึงและเริ่มพาส', 'info')
      } else {
        this.showToast('ปิดเสียงเตือน AOS', 'ปิดเสียงเตือนเรียบร้อยแล้ว', 'info')
      }
    },

    /**
     * ส่งเสียง Chime เตือนเมื่อรอบพาสเริ่มขึ้น (Web Audio API Synthesizer)
     */
    playAosAlert() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        const audioCtx = new AudioCtx()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45)

        osc.connect(gain)
        gain.connect(audioCtx.destination)

        osc.start()
        osc.stop(audioCtx.currentTime + 0.45)
      } catch (err) {
        console.warn('Audio alert error:', err)
      }
    }
  }
})
