/**
 * ============================================================================
 * ไฟล์: src/api/mockData.js
 * วัตถุประสงค์: ชุดข้อมูลจำลอง (Mock Data) และ Mock API Handler สำหรับระบบ SOMS
 * รองรับการทดสอบทุกหน้าจอแบบออฟไลน์/สแตนด์อโลน พร้อมคำอธิบายฟิลด์ข้อมูล
 * ============================================================================
 */

export const mockUsers = [
  {
    rbac_id: 14,
    rbac_fullname: 'น.ต. สมชาย ดวงดาว',
    rbac_shortname: 'สมชาย',
    rbac_position: 'นายทหารควบคุมภารกิจ',
    rbac_username: 'developer',
    rbac_role: 'MD',
    rbac_status: 'Active',
    rbac_duty: 'หัวหน้าชุดปฏิบัติการที่ 1',
    rbac_comments: 'ผู้ดูแลระบบหลัก',
    has_password: true
  },
  {
    rbac_id: 15,
    rbac_fullname: 'ร.อ. ธีระศักดิ์ นภาลัย',
    rbac_shortname: 'ธีระศักดิ์',
    rbac_position: 'วิศวกรดาวเทียม',
    rbac_username: 'theerasak',
    rbac_role: 'FMO',
    rbac_status: 'Active',
    rbac_duty: 'ควบคุมระบบการบินและอุณหภูมิ',
    rbac_comments: '-',
    has_password: true
  },
  {
    rbac_id: 16,
    rbac_fullname: 'ร.ท. อนันต์ วงศ์สวรรค์',
    rbac_shortname: 'อนันต์',
    rbac_position: 'เจ้าหน้าที่สถานีภาคพื้น',
    rbac_username: 'anan',
    rbac_role: 'GSO',
    rbac_status: 'Active',
    rbac_duty: 'ควบคุมเสาอากาศและระบบสื่อสาร',
    rbac_comments: '-',
    has_password: true
  },
  {
    rbac_id: 17,
    rbac_fullname: 'พ.อ.อ. วิทย์ อวกาศกิจ',
    rbac_shortname: 'วิทย์',
    rbac_position: 'ช่างเทคนิคโทรมาตร',
    rbac_username: 'wit',
    rbac_role: 'GSO',
    rbac_status: 'Active',
    rbac_duty: 'ตรวจสอบอุปกรณ์ RF',
    rbac_comments: '-',
    has_password: false
  },
  {
    rbac_id: 18,
    rbac_fullname: 'ร.ต. กฤษดา ศรีนภา',
    rbac_shortname: 'กฤษดา',
    rbac_position: 'ผู้ช่วยนายทหารปฏิบัติการ',
    rbac_username: 'kritsada',
    rbac_role: 'FMO',
    rbac_status: 'Notactive',
    rbac_duty: '-',
    rbac_comments: 'อยู่ระหว่างลาอบรม',
    has_password: true
  }
]

export const mockSubsystems = [
  { sub_id: 1, sub_name: 'ADCS (ระบบควบคุมท่าทางและวงโคจร)' },
  { sub_id: 2, sub_name: 'EPS (ระบบไฟฟ้าและพลังงานแสงอาทิตย์)' },
  { sub_id: 3, sub_name: 'COMM (ระบบรับ-ส่งสัญญาณวิทยุสื่อสาร)' },
  { sub_id: 4, sub_name: 'OBDH / OBP (ระบบประมวลผลบนดาวเทียม)' },
  { sub_id: 5, sub_name: 'PAYLOAD (กล้องถ่ายภาพความละเอียดสูง)' },
  { sub_id: 6, sub_name: 'TCS (ระบบควบคุมอุณหภูมิความร้อน)' }
]

