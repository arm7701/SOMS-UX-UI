const required = { required: true };
export const resources = {
  missions: {
    title: "Mission",
    subtitle: "Mission Operate Satellite",
    icon: "ticket-detailed",
    item: "Mission",
    id: "mission_id",
    fields: [
      ["mission_name", "Mission Name", required],
      ["mission_note", "Note", { type: "textarea" }],
    ],
  },
  troubles: {
    title: "Subsystem/Trouble",
    subtitle: "Troubleshooting",
    icon: "ticket-detailed",
    item: "trouble",
    id: "trouble_id",
    fields: [
      ["trouble_name", "Trouble Name", required],
      [
        "sub_id",
        "Subsystem",
        {
          required: true,
          lookup: "subsystems",
          key: "sub_id",
          label: "sub_name",
        },
      ],
      ["trouble_note", "Note", { type: "textarea" }],
    ],
  },
  users: {
    title: "User",
    subtitle: "รายชื่อผู้ใช้งาน/ผู้เข้าเวร",
    icon: "people",
    item: "User",
    id: "rbac_id",
    fields: [
      ["rbac_fullname", "ยศ ชื่อ-สกุล", required],
      ["rbac_shortname", "ชื่อย่อ", required],
      ["rbac_position", "ตำแหน่ง", {}],
      ["rbac_username", "Username", required],
      [
        "rbac_role",
        "ตำแหน่งปฏิบัติงาน",
        { required: true, value: "-", options: ["-", "MD", "FMO", "GSO"] },
      ],
      [
        "rbac_status",
        "สถานะ",
        { required: true, options: ["Active", "Notactive"] },
      ],
      ["rbac_duty", "หน้าที่เพิ่มเติม", {}],
      ["rbac_comments", "หมายเหตุ", {}],
      [
        "password",
        "รหัสผ่าน (เว้นว่างเพื่อคงเดิม / ตั้งค่าครั้งแรก)",
        { type: "password" },
      ],
    ],
  },
  operations: {
    title: "OPERATOR LIST",
    subtitle: "รายชื่อผู้ปฏิบัติเวร",
    icon: "ticket-detailed",
    item: "operation",
    id: "operation_id",
    fields: [
      ["operation_date", "วันที่", { required: true, type: "date" }],
      [
        "rbac_id",
        "ผู้ปฏิบัติเวร",
        {
          required: true,
          lookup: "users",
          key: "rbac_id",
          label: "rbac_fullname",
        },
      ],
      [
        "rbac_role",
        "หน้าที่",
        { required: true, options: ["MD", "FMO", "GSO"] },
      ],
      ["operation_note", "หมายเหตุ", {}],
    ],
  },
};
export const passColumns = [
  ["satellite_id", "NORAD"],
  ["aos_date_local", "วันที่ (ไทย)"],
  ["aos_time_local", "AOS (ไทย)"],
  ["los_date_local", "วันที่ LOS"],
  ["los_time_local", "LOS (ไทย)"],
  ["duration_min", "นาที"],
  ["duration_sec", "วินาที"],
  ["maxEl", "มุมสูงสุด (°)"],
];
export const altitudeColumns = [
  ["sat_name", "ดาวเทียม"],
  ["norad_id", "NORAD"],
  ["epoch_date", "วันที่ Epoch"],
  ["epoch_time", "เวลา Epoch (UTC)"],
  ["altitude_km", "ความสูง (km)"],
  ["velocity_km_s", "ความเร็ว (km/s)"],
  ["inclination_deg", "ความเอียง (°)"],
  ["orbital_period_min", "คาบ (นาที)"],
  ["created_at", "บันทึกเมื่อ"],
];

export const weatherColumns = [
  ["spaceweather_date", "วันที่"],
  ["spaceweather_r", "Radio blackout (R)"],
  ["spaceweather_s", "Solar radiation (S)"],
  ["spaceweather_g", "Geomagnetic (G)"],
  ["spaceweather_note", "หมายเหตุ"],
];
