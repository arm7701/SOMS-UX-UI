export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function reportPayload(form) {
  const pass = Number(form.get("pass_id"));
  if (!Number.isInteger(pass) || pass < 1)
    throw new Error("กรุณาเลือกพาสดาวเทียม");
  const result = { pass_id: pass };
  for (const key of [
    "sat_seq",
    "sat_flight_pass",
    "sat_gsostatus",
    "sat_mcs",
    "sat_pdhufreespace",
    "sat_lastimg",
    "sat_next_pass",
    "sat_md",
    "sat_fmo",
    "sat_gso",
    "approaching",
    "sat_note",
  ])
    result[key] = String(form.get(key) ?? "").trim();
  for (const [collection, kind, label] of [
    ["missions", "mission", "ภารกิจ"],
    ["troubles", "trouble", "ข้อขัดข้อง"],
  ]) {
    const ids = form.getAll(`${kind}_id[]`),
      names = form.getAll(`log${kind}_name[]`),
      results = form.getAll(`log${kind}_result[]`);
    result[collection] = ids.map((id, i) => {
      if (!Number.isInteger(Number(id)) || Number(id) < 1)
        throw new Error(`กรุณาเลือก${label}`);
      return {
        [`${kind}_id`]: Number(id),
        [`log${kind}_name`]: String(names[i] ?? "").trim(),
        [`log${kind}_result`]: String(results[i] ?? "").trim(),
      };
    });
  }
  return result;
}
export function chartPoints(rows, key) {
  return rows.filter(
    (row) =>
      row[key] !== null &&
      row[key] !== undefined &&
      row[key] !== "" &&
      Number.isFinite(Number(row[key])),
  );
}
export function validatePassword(password) {
  const bytes = new TextEncoder().encode(password).length;
  if (bytes < 10 || bytes > 72)
    throw new Error("รหัสผ่านต้องมีขนาด 10–72 ไบต์ (อักษรไทยใช้ 3 ไบต์ต่อตัว)");
}
export function operatorOptions(users, role) {
  return users
    .filter(
      (user) =>
        String(user.rbac_status).toLowerCase() === "active" &&
        String(user.rbac_role).toUpperCase() === role.toUpperCase(),
    )
    .map((user) => [user.rbac_id, user.rbac_fullname]);
}