export const mockMissions = [
  {
    mission_id: 1,
    mission_name: 'Housekeeping Telemetry Acquisition',
    mission_note: 'ดาวน์โหลดข้อมูลสถานะระบบดาวเทียม (HK) ประจำพาส'
  },
  {
    mission_id: 2,
    mission_name: 'Target Observation Imaging (Session ID)',
    mission_note: 'บันทึกภาพถ่ายดาวเทียมพื้นที่เป้าหมายยุทธการ'
  },
  {
    mission_id: 3,
    mission_name: 'ADCS Detumbling & Sun Pointing Check',
    mission_note: 'ตรวจสอบการทรงตัวและการหันแผงโซลาร์เข้าหาดวงอาทิตย์'
  },
  {
    mission_id: 4,
    mission_name: 'Battery Reconditioning & Thermal Check',
    mission_note: 'ปรับสมดุลแรงดันแบตเตอรี่ Li-ion และตรวจสอบฮีตเตอร์'
  },
  {
    mission_id: 5,
    mission_name: 'Payload High-Speed X-Band Downlink',
    mission_note: 'ถ่ายโอนข้อมูลภาพถ่ายความเร็วสูงลงสถานีรับสัญญาณ'
  }
]

export const mockTroubles = [
  {
    trouble_id: 1,
    sub_id: 3,
    trouble_name: 'RF Signal Weak During AOS Transition',
    trouble_note: 'ระดับความแรงสัญญาณวิทยุต่ำกว่าเกณฑ์ช่วงมุมยกต่ำ'
  },
  {
    trouble_id: 2,
    sub_id: 1,
    trouble_name: 'Star Tracker Occultation by Earth Albedo',
    trouble_note: 'เซ็นเซอร์ระบุตำแหน่งดาวหลุดล็อกเนื่องจากแสงสะท้อนโลก'
  },
  {
    trouble_id: 3,
    sub_id: 2,
    trouble_name: 'Solar Array Temperature Anomaly (+45C)',
    trouble_note: 'อุณหภูมิแผงเซลล์แสงอาทิตย์สูงกว่าค่าปกติขณะพ้นเงาโลก'
  },
  {
    trouble_id: 4,
    sub_id: 4,
    trouble_name: 'OBP Watchdog Timer Reset Log Detected',
    trouble_note: 'พบประวัติรีเซ็ตตัวเองของหน่วยประมวลผลจากรังสีคอสมิก'
  }
]

export const mockPasses = [
  {
    id: 101,
    satellite_id: 46320,
    sat_name: 'NAPA-1 N',
    aos_date_utc: '2026-09-11',
    aos_time_utc: '03:15:20',
    los_date_utc: '2026-09-11',
    los_time_utc: '03:26:45',
    aos_date_local: '2026-09-11',
    aos_time_local: '10:15:20',
    los_date_local: '2026-09-11',
    los_time_local: '10:26:45',
    duration_min: 11,
    duration_sec: 25,
    maxEl: 68.4,
    sat_seq: 1,
    comments: 'DayPass-1 สัญญาณสมบูรณ์'
  },
  {
    id: 102,
    satellite_id: 46320,
    sat_name: 'NAPA-1 N',
    aos_date_utc: '2026-09-11',
    aos_time_utc: '04:52:10',
    los_date_utc: '2026-09-11',
    los_time_utc: '05:01:30',
    aos_date_local: '2026-09-11',
    aos_time_local: '11:52:10',
    los_date_local: '2026-09-11',
    los_time_local: '12:01:30',
    duration_min: 9,
    duration_sec: 20,
    maxEl: 24.1,
    sat_seq: 2,
    comments: 'DayPass-2 พาสมุมต่ำ'
  },
  {
    id: 103,
    satellite_id: 48963,
    sat_name: 'NAPA-2 N',
    aos_date_utc: '2026-09-11',
    aos_time_utc: '06:10:00',
    los_date_utc: '2026-09-11',
    los_time_utc: '06:22:15',
    aos_date_local: '2026-09-11',
    aos_time_local: '13:10:00',
    los_date_local: '2026-09-11',
    los_time_local: '13:22:15',
    duration_min: 12,
    duration_sec: 15,
    maxEl: 82.5,
    sat_seq: 1,
    comments: 'DayPass-1 พาสมุมสูงมาก (Overhead)'
  },
  {
    id: 104,
    satellite_id: 48963,
    sat_name: 'NAPA-2 N',
    aos_date_utc: '2026-09-11',
    aos_time_utc: '15:40:00',
    los_date_utc: '2026-09-11',
    los_time_utc: '15:49:50',
    aos_date_local: '2026-09-11',
    aos_time_local: '22:40:00',
    los_date_local: '2026-09-11',
    los_time_local: '22:49:50',
    duration_min: 9,
    duration_sec: 50,
    maxEl: 3.8,
    sat_seq: 3,
    comments: 'มุมยกต่ำกว่า 5 องศา (Abort)'
  }
]

