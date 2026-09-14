import { api } from "../api.js";
import { e, display, submitForm } from "../components.js";
import { resources } from "../resources.js";
const alertBox = '<p class="error text-danger mb-0" role="alert" tabindex="-1"></p>';
function field(name, label, { type = "text", value = "", required = false, options = null }) {
  const attrs = `id="edit-${e(name)}" name="${e(name)}" ${required ? "required" : ""}`;
  const control = options
    ? `<select class="form-select" ${attrs}>${name === "sub_id" ? '<option value="">-- เลือกระบบย่อย --</option>' : ""}${options.map(option => {
      const [key, text] = Array.isArray(option) ? option : [option, option];
      return `<option value="${e(key)}" ${String(key) === String(value) ? "selected" : ""}>${e(text)}</option>`;
    }).join("")}</select>`
    : type === "textarea" ? `<textarea class="form-control" ${attrs} maxlength="15000">${e(value)}</textarea>`
      : `<input class="form-control" ${attrs} type="${e(type)}" value="${e(value)}" maxlength="255">`;
  return `<label class="form-label" for="edit-${e(name)}">${e(label)}</label>${control}`;
}
export const originalHeading = (title, subtitle, icon = "ticket-detailed", action = "") => `<header class="border-bottom pb-3 mb-4"><div class="d-flex align-items-center justify-content-between flex-wrap gap-2"><div><h1 class="h3 mb-1 d-flex align-items-center gap-2"><i class="bi bi-${e(icon)}${["people", "calendar-week"].includes(icon) ? " me-2" : ""}" aria-hidden="true"></i>${e(title)}</h1><p class="text-secondary mb-0">${e(subtitle)}</p></div>${action}</div></header>`;
export function monthDates() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  const prefix = `${get("year")}-${get("month")}`;
  return { today: `${prefix}-${get("day")}`, dates: Array.from({ length: new Date(Number(get("year")), Number(get("month")), 0).getDate() }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`) };
}
export const dateText = (date, separator = "/") => /^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? String(date).split("-").reverse().join(separator) : String(date ?? "-");
export const calendarDate = (date, today) => `${e(dateText(date))}${date === today ? '<span class="badge bg-danger ms-2">TODAY</span>' : ""}`;
// Use the same renderer and Bootstrap integration as the original PHP screens.
export function originalTable(host, rows, headers, renderRow, pageLength = 25) {
  host.querySelectorAll("table").forEach(table => { if(window.jQuery.fn.dataTable.isDataTable(table)) window.jQuery(table).DataTable().destroy(); });
  const users = headers.includes('Username');
  if (users) host.classList.replace('p-3', 'p-0');
  const management = headers[0] === 'No.' && !users;
  const tableId = users ? 'userTable' : headers.includes('Trouble') ? 'troubleTable' : 'missionTable';
  const table = `<table id="${tableId}" class="table table-striped table-bordered ${users ? 'mb-0 ' : ''}w-100"><thead class="table-dark ${users ? 'text-center' : ''}"><tr>${headers.map((h,i)=>`<th ${users ? 'class="text-center"' : management && (i===0 || i===headers.length-1) ? `style="width:${i===0?80:160}px"` : ''}>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(renderRow).join('')}</tbody></table>`;
  host.innerHTML = users ? `<div class="table-responsive">${table}</div>` : table;
  return window.jQuery(host.querySelector('table')).DataTable({responsive:true,pageLength,...(users ? {columnDefs:[{targets:-1,orderable:false,searchable:false}]} : {})});
}
export async function resetPassword(client, id, confirmReset) {
  if (!confirmReset("รีเซ็ตรหัสผ่านผู้ใช้นี้? รหัสผ่านเดิมจะใช้ไม่ได้ และผู้ใช้ต้องตั้งรหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป")) return false;
  await client.put(`/users/${encodeURIComponent(id)}`, { reset_password: true });
  return true;
}
export async function management(root, kind) {
  const config = resources[kind];
  const [rows, lookups] = await Promise.all([api.get(`/${kind}`), api.get("/lookups")]);
  root.querySelectorAll("table").forEach(table => { if(window.jQuery.fn.dataTable.isDataTable(table)) window.jQuery(table).DataTable().destroy(); });
  root.innerHTML = originalHeading(config.title, config.subtitle, config.icon, kind === "operations" ? "" : `<button class="btn btn-mono-primary" id="create"><i class="bi bi-plus-circle" aria-hidden="true"></i> Add ${e(config.item)}</button>`) + alertBox + '<p id="management-status" role="status" class="mb-0"></p><div class="card border-0 shadow-sm"><div class="card-body p-3" id="list"></div></div><div id="editor" class="modal fade" tabindex="-1" aria-labelledby="editor-title" aria-hidden="true"></div>';
  const lookup = (name, key, value, label) => (lookups[name] ?? []).find(r => String(r[key]) === String(value))?.[label] ?? value;
  const iconButton = (action, id, icon, color, label) => `<button type="button" class="btn btn-outline-${color}" data-${action}="${e(id)}" aria-label="${e(label)}" title="${e(label)}"><i class="bi bi-${icon}" aria-hidden="true"></i></button>`;
  const actions = row => ` ${kind === "users" && row.has_password ? iconButton("reset", row[config.id], "key", "info", "รีเซ็ตรหัสผ่าน") : ""} ${iconButton("edit", row[config.id], "pencil", "warning", "Edit")} ${iconButton("delete", row[config.id], "trash3", "danger", "Delete")} `;
  const host = root.querySelector("#list");
  if (kind === "operations") {
    const { today, dates } = monthDates();
    originalTable(host, dates, ["DATE", "Mission Director (MD)", "Flight and Mission Operator (FMO)", "Ground Station Operator (GSO)", "Action"], date => {
      const duties = rows.filter(row => row.operation_date === date);
      return `<tr class="${date === today ? "table-danger fw-bold" : ""}"><td class="text-center">${calendarDate(date, today)}</td>${["MD", "FMO", "GSO"].map(role => `<td class="text-center">${display(duties.find(row => row.rbac_role === role)?.rbac_fullname ?? "-")}</td>`).join("")}<td class="text-center">${display(duties.find(row => row.rbac_role === "MD")?.operation_note ?? "-")}</td></tr>`;
    }, 50);
  } else {
    const columns = kind === "missions" ? [["mission_name", "Mision"], ["mission_note", "Description"]] : kind === "troubles" ? [["trouble_name", "Trouble"], ["sub_id", "Subsystem"], ["trouble_note", "Description"]] : config.fields.slice(0, 6).map(([key, label]) => [key, label]);
    originalTable(host, [...rows].sort((a, b) => Number(a[config.id]) - Number(b[config.id])), ["No.", ...columns.map(([, label]) => label), kind === "users" ? "หมายเหตุ" : "Action"], (row, i) => `<tr><td class="text-center">${i + 1}</td>${columns.map(([key]) => `<td class="${kind === "users" && ["rbac_role", "rbac_status"].includes(key) ? "text-center" : ""}">${display(key === "sub_id" ? lookup("subsystems", "sub_id", row[key], "sub_name") : row[key])}</td>`).join("")}<td class="text-center">${actions(row)}</td></tr>`);
  }
  if (kind === "users") {
    host.classList.replace("p-3", "p-0");
    host.querySelector("table").classList.add("mb-0");
    host.querySelectorAll("thead th").forEach(th => th.classList.add("text-center"));
  } else if (kind !== "operations") {
    host.querySelector("th:first-child").style.width = "80px";
    host.querySelector("th:last-child").style.width = "160px";
  }
  const editor = root.querySelector("#editor");
  const openModal = (title, body, footer, handler) => {
    const returnFocus = document.activeElement;
    editor.innerHTML = `<div class="modal-dialog"><form class="modal-content"><div class="modal-header"><h5 class="modal-title" id="editor-title">${e(title)}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body">${alertBox}${body}</div><div class="modal-footer">${footer}</div></form></div>`;
    const modal = new window.bootstrap.Modal(editor);
    let saving = false;
    const keepOpenWhileSaving = event => { if (saving) event.preventDefault(); };
    editor.addEventListener("hide.bs.modal", keepOpenWhileSaving);
    editor.addEventListener("shown.bs.modal", () => editor.querySelector("input,select,textarea,button[type=submit]")?.focus(), { once: true });
    editor.addEventListener("hidden.bs.modal", () => { editor.removeEventListener("hide.bs.modal", keepOpenWhileSaving); modal.dispose(); if (returnFocus?.isConnected) returnFocus.focus(); }, { once: true });
    submitForm(editor.querySelector("form"), async f => {
      saving = true;
      try { await handler(f); } finally { saving = false; }
      const closed = new Promise(resolve => editor.addEventListener("hidden.bs.modal", resolve, { once: true }));
      modal.hide();
      await closed;
      try { await management(root, kind); }
      catch (error) { root.querySelector('[role="alert"]').textContent = error.message; }
    });
    modal.show();
  };
  const edit = (row = {}) => {
    const editing = Boolean(row[config.id]);
    const fields = config.fields.map(([key, label, options], index) => {
      if (kind === "missions" && editing) label = key === "mission_name" ? "ชื่อภารกิจ" : "หมายเหตุ";
      let value = row[key] ?? options.value ?? (key === "rbac_status" ? "Active" : "");
      if (key === "rbac_status" && String(value).toLowerCase() === "notactive") value = "Notactive";
      let markup = field(key, label, { ...options, value, options: options.lookup ? (lookups[options.lookup] ?? []).map(r => [r[options.key], r[options.label]]) : options.options });
      if (kind === "users") return markup.replace('type="text"', `type="text" placeholder="${e(label)}"`).replace('class="form-control"', 'class="form-control mb-2"');
      if (index > 0) markup = markup.replace('class="form-label"', 'class="form-label mt-3"');
      return markup;
    });
    const body = kind === "users" ? fields.slice(0, 6).join("") : fields.join("");
    openModal(kind === "users" ? "User" : `${editing ? "Edit" : "Add"} ${config.item}`, body, `${kind === "operations" && editing ? `<button type="button" class="btn btn-outline-danger me-auto" id="delete-operation">Delete</button>` : ""}<button type="submit" class="btn btn-mono-primary"><i class="bi bi-floppy" aria-hidden="true"></i> Save</button>`, async f => {
      const body = Object.fromEntries(f);
      if (!body.password) delete body.password;
      await (editing ? api.put(`/${kind}/${encodeURIComponent(row[config.id])}`, body) : api.post(`/${kind}`, body));
    });
    if (kind === "operations" && editing) editor.querySelector("#delete-operation").onclick = async event => {
      if (!confirm("ยืนยันการลบข้อมูล ?")) return;
      event.currentTarget.disabled = true;
      try {
        await api.delete(`/${kind}/${encodeURIComponent(row[config.id])}`);
        editor.addEventListener("hidden.bs.modal", () => management(root, kind).catch(error => { root.querySelector('[role="alert"]').textContent = error.message; }), { once: true });
        window.bootstrap.Modal.getInstance(editor).hide();
      } catch (error) { editor.querySelector('[role="alert"]').textContent = error.message; event.target.disabled = false; }
    };
  };
  if (root.querySelector("#create")) root.querySelector("#create").onclick = () => edit();
  host.addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.edit) edit(rows.find(row => String(row[config.id]) === button.dataset.edit));
    if (button.dataset.delete) openModal(`Delete ${config.item}`, "ต้องการลบข้อมูลนี้หรือไม่?", '<button type="submit" class="btn btn-danger">Delete</button>', () => api.delete(`/${kind}/${encodeURIComponent(button.dataset.delete)}`));
    if (kind === "users" && button.dataset.reset) {
      button.disabled = true;
      root.querySelector('[role="alert"]').textContent = "";
      root.querySelector("#management-status").textContent = "";
      try {
        if (await resetPassword(api, button.dataset.reset, message => confirm(message))) root.querySelector("#management-status").textContent = "รีเซ็ตรหัสผ่านแล้ว ผู้ใช้ต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบ";
      } catch (error) { root.querySelector('[role="alert"]').textContent = error.message; }
      finally { button.disabled = false; }
    }
  });
}





