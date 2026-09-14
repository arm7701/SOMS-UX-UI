/**
 * ============================================================================
 * ไฟล์: src/services/orbitService.js
 * วัตถุประสงค์: บริการคำนวณวงโคจรดาวเทียมแบบเรียลไทม์ (SGP4 Orbit Propagation)
 * สำหรับหน้าจอ SOMS Redesign
 * ----------------------------------------------------------------------------
 * คุณสมบัติ:
 * 1. ฐานข้อมูล Two-Line Elements (TLE) สำหรับ NAPA-1, NAPA-2, THEOS-2, THEOS-1 ฯลฯ
 * 2. คำนวณพิกัด Sub-satellite (ละติจูด, ลองจิจูด, ความสูง, ความเร็ว) แบบเรียลไทม์
 * 3. คำนวณเส้นทางแนวโคจรภาคพื้น (Ground Track) ทั้งอดีต (Past) และอนาคต (Future)
 *    พร้อมตัดพิกัดข้ามเส้นเมริเดียน 180 องศา (Antimeridian Splitting) ป้องกันเส้นลากข้ามแผนที่
 * 4. คำนวณมุมเงย (Elevation), มุมทิศ (Azimuth) และระยะห่าง (Range) สู่สถานีภาคพื้นดิน
 * 5. ทำนายรอบพาสถัดไป (Next Pass Predictor: AOS, Max El, LOS, Duration)
 * 6. คำนวณรัศมีอาณาเขตครอบคลุมภาคพื้น (Satellite Swath / Footprint)
 * 7. ตรวจสอบสภาวะรับแสงอาทิตย์ (Sunlit / In Eclipse)
 * ============================================================================
 */

import * as satellite from './satellitePure.js'

/**
 * รายการดาวเทียมและ TLE เริ่มต้นของระบบ SOMS
 */
export const DEFAULT_SATELLITES = [
  {
    noradId: 48963,
    name: 'NAPA-2 N',
    agency: 'RTAF (กองทัพอากาศ)',
    color: '#00e5ff',
    enabled: true,
    groupIds: ['tactical', 'all'],
    line1: '1 48963U 21059CJ  26254.25000000  .00003512  00000-0  21458-3 0  9993',
    line2: '2 48963  97.4520 285.1245 0011520 120.4512 239.7845 15.22854120284512',
    epochDate: '2026-09-11 07:12:30 UTC'
  },
  {
    noradId: 46320,
    name: 'NAPA-1 N',
    agency: 'RTAF (กองทัพอากาศ)',
    color: '#a78bfa',
    enabled: true,
    groupIds: ['tactical', 'all'],
    line1: '1 46320U 20061W   26254.21500000  .00004120  00000-0  24512-3 0  9997',
    line2: '2 46320  97.5210 270.4512 0012100 135.2140 225.1023 15.24102140321541',
    epochDate: '2026-09-11 06:45:00 UTC'
  },
  {
    noradId: 58016,
    name: 'THEOS-2',
    agency: 'GISTDA (สทอภ.)',
    color: '#38bdf8',
    enabled: true,
    groupIds: ['national', 'all'],
    line1: '1 58016U 23156A   26254.31200000  .00001250  00000-0  85412-4 0  9991',
    line2: '2 58016  98.0125 310.2541 0001420  90.4125 269.8512 14.82145210154218',
    epochDate: '2026-09-11 05:30:00 UTC'
  },
  {
    noradId: 33396,
    name: 'THEOS-1',
    agency: 'GISTDA (สทอภ.)',
    color: '#34d399',
    enabled: true,
    groupIds: ['national', 'all'],
    line1: '1 33396U 08049A   26254.18500000  .00000854  00000-0  65412-4 0  9994',
    line2: '2 33396  98.7125 245.8124 0014520  65.1245 295.1245 14.21548210921451',
    epochDate: '2026-09-11 04:20:00 UTC'
  },
  {
    noradId: 40697,
    name: 'Sentinel-2A',
    agency: 'ESA (Copernicus)',
    color: '#fbbf24',
    enabled: true,
    groupIds: ['international', 'all'],
    line1: '1 40697U 15028A   26254.28400000  .00000142  00000-0  25142-4 0  9998',
    line2: '2 40697  98.5621 298.4125 0001120  75.1245 285.1245 14.30821450584125',
    epochDate: '2026-09-11 06:10:00 UTC'
  },
  {
    noradId: 39084,
    name: 'Landsat 8',
    agency: 'NASA / USGS',
    color: '#f87171',
    enabled: true,
    groupIds: ['international', 'all'],
    line1: '1 39084U 13008A   26254.34100000  .00000214  00000-0  31452-4 0  9992',
    line2: '2 39084  98.2014 305.1245 0001250  80.4512 279.8541 14.57124580674512',
    epochDate: '2026-09-11 05:45:00 UTC'
  }
]