export const mockReports = [
  {
    report_id: 1,
    sat_flight_pass: '104/2026',
    norad_id: 48963,
    sat_seq: 1,
    sat_report_date: '2026-09-11',
    sat_pass_aos: '06:10:00',
    sat_pass_los: '06:22:15',
    sat_pass_duration_min: 12,
    sat_pass_duration_sec: 15,
    sat_max_el: 82.5,
    sat_md: 14,
    sat_fmo: 15,
    sat_gso: 16,
    rbac_id: 14,
    sat_gsostatus: 'Normal',
    sat_mcs: 'Active',
    sat_pdhufreespace: '48.5',
    sat_lastimg: '1942',
    approaching: 1,
    sat_next_pass: 'ตรวจสอบสถานะการชาร์จแบตเตอรี่ในพาสถัดไป',
    sat_note: 'การรับส่งข้อมูลสมบูรณ์ 100% ภาพถ่ายคมชัด',
    altitude_km: 508.82,
    orbit_epoch_date: '2026-09-11',
    orbit_epoch_time: '06:00:00',
    inclination_deg: 97.45,
    orbital_period_min: 94.6,
    velocity_km_s: 7.61,
    orbit_fetched_at: '2026-09-11 06:05:00 UTC',
    missions: [
      { mission_id: 1, mission_name: 'Housekeeping Telemetry Acquisition', logmission_name: 'กวาดข้อมูลครบทุกสถานี', logmission_result: 'เรียบร้อย' },
      { mission_id: 2, mission_name: 'Target Observation Imaging', logmission_name: 'ถ่ายภาพพื้นที่ กทม. และปริมณฑล', logmission_result: 'เรียบร้อย' }
    ],
    troubles: []
  },
  {
    report_id: 2,
    sat_flight_pass: '103/2026',
    norad_id: 46320,
    sat_seq: 1,
    sat_report_date: '2026-09-11',
    sat_pass_aos: '03:15:20',
    sat_pass_los: '03:26:45',
    sat_pass_duration_min: 11,
    sat_pass_duration_sec: 25,
    sat_max_el: 68.4,
    sat_md: 14,
    sat_fmo: 15,
    sat_gso: 16,
    rbac_id: 14,
    sat_gsostatus: 'Normal',
    sat_mcs: 'Active',
    sat_pdhufreespace: '32.1',
    sat_lastimg: '1939',
    approaching: 1,
    sat_next_pass: 'จัดเตรียมแผนถ่ายภาพช่วงบ่าย',
    sat_note: 'ระบบทำงานเป็นปกติ',
    altitude_km: 495.24,
    orbit_epoch_date: '2026-09-11',
    orbit_epoch_time: '03:00:00',
    inclination_deg: 97.52,
    orbital_period_min: 94.3,
    velocity_km_s: 7.62,
    orbit_fetched_at: '2026-09-11 03:05:00 UTC',
    missions: [
      { mission_id: 1, mission_name: 'Housekeeping Telemetry Acquisition', logmission_name: 'ดาวน์โหลดข้อมูล HK สำเร็จ', logmission_result: 'เรียบร้อย' }
    ],
    troubles: [
      { trouble_id: 1, trouble_name: 'RF Signal Weak', logtrouble_name: 'ปรับมุมจานรับสัญญาณเพิ่ม 1.5 องศา', logtrouble_result: 'เรียบร้อย' }
    ]
  }
]

