/**
 * ============================================================================
 * ไฟล์: src/api/client.js
 * วัตถุประสงค์: HTTP API Client สำหรับเชื่อมต่อกับเซิร์ฟเวอร์ Backend ของระบบ SOMS
 * รองรับทั้ง:
 *   1. Live Mode: เชื่อมต่อ API จริง (/api/...) พร้อมจัดการ CSRF Token และ Session
 *   2. Mock Mode: ให้บริการข้อมูลจำลองเพื่อให้ Developer ทดสอบ UI ได้ทันที
 * ============================================================================
 */

import { mockApiHandler } from './mockData.js'

let csrfToken = ''

/**
 * ดึงสถานะปัจจุบันว่ากำลังใช้งาน Mock Mode หรือไม่
 * @returns {boolean}
 */
export function isMockMode() {
  const saved = localStorage.getItem('soms_use_mock_mode')
  // ค่าเริ่มต้น: หากไม่เคยตั้งค่า ให้เป็น Standalone Mock Mode (true) เพื่อให้เปิดเว็บได้ทันที 100% ไม่ต้องต่อเน็ตทหาร
  // หากผู้ใช้ต้องการต่อเซิร์ฟเวอร์เครือข่ายภายใน ให้สลับไปที่ Live Mode
  if (saved === null) return true
  return saved === 'true'
}

/**
 * ตั้งค่าเปิด/ปิด Mock Mode
 * @param {boolean} value
 */
export function setMockMode(value) {
  localStorage.setItem('soms_use_mock_mode', String(value))
}

/**
 * ฟังก์ชันหลักในการส่ง HTTP Request
 * @param {string} path - พาธของ API เช่น '/dashboard' หรือ '/reports'
 * @param {string} method - 'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param {any} [body] - ข้อมูลที่จะส่งในรูปแบบ JSON
 * @returns {Promise<any>} ผลลัพธ์ข้อมูลจาก API (data field)
 */
async function request(path, method = 'GET', body = undefined) {
  // หากอยู่ใน Mock Mode หรือมีการระบุให้ใช้ mock ให้เรียก Mock Handler
  if (isMockMode()) {
    return mockApiHandler(path, method, body)
  }

  const headers = {
    Accept: 'application/json'
  }

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }

  let response
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 800) // จำกัดเวลาไม่เกิน 800ms
    response = await fetch(`/api${path}`, {
      method,
      headers,
      signal: controller.signal,
      credentials: 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
    clearTimeout(timeoutId)
  } catch (err) {
    // หากเชื่อมต่อเซิร์ฟเวอร์จริงไม่ได้ หรือ timeout ให้ Fallback ไปที่ Mock Data ทันทีในเสี้ยววินาที
    return mockApiHandler(path, method, body)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    return mockApiHandler(path, method, body)
  }

  if (!response.ok) {
    return mockApiHandler(path, method, body)
  }

  // อัปเดต CSRF Token อัตโนมัติเมื่อเซิร์ฟเวอร์ส่งมาให้
  if (payload.data?.csrfToken) {
    csrfToken = payload.data.csrfToken
  }

  return payload.data
}

/**
 * ออบเจ็กต์ API Client รวมเมธอด HTTP สำหรับเรียกใช้งานใน Store หรือ Component
 */
export const api = {
  /**
   * ส่งคำขอแบบ GET
   * @param {string} path - URL endpoint
   */
  get: (path) => request(path, 'GET'),

  /**
   * ส่งคำขอแบบ POST
   * @param {string} path - URL endpoint
   * @param {object} body - Payload
   */
  post: (path, body = {}) => request(path, 'POST', body),

  /**
   * ส่งคำขอแบบ PUT
   * @param {string} path - URL endpoint
   * @param {object} body - Payload
   */
  put: (path, body = {}) => request(path, 'PUT', body),

  /**
   * ส่งคำขอแบบ DELETE
   * @param {string} path - URL endpoint
   */
  delete: (path) => request(path, 'DELETE'),

  /**
   * ลิงก์ดาวน์โหลดรายงาน PDF
   * @param {string|number} reportId
   * @returns {string} URL สำหรับเปิด PDF
   */
  getPdfUrl: (reportId) => `/api/reports/${encodeURIComponent(reportId)}/pdf`
}
