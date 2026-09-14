/**
 * ============================================================================
 * ไฟล์: src/config/satellites.js
 * วัตถุประสงค์: ศูนย์รวมข้อมูลสเปกดาวเทียม (Satellite Specs & Configurations)
 * ----------------------------------------------------------------------------
 * 💡 คำแนะนำสำหรับ Developer:
 * หากต้องการ "เพิ่มดาวเทียมใหม่ในระบบ" หรือ "ปรับปรุงสเปกเซนเซอร์":
 * 1. เพิ่มข้อมูลใน defaultSatellites (สำหรับตาราง Lookups)
 * 2. เพิ่มชื่อใน satelliteNameMap (สำหรับแปลง NORAD ID เป็นชื่อเรียกทางการ)
 * 3. เพิ่มสเปกใน satelliteSpecs (สำหรับเครื่องคำนวณ GSD และการวางแผนพาสใน Planner)
 * ============================================================================
 */

/**
 * รายชื่อดาวเทียมเริ่มต้นของระบบ SOMS
 */
export const defaultSatellites = [
  { norad_id: 46320, sat_name: 'NAPA-1 N', active: true, agency: 'RTAF' },
  { norad_id: 48963, sat_name: 'NAPA-2 N', active: true, agency: 'RTAF' }
]

/**
 * แผนผังแปลง NORAD Catalog Number เป็นชื่อดาวเทียม
 */
export const satelliteNameMap = {
  46320: 'NAPA-1 N',
  48963: 'NAPA-2 N',
  58016: 'THEOS-2',
  33396: 'THEOS-1',
  40697: 'Sentinel-2A',
  42063: 'Sentinel-2B',
  60989: 'Sentinel-2C',
  39084: 'Landsat 8',
  49260: 'Landsat 9'
}

/**
 * แผนผังแปลงรหัสรอบพาส (Pass Sequence) เป็นชื่อเรียกทางการ
 */
export const passSequenceMap = {
  1: 'DayPass-1',
  2: 'DayPass-2',
  3: 'NightPass-1',
  4: 'NightPass-2'
}

/**
 * สเปกเซนเซอร์และพารามิเตอร์การถ่ายภาพของกลุ่มดาวเทียม (Sensor Specifications)
 * ใช้สำหรับการจำลองค่า GSD (Ground Sampling Distance) ตามมุม Roll Angle ใน SAT PASS PLANNER
 */
export const satelliteSpecs = [
  {
    id: '48963',
    name: 'NAPA-2 N',
    maxRoll: 20,
    swathKm: 19,
    gsdM: 1.0,
    speedKms: 6.18,
    duration: 4.775,
    preRoll: 3.0,
    type: 'Tactical Reconnaissance',
    agency: 'RTAF'
  },
  {
    id: '46320',
    name: 'NAPA-1 N',
    maxRoll: 20,
    swathKm: 19,
    gsdM: 5.0,
    speedKms: 6.20,
    duration: 4.500,
    preRoll: 3.0,
    type: 'Tactical Earth Observation',
    agency: 'RTAF'
  },
  {
    id: '58016',
    name: 'THEOS-2',
    maxRoll: 45,
    swathKm: 10.3,
    gsdM: 0.5,
    speedKms: 6.90,
    duration: 3.0,
    preRoll: 1.5,
    type: 'Very High Resolution Optical',
    agency: 'GISTDA'
  },
  {
    id: '33396',
    name: 'THEOS-1',
    maxRoll: 30,
    swathKm: 22,
    gsdM: 2.5,
    speedKms: 6.60,
    duration: 4.0,
    preRoll: 2.0,
    type: 'Earth Observation',
    agency: 'GISTDA'
  },
  {
    id: '40697',
    name: 'Sentinel-2A',
    maxRoll: 20.6,
    swathKm: 290,
    gsdM: 10.0,
    speedKms: 7.16,
    duration: 30.0,
    preRoll: 2.0,
    type: 'Multispectral Wide-Swath',
    agency: 'ESA'
  },
  {
    id: '42063',
    name: 'Sentinel-2B',
    maxRoll: 20.6,
    swathKm: 290,
    gsdM: 10.0,
    speedKms: 7.16,
    duration: 30.0,
    preRoll: 2.0,
    type: 'Multispectral Wide-Swath',
    agency: 'ESA'
  },
  {
    id: '60989',
    name: 'Sentinel-2C',
    maxRoll: 20.6,
    swathKm: 290,
    gsdM: 10.0,
    speedKms: 7.16,
    duration: 30.0,
    preRoll: 2.0,
    type: 'Multispectral Wide-Swath',
    agency: 'ESA'
  },
  {
    id: '39084',
    name: 'Landsat 8',
    maxRoll: 7.5,
    swathKm: 185,
    gsdM: 30.0,
    speedKms: 7.00,
    duration: 24.0,
    preRoll: 2.0,
    type: 'Land Remote Sensing',
    agency: 'NASA / USGS'
  },
  {
    id: '49260',
    name: 'Landsat 9',
    maxRoll: 7.5,
    swathKm: 185,
    gsdM: 30.0,
    speedKms: 7.00,
    duration: 24.0,
    preRoll: 2.0,
    type: 'Land Remote Sensing',
    agency: 'NASA / USGS'
  }
]
