# คู่มือการพัฒนาและต่อยอดระบบ Satellite Operations Information System (SOIS / SOMS)

> **พัฒนาด้วย Vue 3 (Vite + Composition API + Pinia + Vue Router + Tailwind CSS)**  
> ปรับปรุง UX/UI ใหม่ให้สบายตา สีสุภาพ อ่านง่าย เป็นทางการ และแยกไฟล์เป็นโมดูลชัดเจน  
> 📖 **คู่มือแนะนำการเพิ่มข้อมูล/ต่อยอดสำหรับ Developer**: ดูฉบับเต็มได้ที่ [DEVELOPER_GUIDE.md](file:///d:/ARM/SOMS/DEVELOPER_GUIDE.md)

---

## 1. โครงสร้างโฟลเดอร์และการแยกส่วนของโค้ด (Directory Architecture)

โปรเจกต์ถูกออกแบบตามหลัก Modular Architecture เพื่อให้ Developer สามารถเข้ามาแก้ไขหรือเพิ่มฟังก์ชันในแต่ละหัวข้อได้โดยตรง:

```
d:\ARM\SOMS\
├── index.html                  # ไฟล์เริ่มต้น โหลด Google Font (Prompt ทั้งระบบ)
├── vite.config.js              # กำหนดค่า Vite และ Reverse Proxy ไปยังเซิร์ฟเวอร์ Backend
├── tailwind.config.js          # ชุดสีไล่ฟ้าสว่าง (Brand Sky & Space Azure), ฟอนต์ Prompt
├── package.json                # ข้อมูลโมดูลและไลบรารีที่จำเป็น
├── DEVELOPER_GUIDE.md          # 🌟 คู่มือสรุปจุดเพิ่มข้อมูลด่วนสำหรับ Developer (ไม่ต้องงมหาในโค้ด)
├── src/
│   ├── main.js                 # จุดเริ่มต้นของ Vue App (ติดตั้ง Pinia และ Vue Router)
│   ├── App.vue                 # โครงสร้าง Layout หลัก (Navbar, Sidebar, Main, Footer, Toast)
│   ├── style.css               # สไตล์ส่วนกลาง, ฟอนต์ Prompt ทั้งระบบ, ระยะบรรทัด/ช่องไฟอ่านง่าย
│   │
│   ├── config/                 # 🌟 [จุดสำคัญ] ศูนย์รวมการตั้งค่าทั้งหมด (ไม่ต้องแก้ใน View)
│   │   ├── navigation.js       # รายการเมนูทั้งหมด (แถบข้าง และเมนูลัดมือถือ)
│   │   ├── satellites.js       # ข้อมูลดาวเทียม, สเปกกล้อง GSD, รอบพาส
│   │   ├── targets.js          # พิกัดเป้าหมายยุทธการ และขั้นตอน SOP
│   │   ├── telemetry.js        # กำหนดกราฟโทรมาตร (ชื่อ, หน่วย, สี)
│   │   ├── apiEndpoints.js     # รายการ API Endpoints ทั้งหมด
│   │   └── index.js            # Unified export
│   │
│   ├── api/                    # การจัดการการเชื่อมต่อข้อมูล
│   │   ├── client.js           # API Client สำหรับ GET, POST, PUT, DELETE พร้อม CSRF Token
│   │   └── mockData.js         # ข้อมูลจำลอง (Mock Data) สำหรับพัฒนาและพรีวิวแบบ Offline
│   │
│   ├── stores/                 # ระบบจัดการสถานะ (State Management ด้วย Pinia)
│   │   ├── auth.js             # จัดการ Session ผู้ใช้, สิทธิ์ Admin/Operator และ Login/Logout
│   │   ├── app.js              # จัดการธีม Light/Dark Mode, Sidebar Drawer และ Toast Notifications
│   │   └── data.js             # แคชข้อมูล Lookups (ดาวเทียม, ระบบย่อย, ภารกิจ) และ Helper Functions
│   │
│   ├── router/                 # ระบบเส้นทางและการนำทาง
│   │   └── index.js            # กำหนด URL แต่ละหน้าจอ พร้อม Route Guards ตรวจสอบสิทธิ์
│   │
│   ├── components/             # คอมโพเนนต์ที่สามารถนำกลับมาใช้ซ้ำได้ (Reusable Components)
│   │   ├── layout/             # คอมโพเนนต์โครงสร้างหลัก
│   │   │   ├── AppNavbar.vue   # แถบบน: โลโก้, นาฬิกา UTC/Local, ปุ่มสลับธีม, ผู้ใช้งาน
│   │   │   ├── AppSidebar.vue  # แถบข้าง: เมนูจัดกลุ่มตามฟังก์ชันงาน รองรับจอมือถือ
│   │   │   └── AppFooter.vue   # แถบล่าง: ลิขสิทธิ์หน่วยงาน ISR และสถานะระบบ
│   │   │
│   │   ├── common/             # คอมโพเนนต์พื้นฐานที่ใช้ในหลายหน้า
│   │   │   ├── StatCard.vue    # การ์ดแสดงค่าสถิติ/KPI สำคัญ
│   │   │   ├── DataTable.vue   # ตารางข้อมูลพร้อมช่องค้นหา, เรียงลำดับ และแบ่งหน้า
│   │   │   ├── BaseModal.vue   # กล่องข้อความแบบป๊อปอัปสำหรับดูข้อมูลและกรอกฟอร์ม
│   │   │   ├── StatusBadge.vue # ป้ายสถานะสีสุภาพ (Normal, Warning, Danger, Info)
│   │   │   ├── ConfirmDialog.vue # กล่องยืนยันการลบข้อมูลหรือการดำเนินการสำคัญ
│   │   │   └── ToastContainer.vue # กล่องแสดงการแจ้งเตือน Pop-up มุมขวาบน
│   │   │
│   │   └── dashboard/          # คอมโพเนนต์เฉพาะสำหรับหน้าแดชบอร์ด
│   │       ├── SatelliteSummary.vue # สรุปข้อมูลดาวเทียม NAPA-1 N และ NAPA-2 N
│   │       ├── SpaceWeatherWidget.vue # วิดเจ็ตรายงานสภาพอวกาศ (R, S, G Scale)
│   │       ├── TodayPassesWidget.vue  # สรุปรอบพาสดาวเทียมประจำวัน (Day/Night Passes)
│   │       ├── DutyOperatorsWidget.vue # รายชื่อเจ้าหน้าที่เข้าเวรประจำวัน (MD, FMO, GSO)
│   │       └── TelemetryChart.vue   # กราฟ Chart.js แสดงค่าโทรมาตรและวงโคจร 8 กราฟ
│   │
│   └── views/                  # แยกไฟล์ตามหน้าจอแต่ละหน้า (1 หน้าต่อ 1 ไฟล์)
│       ├── DashboardView.vue   # หน้าหลัก: ภาพรวมสถานะดาวเทียม สภาพอวกาศ และกราฟ
│       ├── PassesView.vue      # หน้าพาสดาวเทียม: ตารางรอบพาส พร้อมปุ่มสร้างรายงานทันที
│       ├── OrbitalAltitudeView.vue # หน้าระดับความสูงวงโคจรเปรียบเทียบ 2 ดาวเทียม
│       ├── SpaceWeatherView.vue    # หน้าตรวจวัดสภาพอวกาศและคำอธิบายมาตรวัด NOAA
│       ├── OperationsView.vue  # หน้าตารางเวรผู้ปฏิบัติหน้าที่รายเดือน (Duty Roster)
│       ├── ReportsView.vue     # หน้ารายการรายงานภารกิจดาวเทียม
│       ├── ReportDetailModal.vue # หน้าต่างดูรายละเอียดรายงานฉบับเต็มและคัดลอกข้อความ
│       ├── ReportCreateView.vue # หน้าสร้างรายงานภารกิจใหม่ 6 ส่วน พร้อมฟังก์ชันเพิ่ม/ลดแถว
│       ├── MissionsView.vue    # หน้าจัดการประเภทภารกิจ (สำหรับผู้ดูแลระบบ)
│       ├── TroublesView.vue    # หน้าจัดการข้อขัดข้องและระบบย่อย (สำหรับผู้ดูแลระบบ)
│       ├── UsersView.vue       # หน้าจัดการรายชื่อผู้ใช้และรีเซ็ตรหัสผ่าน (สำหรับผู้ดูแลระบบ)
│       ├── LogsView.vue        # หน้า Activity & Audit Logs บันทึกกิจกรรมระบบ
│       ├── LoginView.vue       # หน้าเข้าสู่ระบบ สบายตา มีปุ่มแสดง/ซ่อนรหัสผ่าน
│       └── SetupPasswordView.vue # หน้าตั้งรหัสผ่านใหม่
```

---

## 2. วิธีการเริ่มใช้งานและการรันระบบ (How to Run)

### ติดตั้ง Dependencies
```bash
npm install
```

### เริ่มต้น Dev Server
```bash
npm run dev
```
แอปพลิเคชันจะเปิดขึ้นที่ `http://localhost:3000` โดยจะเชื่อมต่อกับ Backend จริงที่ `http://10.225.120.221:1161` ผ่าน Vite Proxy อัตโนมัติ

### สร้างไฟล์สำหรับใช้งานจริง (Production Build)
```bash
npm run build
```
ไฟล์สำหรับขึ้นระบบ Production จะถูกสร้างไว้ในโฟลเดอร์ `dist/` ซึ่งสามารถนำไป Deploy บน Nginx, Apache หรือแพ็กเกจเป็นแอป Desktop/Mobile ได้ทันที

---

## 3. คำแนะนำสำหรับ Developer ในการต่อยอดระบบ (Developer Guide)

### 3.1 การสลับระหว่างโหมด Live API และ Mock Mode
- ที่แถบเมนูด้านบน (Navbar) จะมีปุ่ม **Live API / Mock Data**
- Developer สามารถคลิกสลับเพื่อทดสอบ UI ได้ทันทีโดยไม่ต้องต่อ VPN หรือเข้าเครือข่ายภายใน
- ข้อมูล Mock ทั้งหมดถูกเก็บไว้ที่ `src/api/mockData.js` สามารถเพิ่มหรือปรับแก้โครงสร้างข้อมูลได้ที่นั่น

### 3.2 การเพิ่มหน้าจอใหม่ (Adding a New Page)
1. สร้างไฟล์ Vue ใหม่ในโฟลเดอร์ `src/views/` เช่น `src/views/NewFeatureView.vue`
2. เข้าไปลงทะเบียนเส้นทาง (Route) ใน `src/router/index.js`:
   ```javascript
   {
     path: '/new-feature',
     name: 'NewFeature',
     component: () => import('@/views/NewFeatureView.vue'),
     meta: { requiresAuth: true, title: 'หัวข้อหน้าใหม่' }
   }
   ```
3. เพิ่มลิงก์ใน `src/components/layout/AppSidebar.vue` ในกลุ่มที่ต้องการ

### 3.3 การสร้างตารางข้อมูลใหม่ด้วย `DataTable.vue`
คอมโพเนนต์ `DataTable.vue` รองรับการทำงานสำเร็จรูป เพียงส่ง `columns` และ `data`:
```html
<DataTable
  :columns="[
    { key: 'id', label: 'รหัส', sortable: true, width: '100px' },
    { key: 'name', label: 'ชื่อรายการ', sortable: true }
  ]"
  :data="myDataList"
>
  <!-- ปรับแต่งการแสดงผลของแต่ละคอลัมน์ -->
  <template #cell(name)="{ value }">
    <span class="font-bold text-blue-600">{{ value }}</span>
  </template>

  <!-- ปุ่มการจัดการท้ายแถว -->
  <template #actions="{ row }">
    <button @click="editItem(row)">แก้ไข</button>
  </template>
</DataTable>
```

### 3.4 การเรียกใช้งาน API Client (`src/api/client.js`)
```javascript
import { api } from '@/api/client'

// GET
const list = await api.get('/my-endpoint')

// POST
const result = await api.post('/my-endpoint', { name: 'Item Name' })

// PUT
await api.put('/my-endpoint/123', { name: 'Updated' })

// DELETE
await api.delete('/my-endpoint/123')
```
ระบบจะแนบ Headers, X-CSRF-Token และ Session Cookies ให้อัตโนมัติ

---

## 4. ความพร้อมสำหรับการพัฒนา Multiplatform
เนื่องจากโปรเจกต์สร้างด้วย **Vue 3 + Vite** ที่เป็นมาตรฐานสากล:
- **Mobile App (iOS / Android)**: สามารถนำไปต่อยอดด้วย **Capacitor** (`npx cap init`) เพื่อ Build เป็น Native App บนมือถือ
- **Desktop App (Windows / macOS)**: สามารถห่อด้วย **Tauri** หรือ **Electron** เพื่อสร้างเป็นโปรแกรม `.exe` สำหรับติดตั้งในห้องศูนย์ควบคุมได้ทันที
