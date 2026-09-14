/**
 * ============================================================================
 * ไฟล์: src/config/telemetry.js
 * วัตถุประสงค์: รวมการตั้งค่ากราฟโทรมาตร (Telemetry Charts Configuration)
 * ----------------------------------------------------------------------------
 * 💡 คำแนะนำสำหรับ Developer:
 * หากต้องการ "เพิ่มกราฟ Telemetry ใหม่บนหน้าแรก":
 * เพียงเพิ่ม Object ลงใน telemetryCharts โดยกำหนด:
 * - key: ชื่อฟิลด์ในข้อมูล altitudeHistory
 * - title: ชื่อหัวข้อกราฟ (ภาษาไทย/อังกฤษ)
 * - unit: หน่วยวัด (เช่น km, km/s, °, °C, V)
 * - color: สีเส้นกราฟ (Hex code)
 * - fillColor: สีพื้นหลังใต้กราฟ (RGBA หรือ Hex)
 * - type: ชนิดกราฟ ('line' หรือ 'bar') - ค่าเริ่มต้นคือ 'line'
 * - extractor: ฟังก์ชันดึงค่าจากออบเจกต์แถวข้อมูล (optional)
 * ============================================================================
 */

export const telemetryCharts = [
  {
    key: 'altitude',
    field: 'altitude_km',
    title: 'Altitude (ระดับความสูงวงโคจร)',
    unit: 'km',
    color: '#2563eb',
    fillColor: 'rgba(37, 99, 235, 0.08)',
    type: 'line'
  },
  {
    key: 'velocity',
    field: 'velocity_km_s',
    title: 'Velocity (ความเร็ว)',
    unit: 'km/s',
    color: '#dc2626',
    fillColor: 'rgba(220, 38, 38, 0.08)',
    type: 'line'
  },
  {
    key: 'inclination',
    field: 'inclination_deg',
    title: 'Inclination (มุมเอียง)',
    unit: '°',
    color: '#d97706',
    fillColor: 'rgba(217, 119, 6, 0.08)',
    type: 'line'
  },
  {
    key: 'period',
    field: 'orbital_period_min',
    title: 'Orbital Period (คาบโคจร)',
    unit: 'min',
    color: '#059669',
    fillColor: 'rgba(5, 150, 105, 0.08)',
    type: 'line'
  },
  {
    key: 'tleAge',
    field: 'tle_age_hours',
    title: 'TLE Age (อายุข้อมูลวงโคจร)',
    unit: 'hours',
    color: '#16a34a',
    fillColor: 'rgba(22, 163, 74, 0.08)',
    type: 'line'
  },
  {
    key: 'meanMotion',
    field: 'mean_motion',
    title: 'Mean Motion',
    unit: 'rev/day',
    color: '#7c3aed',
    fillColor: 'rgba(124, 58, 237, 0.08)',
    type: 'line'
  },
  {
    key: 'eccentricity',
    field: 'eccentricity',
    title: 'Eccentricity',
    unit: '',
    color: '#0284c7',
    fillColor: 'rgba(2, 132, 199, 0.08)',
    type: 'line'
  },
  {
    key: 'anomalies',
    field: null,
    title: 'Mission Anomalies (ข้อขัดข้อง)',
    unit: 'ครั้ง',
    color: '#f43f5e',
    fillColor: '#f43f5e',
    type: 'bar',
    customData: () => [0, 0, 1, 0, 0, 0, 0]
  }
]