/**
 * รายการสถานีภาคพื้นดิน (Ground Stations) และเป้าหมายยุทธการ (Targets)
 */
export const DEFAULT_LOCATIONS = [
  {
    id: 'wing1',
    type: 'ground-station',
    name: 'สถานีภาคพื้น กองบิน 1 (นครราชสีมา)',
    shortName: 'บน.1 โคราช',
    latitude: 14.9366,
    longitude: 102.0833,
    altitudeM: 220,
    minElevationDeg: 5,
    enabled: true,
    antenna: 'จานรับสัญญาณหลัก 4.5m S/X-Band'
  },
  {
    id: 'donmueang',
    type: 'ground-station',
    name: 'สถานีควบคุม บน.6 ดอนเมือง (กรุงเทพฯ)',
    shortName: 'บน.6 ดอนเมือง',
    latitude: 13.9125,
    longitude: 100.6067,
    altitudeM: 15,
    minElevationDeg: 5,
    enabled: true,
    antenna: 'สถานีสำรองและระบบควบคุมภารกิจ'
  },
  {
    id: 'sut',
    type: 'ground-station',
    name: 'สถานีวิจัยอวกาศ มทส. (สุรนารี โคราช)',
    shortName: 'มทส. โคราช',
    latitude: 14.8824,
    longitude: 102.0207,
    altitudeM: 240,
    minElevationDeg: 5,
    enabled: true,
    antenna: 'เสาอากาศติดตามดาวเทียมขนาด 3.0m'
  },
  {
    id: 'wing41',
    type: 'ground-station',
    name: 'สถานีภาคพื้น กองบิน 41 (เชียงใหม่)',
    shortName: 'บน.41 เชียงใหม่',
    latitude: 18.7714,
    longitude: 98.9626,
    altitudeM: 312,
    minElevationDeg: 10,
    enabled: true,
    antenna: 'สถานีตรวจการณ์ภาคเหนือ'
  },
  {
    id: 'wing7',
    type: 'ground-station',
    name: 'สถานีภาคพื้น กองบิน 7 (สุราษฎร์ธานี)',
    shortName: 'บน.7 สุราษฎร์ฯ',
    latitude: 9.1326,
    longitude: 99.1417,
    altitudeM: 18,
    minElevationDeg: 5,
    enabled: true,
    antenna: 'สถานียุทธการภาคใต้'
  },
  {
    id: 'target-sattahip',
    type: 'target',
    name: 'เป้าหมายยุทธการ: ฐานทัพเรือสัตหีบ (ชลบุรี)',
    shortName: 'ฐานทัพเรือสัตหีบ',
    latitude: 12.6644,
    longitude: 100.9022,
    altitudeM: 10,
    minElevationDeg: 15,
    enabled: true,
    antenna: 'พื้นที่สังเกตการณ์ความมั่นคงทางทะเล'
  },
  {
    id: 'target-east',
    type: 'target',
    name: 'เป้าหมายยุทธการ: แนวชายแดนตะวันออก (ช่องจอม)',
    shortName: 'ชายแดนตะวันออก',
    latitude: 14.3500,
    longitude: 103.5000,
    altitudeM: 180,
    minElevationDeg: 20,
    enabled: true,
    antenna: 'พื้นที่ลาดตระเวนชายแดน'
  }
]

// แคช satrec เพื่อประสิทธิภาพสูงสุด
const satrecCache = new Map()

/**
 * แปลงหรือดึง satrec record จากแคช
 */
export function getSatrec(sat) {
  const key = `${sat.noradId}_${sat.line1}`
  if (satrecCache.has(key)) {
    return satrecCache.get(key)
  }
  const record = satellite.twoline2satrec(sat.line1, sat.line2)
  satrecCache.set(key, record)
  return record
}