export const mockOperations = [
  { operation_id: 1, operation_date: '2026-09-11', rbac_id: 14, rbac_fullname: 'น.ต. สมชาย ดวงดาว', rbac_role: 'MD', operation_note: 'ควบคุมการผ่าน 4 พาส' },
  { operation_id: 2, operation_date: '2026-09-11', rbac_id: 15, rbac_fullname: 'ร.อ. ธีระศักดิ์ นภาลัย', rbac_role: 'FMO', operation_note: '-' },
  { operation_id: 3, operation_date: '2026-09-11', rbac_id: 16, rbac_fullname: 'ร.ท. อนันต์ วงศ์สวรรค์', rbac_role: 'GSO', operation_note: 'ทดสอบจานสายอากาศหลัก' },
  { operation_id: 4, operation_date: '2026-09-12', rbac_id: 14, rbac_fullname: 'น.ต. สมชาย ดวงดาว', rbac_role: 'MD', operation_note: '-' },
  { operation_id: 5, operation_date: '2026-09-12', rbac_id: 18, rbac_fullname: 'ร.ต. กฤษดา ศรีนภา', rbac_role: 'FMO', operation_note: '-' },
  { operation_id: 6, operation_date: '2026-09-12', rbac_id: 17, rbac_fullname: 'พ.อ.อ. วิทย์ อวกาศกิจ', rbac_role: 'GSO', operation_note: '-' }
]

export const mockAltitudeHistory = [
  { epoch_date: '2026-09-05', norad_id: 48963, altitude_km: 509.42, velocity_km_s: 7.608, inclination_deg: 97.451, orbital_period_min: 94.65, tle_age_hours: 4.2, mean_motion: 15.21, eccentricity: 0.0012 },
  { epoch_date: '2026-09-06', norad_id: 48963, altitude_km: 509.31, velocity_km_s: 7.609, inclination_deg: 97.452, orbital_period_min: 94.64, tle_age_hours: 5.1, mean_motion: 15.21, eccentricity: 0.0012 },
  { epoch_date: '2026-09-07', norad_id: 48963, altitude_km: 509.18, velocity_km_s: 7.610, inclination_deg: 97.451, orbital_period_min: 94.63, tle_age_hours: 3.8, mean_motion: 15.22, eccentricity: 0.0011 },
  { epoch_date: '2026-09-08', norad_id: 48963, altitude_km: 509.05, velocity_km_s: 7.611, inclination_deg: 97.453, orbital_period_min: 94.62, tle_age_hours: 6.4, mean_motion: 15.22, eccentricity: 0.0011 },
  { epoch_date: '2026-09-09', norad_id: 48963, altitude_km: 508.98, velocity_km_s: 7.612, inclination_deg: 97.452, orbital_period_min: 94.61, tle_age_hours: 2.9, mean_motion: 15.22, eccentricity: 0.0011 },
  { epoch_date: '2026-09-10', norad_id: 48963, altitude_km: 508.89, velocity_km_s: 7.613, inclination_deg: 97.450, orbital_period_min: 94.60, tle_age_hours: 4.8, mean_motion: 15.23, eccentricity: 0.0010 },
  { epoch_date: '2026-09-11', norad_id: 48963, altitude_km: 508.82, velocity_km_s: 7.614, inclination_deg: 97.451, orbital_period_min: 94.59, tle_age_hours: 1.5, mean_motion: 15.23, eccentricity: 0.0010 }
]

export const mockSpaceWeather = [
  { spaceweather_date: '2026-09-11', spaceweather_r: 1, spaceweather_s: 0, spaceweather_g: 2, spaceweather_note: 'พบการประทุระดับ C-Class จากกลุ่มจุดดับ AR3814 สัญญาณสื่อสาร UHF ปกติ' },
  { spaceweather_date: '2026-09-10', spaceweather_r: 0, spaceweather_s: 0, spaceweather_g: 1, spaceweather_note: 'ลมสุริยะความเร็ว 420 km/s สนามแม่เหล็กโลกเสถียร' },
  { spaceweather_date: '2026-09-09', spaceweather_r: 2, spaceweather_s: 1, spaceweather_g: 1, spaceweather_note: 'เกิด Coronal Mass Ejection เล็กน้อย หันเบนออกจากแนวโลก' },
  { spaceweather_date: '2026-09-08', spaceweather_r: 0, spaceweather_s: 0, spaceweather_g: 0, spaceweather_note: 'สภาวะอวกาศเงียบสงบ' }
]

/**
 * บันทึก Audit & Activity Logs จำลองสำหรับแสดงผลในหน้า Logs
 */
