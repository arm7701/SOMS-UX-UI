/**
 * ============================================================================
 * ไฟล์: src/config/telemetry.js
 * วัตถุประสงค์: รวมการตั้งค่ากราฟโทรมาตร (Telemetry Charts Configuration)
 * ธีมดำเทาไททาเนียม: คอนทราสต์เส้นกราฟคมชัดบนพื้นหลังสีดำ
 * ============================================================================
 */

export const telemetryCharts = [
  {
    key: 'altitude',
    field: 'altitude_km',
    title: 'Altitude (ระดับความสูงวงโคจร)',
    unit: 'km',
    color: '#cbd5e1',
    fillColor: 'rgba(203, 213, 225, 0.08)',
    type: 'line'
  },
  {
    key: 'velocity',
    field: 'velocity_km_s',
    title: 'Velocity (ความเร็ว)',
    unit: 'km/s',
    color: '#38bdf8',
    fillColor: 'rgba(56, 189, 248, 0.08)',
    type: 'line'
  },
  {
    key: 'inclination',
    field: 'inclination_deg',
    title: 'Inclination (มุมเอียง)',
    unit: '°',
    color: '#f59e0b',
    fillColor: 'rgba(245, 158, 11, 0.08)',
    type: 'line'
  },
  {
    key: 'period',
    field: 'orbital_period_min',
    title: 'Orbital Period (คาบโคจร)',
    unit: 'min',
    color: '#10b981',
    fillColor: 'rgba(16, 185, 129, 0.08)',
    type: 'line'
  },
  {
    key: 'tleAge',
    field: 'tle_age_hours',
    title: 'TLE Age (อายุข้อมูลวงโคจร)',
    unit: 'hours',
    color: '#14b8a6',
    fillColor: 'rgba(20, 184, 166, 0.08)',
    type: 'line'
  },
  {
    key: 'meanMotion',
    field: 'mean_motion',
    title: 'Mean Motion',
    unit: 'rev/day',
    color: '#a78bfa',
    fillColor: 'rgba(167, 139, 250, 0.08)',
    type: 'line'
  },
  {
    key: 'eccentricity',
    field: 'eccentricity',
    title: 'Eccentricity',
    unit: '',
    color: '#f1f5f9',
    fillColor: 'rgba(241, 245, 249, 0.08)',
    type: 'line'
  },
  {
    key: 'anomalies',
    field: null,
    title: 'Mission Anomalies (ข้อขัดข้อง)',
    unit: 'ครั้ง',
    color: '#fb7185',
    fillColor: '#fb7185',
    type: 'bar',
    customData: () => [0, 0, 1, 0, 0, 0, 0]
  }
]