/**
 * ดึงพิกัด Sub-satellite แบบเรียลไทม์ ณ เวลาที่กำหนด
 * @param {Object} sat - อ็อบเจกต์ดาวเทียม
 * @param {Date} date - เวลาที่ต้องการคำนวณ
 * @returns {Object|null}
 */
export function getSatellitePosition(sat, date = new Date()) {
  try {
    const satrec = getSatrec(sat)
    const posAndVel = satellite.propagate(satrec, date)
    if (!posAndVel || !posAndVel.position || !posAndVel.velocity) return null

    const gmst = satellite.gstime(date)
    const geodetic = satellite.eciToGeodetic(posAndVel.position, gmst)

    const lat = satellite.degreesLat(geodetic.latitude)
    const lon = satellite.degreesLong(geodetic.longitude)
    const alt = geodetic.height // กิโลเมตร

    // คำนวณความเร็วรวม (km/s)
    const vx = posAndVel.velocity.x
    const vy = posAndVel.velocity.y
    const vz = posAndVel.velocity.z
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz)

    return {
      lat,
      lon,
      alt,
      velocity,
      positionEci: posAndVel.position,
      velocityEci: posAndVel.velocity,
      gmst
    }
  } catch (err) {
    console.error('getSatellitePosition error:', err)
    return null
  }
}

/**
 * ตัดเส้นทางข้ามแนวเมริเดียน 180° / -180° (Antimeridian Splitting)
 * เพื่อไม่ให้ Polyline ลากตัดขวางแผนที่
 * @param {Array<{lat: number, lon: number}>} points
 * @returns {Array<Array<[number, number]>>}
 */