export const mockActivityLogs = [
  {
    log_id: 501,
    timestamp: '2026-09-11 14:15:32',
    user: 'developer (น.ต. สมชาย ดวงดาว)',
    category: 'AUTH',
    action: 'USER_LOGIN',
    details: 'เข้าสู่ระบบสำเร็จผ่านทาง IP 10.225.120.45',
    severity: 'SUCCESS'
  },
  {
    log_id: 502,
    timestamp: '2026-09-11 13:25:10',
    user: 'theerasak (ร.อ. ธีระศักดิ์ นภาลัย)',
    category: 'REPORT',
    action: 'CREATE_REPORT',
    details: 'สร้างรายงานภารกิจ Flight No. 104/2026 (NAPA-2 N) สำเร็จ',
    severity: 'INFO'
  },
  {
    log_id: 503,
    timestamp: '2026-09-11 13:10:00',
    user: 'SYSTEM_AUTOTRACK',
    category: 'PASS',
    action: 'AOS_ESTABLISHED',
    details: 'สถานีภาคพื้นดินล็อกสัญญาณ NAPA-2 N ที่มุมยก 5.2 องศา (AOS)',
    severity: 'INFO'
  },
  {
    log_id: 504,
    timestamp: '2026-09-11 10:28:40',
    user: 'anan (ร.ท. อนันต์ วงศ์สวรรค์)',
    category: 'TELEMETRY',
    action: 'SYNC_TLE',
    details: 'อัปเดตข้อมูลวงโคจร NORAD Two-Line Element (TLE) ล่าสุด',
    severity: 'SUCCESS'
  },
  {
    log_id: 505,
    timestamp: '2026-09-11 08:45:12',
    user: 'SYSTEM_MONITOR',
    category: 'WEATHER',
    action: 'NOAA_ALERT',
    details: 'ตรวจพบดัชนีพายุแม่เหล็กโลกเพิ่มขึ้นเป็นระดับ G2 (Moderate)',
    severity: 'WARNING'
  },
  {
    log_id: 506,
    timestamp: '2026-09-10 16:20:00',
    user: 'developer (น.ต. สมชาย ดวงดาว)',
    category: 'ADMIN',
    action: 'USER_ROLE_UPDATE',
    details: 'ปรับปรุงหน้าที่ผู้ใช้งาน พ.อ.อ. วิทย์ อวกาศกิจ เป็น GSO',
    severity: 'INFO'
  }
]

/**
 * จำลองการตอบกลับของ API เมื่อทำงานใน Mock Mode
 */
