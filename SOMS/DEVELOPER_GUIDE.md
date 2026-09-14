# คู่มือสำหรับนักพัฒนาในการต่อยอดและเพิ่มข้อมูล (Developer Extension Guide)
## ระบบ Satellite Operations Information System (SOIS / SOMS)

> **ฉบับปรับปรุง**: รองรับฟอนต์ **Prompt** ทั้งระบบ, จัดระยะบรรทัด (Line-Height) และช่องไฟ (Letter-Spacing) สบายตา, ธีมสี**ไล่ฟ้าสว่าง (Bright Sky & Celestial Azure Gradient)**, และระบบจัดการคอนฟิกแบบรวมศูนย์ (`src/config/`)

---

## 📌 สรุปจุดเพิ่มข้อมูลด่วน (Quick Extension Cheat Sheet)

หากต้องการเพิ่มหรือแก้ไขข้อมูลในระบบ **ไม่ต้องไปงมหาในโค้ดหน้าจอ (Views)** ให้เข้าไปแก้ไขที่ไฟล์ตั้งค่าส่วนกลางในโฟลเดอร์ `src/config/` ได้ทันทีตามตารางนี้:

| สิ่งที่ต้องการเพิ่ม / ปรับปรุง | ไฟล์ที่ต้องแก้ไข | ผลลัพธ์ในระบบ |
| :--- | :--- | :--- |
| **เพิ่ม/แก้ไขเมนูในแถบข้าง (Sidebar) หรือเมนูลัดมือถือ** | [`src/config/navigation.js`](file:///d:/ARM/SOMS/src/config/navigation.js) | เมนูจะปรากฏใน Sidebar และแถบล่างบนมือถืออัตโนมัติ |
| **เพิ่มดาวเทียมดวงใหม่ (เช่น NAPA-3, THEOS-2)** | [`src/config/satellites.js`](file:///d:/ARM/SOMS/src/config/satellites.js) | ระบบจะรู้จักดาวเทียมและสเปกกล้องในตัวคำนวณ GSD ทันที |
| **เพิ่มพิกัดเป้าหมายยุทธการ (Quick Target Presets)** | [`src/config/targets.js`](file:///d:/ARM/SOMS/src/config/targets.js) | ปุ่มเป้าหมายด่วนใน SAT PASS PLANNER จะเพิ่มขึ้นทันที |
| **เพิ่มกราฟแนวโน้ม Telemetry บนหน้าแรก (Dashboard)** | [`src/config/telemetry.js`](file:///d:/ARM/SOMS/src/config/telemetry.js) | กราฟ Chart.js แสดงแนวโน้มใหม่จะถูกวาดขึ้นบน Dashboard ทันที |
| **ตรวจสอบรายการ REST API Endpoints ทั้งหมด** | [`src/config/apiEndpoints.js`](file:///d:/ARM/SOMS/src/config/apiEndpoints.js) | พจนานุกรม URL และ Method ของ API ทั้งหมดในระบบ |
| **ปรับแต่งสีธีมไล่ฟ้าสว่าง หรือระยะบรรทัดฟอนต์ Prompt** | [`src/style.css`](file:///d:/ARM/SOMS/src/style.css) / [`tailwind.config.js`](file:///d:/ARM/SOMS/tailwind.config.js) | ปรับเฉดสีตัวแปร CSS และการเว้นวรรคตัวอักษรทั้งระบบ |

---

## 1. โครงสร้างโฟลเดอร์หลัก (Project Directory Map)

```
d:\ARM\SOMS\
├── index.html                  # จุดโหลดฟอนต์ Prompt และกำหนด Background เริ่มต้น
├── tailwind.config.js          # Palette สีไล่ฟ้า (brand & space), ฟอนต์ Prompt, letterSpacing
├── vite.config.js              # Proxy เชื่อมต่อไปยัง Backend (http://10.225.120.221:1161)
├── src/
│   ├── config/                 # 🌟 [จุดสำคัญ] ศูนย์รวมการตั้งค่าทั้งหมด (ไม่ต้องแก้ใน View)
│   │   ├── navigation.js       # รายการเมนูทั้งหมด (mainLinks, systemLinks, adminLinks, mobile)
│   │   ├── satellites.js       # ข้อมูลดาวเทียม, สเปกกล้อง GSD, รอบพาส
│   │   ├── targets.js          # พิกัดเป้าหมายยุทธการ และขั้นตอน SOP
│   │   ├── telemetry.js        # กำหนดกราฟโทรมาตร (ชื่อ, หน่วย, สี)
│   │   ├── apiEndpoints.js     # รายการ API Endpoints ทั้งหมด
│   │   └── index.js            # Unified export
│   │
│   ├── api/                    # การเชื่อมต่อเซิร์ฟเวอร์
│   │   ├── client.js           # Fetch wrapper พร้อม Auto-CSRF Token และ Auto-Mock Fallback
│   │   └── mockData.js         # ข้อมูลจำลองสำหรับพัฒนา Offline
│   │
│   ├── stores/                 # Pinia State Management
│   │   ├── app.js              # ธีม Light/Dark, Drawer Menu, Toast, Auto-Refresh
│   │   ├── auth.js             # User session, Role, Login/Logout
│   │   └── data.js             # Lookup cache และ helper แปลงค่า
│   │
│   ├── router/                 # Vue Router 4
│   │   └── index.js            # กำหนด URL แต่ละหน้าจอ พร้อม Guard ตรวจสอบสิทธิ์ Admin
│   │
│   ├── components/             # Reusable UI Components
│   │   ├── common/             # DataTable, StatCard, BaseModal, ConfirmDialog, StatusBadge
│   │   ├── dashboard/          # NextPassBanner, SatelliteSummary, SpaceWeather, TelemetryChart
│   │   └── layout/             # AppNavbar, AppSidebar, AppFooter, MobileBottomNav
│   │
│   └── views/                  # หน้าจอระบบ (1 หน้าจอ ต่อ 1 ไฟล์ .vue)
```

---

## 2. คู่มือทีละขั้นตอนสำหรับ Developer (Step-by-Step Recipes)

### 📌 Recipe 1: วิธีเพิ่มหน้าจอใหม่ (Adding a New View & Route)
1. **สร้างไฟล์ View ใหม่** ใน `src/views/MyNewView.vue`:
   ```vue
   <script setup>
   import { ref } from 'vue'
   </script>

   <template>
     <div class="space-y-6">
       <div class="flex items-center justify-between pb-4 border-b border-sky-200/80 dark:border-sky-800/40">
         <h1 class="text-xl sm:text-2xl font-bold font-prompt text-slate-900 dark:text-white">
           หัวข้อหน้าจอใหม่
         </h1>
       </div>
       <div class="bg-white/95 dark:bg-space-850/95 rounded-2xl p-6 border border-sky-200/80 dark:border-sky-800/40 shadow-sm">
         เนื้อหาของคุณที่นี่
       </div>
     </div>
   </template>
   ```
2. **ลงทะเบียน Route** ใน [`src/router/index.js`](file:///d:/ARM/SOMS/src/router/index.js):
   ```javascript
   {
     path: '/my-new-page',
     name: 'MyNewPage',
     component: () => import('@/views/MyNewView.vue'),
     meta: { requiresAuth: true, title: 'หน้าจอใหม่' }
   }
   ```
3. **เพิ่มเมนูเข้าแถบข้าง** ใน [`src/config/navigation.js`](file:///d:/ARM/SOMS/src/config/navigation.js):
   ```javascript
   // นำเข้าไอคอนจาก lucide-vue-next แล้วใส่ใน mainLinks
   {
     name: 'MyNewPage',
     path: '/my-new-page',
     label: 'ชื่อเมนูที่แสดง',
     icon: Sparkles
   }
   ```

---

### 📌 Recipe 2: วิธีเพิ่มดาวเทียมดวงใหม่ (Adding a New Satellite)
เปิดไฟล์ [`src/config/satellites.js`](file:///d:/ARM/SOMS/src/config/satellites.js):
```javascript
// 1. เพิ่มใน defaultSatellites
export const defaultSatellites = [
  ...
  { norad_id: 99999, sat_name: 'NAPA-3', active: true, agency: 'RTAF' }
]

// 2. เพิ่มชื่อใน satelliteNameMap
export const satelliteNameMap = {
  ...
  99999: 'NAPA-3'
}

// 3. เพิ่มสเปกเซนเซอร์ใน satelliteSpecs (เพื่อคำนวณ GSD ใน Planner)
export const satelliteSpecs = [
  ...
  {
    id: '99999',
    name: 'NAPA-3',
    maxRoll: 25,
    swathKm: 20,
    gsdM: 0.8,
    speedKms: 6.20,
    duration: 5.0,
    preRoll: 3.0,
    type: 'High-Res Optical',
    agency: 'RTAF'
  }
]
```

---

### 📌 Recipe 3: วิธีเพิ่มพิกัดเป้าหมายยุทธการใหม่ใน SAT PASS PLANNER
เปิดไฟล์ [`src/config/targets.js`](file:///d:/ARM/SOMS/src/config/targets.js) แล้วเพิ่ม 1 บรรทัด:
```javascript
export const targetPresets = [
  ...
  {
    id: 'w23',
    name: 'อุดรธานี (กองบิน 23)',
    lat: 17.3867,
    lon: 102.7883,
    desc: 'กองบินยุทธการขับไล่และลาดตระเวนชายแดนแม่น้ำโขง'
  }
]
```
> เมื่อบันทึกแล้ว ปุ่มพิกัดนี้จะปรากฏในชิปเป้าหมายด่วนของ SAT PASS PLANNER บนทุกแพลตฟอร์มทันที

---

### 📌 Recipe 4: วิธีเพิ่มกราฟ Telemetry บนหน้าแรก (Adding Telemetry Chart)
เปิดไฟล์ [`src/config/telemetry.js`](file:///d:/ARM/SOMS/src/config/telemetry.js):
```javascript
export const telemetryCharts = [
  ...
  {
    key: 'batteryVoltage',
    field: 'battery_v',
    title: 'Battery Voltage (แรงดันไฟฟ้าแบตเตอรี่)',
    unit: 'V',
    color: '#0ea5e9',
    fillColor: 'rgba(14, 165, 233, 0.08)',
    type: 'line'
  }
]
```

---

### 📌 Recipe 5: วิธีเรียกใช้ตารางสำเร็จรูป (Using DataTable Component)
ระบบมีคอมโพเนนต์ `DataTable.vue` ที่รองรับการค้นหา (Instant Search), สลับคอลัมน์เรียงลำดับ (Sort), แบ่งหน้า (Pagination) และคำแนะนำปัดจอสัมผัส (Swipe Hint) เรียบร้อยแล้ว:
```vue
<script setup>
import DataTable from '@/components/common/DataTable.vue'

const columns = [
  { key: 'id', label: 'รหัส', sortable: true },
  { key: 'name', label: 'ชื่อรายการ', sortable: true },
  { key: 'status', label: 'สถานะ' },
  { key: 'actions', label: 'การดำเนินการ' }
]

const items = [ ... ]
</script>

<template>
  <DataTable
    :columns="columns"
    :data="items"
    search-placeholder="ค้นหาข้อมูล..."
  >
    <!-- ปรับแต่งการแสดงผลคอลัมน์ status ได้ด้วย slot -->
    <template #cell-status="{ value }">
      <StatusBadge :status="value" />
    </template>

    <!-- ปรับแต่งปุ่มคำสั่งในคอลัมน์ actions -->
    <template #cell-actions="{ row }">
      <button @click="editItem(row)">แก้ไข</button>
    </template>
  </DataTable>
</template>
```

---

## 3. สรุปฟอนต์ Prompt และสีธีมไล่ฟ้าสว่าง

- **ฟอนต์ Prompt ทั้งระบบ**:
  - โหลดจาก Google Fonts ด้วยน้ำหนักครบช่วง `wght@300;400;500;600;700;800`
  - ปรับระยะบรรทัดมาตรฐาน `line-height: 1.68` เพื่อป้องกันวรรณยุกต์ (ไม้เอก, โท, ตรี) และสระบน-ล่างชนกัน
  - ปรับระยะช่องไฟตัวอักษร `letter-spacing: 0.018em` ทำให้อ่านง่าย สบายตา ชัดเจนทุกขนาดหน้าจอ
- **ธีมสีไล่ฟ้าสว่าง (Bright Sky Theme)**:
  - **Light Mode**: พื้นหลังไล่เฉด `bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50/70` การ์ดขอบเรืองฟ้าใส `border-sky-200/80`
  - **Dark Mode**: คืนความโปร่งด้วยโทน Deep Celestial Azure `from-[#051326] via-[#0a2144] to-[#061834]` ไม่มืดทึบ พร้อมขอบการ์ดเรืองแสงนวลตา `border-sky-800/40`
  - แถบเรืองแสงสีฟ้าสว่าง `bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-600` ที่ขอบบนสุดของจอ