export function splitAntimeridian(points) {
  const segments = []
  let currentSegment = []

  for (let i = 0; i < points.length; i++) {
    const pt = points[i]
    if (currentSegment.length === 0) {
      currentSegment.push([pt.lat, pt.lon])
      continue
    }

    const prevPt = currentSegment[currentSegment.length - 1]
    const prevLon = prevPt[1]
    const curLon = pt.lon

    if (Math.abs(curLon - prevLon) > 180) {
      // มีการข้ามเส้น Antimeridian
      const sign = prevLon > curLon ? 1 : -1
      const edgeLon = sign * 180
      const otherEdgeLon = -sign * 180
      const fraction = (edgeLon - prevLon) / ((curLon + sign * 360) - prevLon)
      const splitLat = prevPt[0] + fraction * (pt.lat - prevPt[0])

      currentSegment.push([splitLat, edgeLon])
      segments.push(currentSegment)
      currentSegment = [[splitLat, otherEdgeLon], [pt.lat, pt.lon]]
    } else {
      currentSegment.push([pt.lat, pt.lon])
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

/**
 * คำนวณเส้นทาง Ground Track (Past & Future)
 * @param {Object} sat - อ็อบเจกต์ดาวเทียม
 * @param {Date} now - เวลาปัจจุบัน
 * @param {number} pastMinutes - จำนวนนาทีในอดีต (ค่าเริ่มต้น 45 นาที)
 * @param {number} futureMinutes - จำนวนนาทีในอนาคต (ค่าเริ่มต้น 45 นาที)
 * @param {number} stepSeconds - ความละเอียดจุด (วินาที, ค่าเริ่มต้น 30 วินาที)
 */
export function getOrbitGroundTrack(sat, now = new Date(), pastMinutes = 45, futureMinutes = 45, stepSeconds = 30) {
  const pastPoints = []
  const futurePoints = []
  const satrec = getSatrec(sat)

  const startTime = now.getTime() - pastMinutes * 60 * 1000
  const endTime = now.getTime() + futureMinutes * 60 * 1000

  for (let t = startTime; t <= endTime; t += stepSeconds * 1000) {
    const date = new Date(t)
    const pv = satellite.propagate(satrec, date)
    if (!pv || !pv.position) continue

    const gmst = satellite.gstime(date)
    const gd = satellite.eciToGeodetic(pv.position, gmst)
    const lat = satellite.degreesLat(gd.latitude)
    const lon = satellite.degreesLong(gd.longitude)

    if (t < now.getTime()) {
      pastPoints.push({ lat, lon, time: t })
    } else {
      futurePoints.push({ lat, lon, time: t })
    }
  }

  // เชื่อมจุดปัจจุบันเข้ากับทั้งสองช่วง
  const currentPos = getSatellitePosition(sat, now)
  if (currentPos) {
    pastPoints.push({ lat: currentPos.lat, lon: currentPos.lon, time: now.getTime() })
    futurePoints.unshift({ lat: currentPos.lat, lon: currentPos.lon, time: now.getTime() })
  }

  return {
    pastSegments: splitAntimeridian(pastPoints),
    futureSegments: splitAntimeridian(futurePoints),
    currentPos
  }
}

/**
 * คำนวณมุม Elevation, Azimuth และ Range ไปยังสถานีภาคพื้นดิน
 * @param {Object} sat - อ็อบเจกต์ดาวเทียม
 * @param {Object} location - อ็อบเจกต์สถานีหรือเป้าหมาย
 * @param {Date} date - เวลาที่คำนวณ
 */
export function getLookAngles(sat, location, date = new Date()) {
  try {
    const satrec = getSatrec(sat)
    const pv = satellite.propagate(satrec, date)
    if (!pv || !pv.position) return null

    const gmst = satellite.gstime(date)
    const posEcf = satellite.eciToEcf(pv.position, gmst)

    const observerGd = {
      latitude: satellite.degreesToRadians(location.latitude),
      longitude: satellite.degreesToRadians(location.longitude),
      height: (location.altitudeM || 0) / 1000 // แปลงเป็น km
    }

    const lookAngles = satellite.ecfToLookAngles(observerGd, posEcf)
    const azimuth = (lookAngles.azimuth * 180 / Math.PI + 360) % 360
    const elevation = lookAngles.elevation * 180 / Math.PI
    const rangeKm = lookAngles.rangeSat

    return {
      azimuth,
      elevation,
      rangeKm,
      inContact: elevation >= (location.minElevationDeg || 5)
    }
  } catch (err) {
    return null
  }
}

/**
 * ทำนายรอบพาสถัดไป (Next Pass Prediction) สำหรับสถานีที่เลือก
 * @param {Object} sat - อ็อบเจกต์ดาวเทียม
 * @param {Object} location - สถานีภาคพื้นดิน
 * @param {Date} startDate - เวลาเริ่มค้นหา (ค่าเริ่มต้น ตอนนี้)
 * @param {number} searchHours - ระยะเวลาสแกน (ชั่วโมง, ค่าเริ่มต้น 24 ชั่วโมง)
 */
export function predictNextPass(sat, location, startDate = new Date(), searchHours = 24) {
  try {
    const satrec = getSatrec(sat)
    const observerGd = {
      latitude: satellite.degreesToRadians(location.latitude),
      longitude: satellite.degreesToRadians(location.longitude),
      height: (location.altitudeM || 0) / 1000
    }

    const minEl = location.minElevationDeg || 5
    const startTime = startDate.getTime()
    const endTime = startTime + searchHours * 3600 * 1000
    const stepMs = 20 * 1000 // สแกนทุก 20 วินาที

    let inPass = false
    let aosTime = null
    let maxElevation = -90
    let maxElTime = null

    for (let t = startTime; t <= endTime; t += stepMs) {
      const date = new Date(t)
      const pv = satellite.propagate(satrec, date)
      if (!pv || !pv.position) continue

      const gmst = satellite.gstime(date)
      const posEcf = satellite.eciToEcf(pv.position, gmst)
      const la = satellite.ecfToLookAngles(observerGd, posEcf)
      const el = la.elevation * 180 / Math.PI

      if (!inPass && el >= minEl) {
        // พบจุดเริ่มสัญญาณ (AOS)
        inPass = true
        aosTime = t
        maxElevation = el
        maxElTime = t
      } else if (inPass) {
        if (el > maxElevation) {
          maxElevation = el
          maxElTime = t
        }
        if (el < minEl) {
          // สิ้นสุดสัญญาณ (LOS)
          const losTime = t
          const durationSec = Math.round((losTime - aosTime) / 1000)

          // สุ่มสร้างจุดเส้นทางช่วงพาสนี้ (Pass Trajectory Points)
          const passPoints = []
          const passStep = Math.max(10, Math.round(durationSec / 15)) * 1000
          for (let ptTime = aosTime; ptTime <= losTime; ptTime += passStep) {
            const ptDate = new Date(ptTime)
            const ptPv = satellite.propagate(satrec, ptDate)
            if (ptPv && ptPv.position) {
              const ptGmst = satellite.gstime(ptDate)
              const ptGd = satellite.eciToGeodetic(ptPv.position, ptGmst)
              passPoints.push({
                lat: satellite.degreesLat(ptGd.latitude),
                lon: satellite.degreesLong(ptGd.longitude),
                time: ptTime
              })
            }
          }

          return {
            aos: new Date(aosTime),
            los: new Date(losTime),
            maxElevation,
            maxElTime: new Date(maxElTime),
            durationSec,
            durationMin: Math.round(durationSec / 60),
            passPoints: splitAntimeridian(passPoints),
            isCurrentlyActive: aosTime <= startDate.getTime() && losTime >= startDate.getTime()
          }
        }
      }
    }

    return null
  } catch (err) {
    console.error('predictNextPass error:', err)
    return null
  }
}

/**
 * คำนวณรัศมีอาณาเขตสัญญาณครอบคลุมภาคพื้นดิน (Footprint / Swath Radius)
 * @param {number} altitudeKm - ความสูงดาวเทียม (km)
 * @param {number} minElevationDeg - มุมเงยต่ำสุด (องศา)
 * @returns {number} รัศมีเป็นเมตร (m) สำหรับใส่ใน Leaflet L.circle
 */
export function getFootprintRadiusMeters(altitudeKm, minElevationDeg = 5) {
  const Re = 6371 // รัศมีโลก (km)
  const h = altitudeKm
  const elRad = minElevationDeg * Math.PI / 180

  // มุมที่จุดศูนย์กลางโลก (Earth Central Angle: theta)
  // cos(theta + el) = (Re / (Re + h)) * cos(el)
  const cosThetaPlusEl = (Re / (Re + h)) * Math.cos(elRad)
  const thetaPlusEl = Math.acos(Math.max(-1, Math.min(1, cosThetaPlusEl)))
  const theta = thetaPlusEl - elRad

  // ความยาวส่วนโค้งบนผิวโลก
  const swathRadiusKm = Math.max(100, Re * theta)
  return swathRadiusKm * 1000 // เมตร
}

/**
 * ตรวจสอบสภาวะรับแสงอาทิตย์ (Direct Sunlight หรือ Earth Eclipse)
 * @param {Object} positionEci
 * @param {Date} date
 */
export function isSunlit(positionEci, date = new Date()) {
  // คำนวณตำแหน่งดวงอาทิตย์โดยประมาณใน ECI
  const now = date.getTime()
  const daysSinceJ2000 = (now - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000
  const meanAnomaly = (357.529 + 0.98560028 * daysSinceJ2000) * Math.PI / 180
  const eclipticLon = (280.459 + 0.98564736 * daysSinceJ2000 + 1.915 * Math.sin(meanAnomaly)) * Math.PI / 180
  const obliquity = 23.439 * Math.PI / 180

  const sunEci = {
    x: Math.cos(eclipticLon),
    y: Math.cos(obliquity) * Math.sin(eclipticLon),
    z: Math.sin(obliquity) * Math.sin(eclipticLon)
  }

  // Dot product ระหว่างเวกเตอร์ดาวเทียมกับดวงอาทิตย์
  const dot = positionEci.x * sunEci.x + positionEci.y * sunEci.y + positionEci.z * sunEci.z
  if (dot > 0) return true // หันรับแดดเต็มที่

  // ตรวจสอบเงาตกกระทบของโลก
  const satDist = Math.sqrt(positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2)
  const perpDist = Math.sqrt(Math.max(0, satDist ** 2 - dot ** 2))
  const earthRadius = 6378.137 // km

  return perpDist > earthRadius
}

/**
 * ฟังก์ชันแปลงองศาเป็นสตริงทิศทาง N/S, E/W
 */
export function formatCoordinate(val, posSuffix, negSuffix) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  const abs = Math.abs(val).toFixed(2)
  return `${abs}° ${val >= 0 ? posSuffix : negSuffix}`
}