export async function mockApiHandler(path, method = 'GET', body = null) {
  const cleanPath = path.split('?')[0]

  if (cleanPath === '/auth/session') {
    return {
      user: mockUsers[0],
      csrfToken: 'mock-csrf-token-abc-123',
      setupRequired: false
    }
  }

  if (cleanPath === '/auth/login') {
    return {
      user: mockUsers[0],
      csrfToken: 'mock-csrf-token-abc-123',
      setupRequired: false
    }
  }

  if (cleanPath === '/auth/logout') {
    return { success: true }
  }

  if (cleanPath === '/dashboard') {
    return {
      satellites: [
        { norad_id: 46320, sat_name: 'NAPA-1 N', altitude_km: 495.24, epoch_date: '2026-09-11', epoch_time: '06:45:00' },
        { norad_id: 48963, sat_name: 'NAPA-2 N', altitude_km: 508.82, epoch_date: '2026-09-11', epoch_time: '07:12:30' }
      ],
      weather: mockSpaceWeather[0],
      passes: mockPasses,
      operations: mockOperations.filter(o => o.operation_date === '2026-09-11'),
      altitudeHistory: mockAltitudeHistory
    }
  }

  if (cleanPath === '/lookups') {
    return {
      satellites: [
        { norad_id: 46320, sat_name: 'NAPA-1 N' },
        { norad_id: 48963, sat_name: 'NAPA-2 N' }
      ],
      subsystems: mockSubsystems,
      missions: mockMissions,
      troubles: mockTroubles,
      users: mockUsers
    }
  }

  if (cleanPath === '/passes') {
    return mockPasses
  }

  if (cleanPath === '/reports') {
    if (method === 'POST') {
      const newId = mockReports.length + 1
      const newReport = {
        report_id: newId,
        ...body,
        created_at: new Date().toISOString()
      }
      mockReports.unshift(newReport)
      return { report_id: newId }
    }
    return mockReports
  }

  if (cleanPath.startsWith('/reports/')) {
    const id = cleanPath.split('/')[2]
    if (method === 'DELETE') {
      const idx = mockReports.findIndex(r => String(r.report_id) === String(id))
      if (idx !== -1) mockReports.splice(idx, 1)
      return { success: true }
    }
    const found = mockReports.find(r => String(r.report_id) === String(id))
    if (!found) throw new Error('ไม่พบข้อมูลรายงานภารกิจนี้')
    return found
  }

  if (cleanPath === '/missions') {
    if (method === 'POST') {
      const newMission = { mission_id: Date.now(), ...body }
      mockMissions.push(newMission)
      return newMission
    }
    return mockMissions
  }

  if (cleanPath.startsWith('/missions/')) {
    const id = cleanPath.split('/')[2]
    if (method === 'PUT') {
      const item = mockMissions.find(m => String(m.mission_id) === String(id))
      if (item) Object.assign(item, body)
      return item
    }
    if (method === 'DELETE') {
      const idx = mockMissions.findIndex(m => String(m.mission_id) === String(id))
      if (idx !== -1) mockMissions.splice(idx, 1)
      return { success: true }
    }
  }

  if (cleanPath === '/troubles') {
    if (method === 'POST') {
      const newTrouble = { trouble_id: Date.now(), ...body }
      mockTroubles.push(newTrouble)
      return newTrouble
    }
    return mockTroubles
  }

  if (cleanPath.startsWith('/troubles/')) {
    const id = cleanPath.split('/')[2]
    if (method === 'PUT') {
      const item = mockTroubles.find(t => String(t.trouble_id) === String(id))
      if (item) Object.assign(item, body)
      return item
    }
    if (method === 'DELETE') {
      const idx = mockTroubles.findIndex(t => String(t.trouble_id) === String(id))
      if (idx !== -1) mockTroubles.splice(idx, 1)
      return { success: true }
    }
  }

  if (cleanPath === '/users') {
    if (method === 'POST') {
      const newUser = { rbac_id: Date.now(), ...body, has_password: Boolean(body.password) }
      mockUsers.push(newUser)
      return newUser
    }
    return mockUsers
  }

  if (cleanPath.startsWith('/users/')) {
    const id = cleanPath.split('/')[2]
    if (method === 'PUT') {
      const user = mockUsers.find(u => String(u.rbac_id) === String(id))
      if (user) {
        if (body.reset_password) {
          user.has_password = false
        } else {
          Object.assign(user, body)
          if (body.password) user.has_password = true
        }
      }
      return user
    }
    if (method === 'DELETE') {
      const idx = mockUsers.findIndex(u => String(u.rbac_id) === String(id))
      if (idx !== -1) mockUsers.splice(idx, 1)
      return { success: true }
    }
  }

  if (cleanPath === '/operations') {
    if (method === 'POST') {
      const newOp = { operation_id: Date.now(), ...body }
      mockOperations.push(newOp)
      return newOp
    }
    return mockOperations
  }

  if (cleanPath.startsWith('/operations/')) {
    const id = cleanPath.split('/')[2]
    if (method === 'PUT') {
      const op = mockOperations.find(o => String(o.operation_id) === String(id))
      if (op) Object.assign(op, body)
      return op
    }
    if (method === 'DELETE') {
      const idx = mockOperations.findIndex(o => String(o.operation_id) === String(id))
      if (idx !== -1) mockOperations.splice(idx, 1)
      return { success: true }
    }
  }

  if (cleanPath === '/satellite-data') {
    return mockAltitudeHistory
  }

  if (cleanPath === '/space-weather') {
    return mockSpaceWeather
  }

  if (cleanPath === '/logs') {
    return mockActivityLogs
  }

  // ค่าคืนกลับเริ่มต้น
  return []
}
