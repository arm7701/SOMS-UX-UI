# SOMS-UX-UI (Satellite Operations Information System)

ระบบบริหารจัดการและปฏิบัติการควบคุมดาวเทียม (SOIS / SOMS) 
ประกอบด้วย 2 โครงการย่อยใน Monorepo นี้:

## 1. SOMS (ระบบหลัก - Main Production)
- **ตำแหน่งโฟลเดอร์**: `/SOMS`
- **ธีมการออกแบบ**: Sapphire Navy & Cyan Blue (Contrast สูง ปรับแต่งตามมาตรฐานการเข้าถึงสำหรับผู้สูงอายุ)
- **ฟีเจอร์เด่น**:
  - Interactive Draggable & Resizable Grid Layout Stage สำหรับหน้า Dashboard
  - Live Orbit Tracker (แผนที่ 2D Ground Track และลูกโลก 3D Real-time SGP4)
  - Next Pass Live Countdown & Audio Alerts
  - Satellite Summary (NAPA-1 N / NAPA-2 N) & Space Weather (NOAA Scales)
  - Shift Handover Briefing Modal & Satellite Pass Planner

### วิธีติดตั้งและรัน SOMS:
```bash
cd SOMS
npm install
npm run dev
```

---

## 2. SOMS-copy (ระบบธีมดำเทา - Dark Gray Theme Edition)
- **ตำแหน่งโฟลเดอร์**: `/SOMS-copy`
- **ธีมการออกแบบ**: Dark Slate / Gray Theme โทนสีเข้มสำหรับห้องปฏิบัติการแสงน้อย
- **ฟีเจอร์เด่น**: ฟังก์ชันการทำงานครบถ้วนตามแบบฉบับ พร้อมปรับโทนสี Dark Mode

### วิธีติดตั้งและรัน SOMS-copy:
```bash
cd SOMS-copy
npm install
npm run dev
```
