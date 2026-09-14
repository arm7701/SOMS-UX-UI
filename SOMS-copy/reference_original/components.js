import { escapeHtml as e, chartPoints } from "./model.js";
export function skipToMain(event, documentRoot) {
  event.preventDefault();
  const main = documentRoot.querySelector("#main");
  main?.setAttribute("tabindex", "-1");
  main?.focus();
}
export { e };
export const display = (v) =>
  v === null || v === undefined || v === "" ? "—" : e(v);
export function field(
  name,
  label,
  {
    type = "text",
    value = "",
    required = false,
    options = null,
    min = null,
    maxlength = 255,
  } = {},
) {
  const attrs = `name="${e(name)}" ${required ? "required" : ""}`;
  const control = options
    ? `<select ${attrs}><option value="">เลือก…</option>${options
        .map((o) => {
          const [v, t] = Array.isArray(o) ? o : [o, o];
          return `<option value="${e(v)}" ${String(v) === String(value) ? "selected" : ""}>${e(t)}</option>`;
        })
        .join("")}</select>`
    : type === "textarea"
      ? `<textarea ${attrs} rows="3" maxlength="${maxlength}">${e(value)}</textarea>`
      : `<input ${attrs} type="${type}" value="${e(value)}" ${min !== null ? `min="${min}"` : ""} ${type === "number" ? 'step="any"' : ""} maxlength="${maxlength}">`;
  return `<label class="field">${e(label)}${required ? ' <span aria-hidden="true">*</span>' : ""}${control}</label>`;
}
export function table(rows, columns, actions) {
  if (!rows.length) return '<p class="empty">ยังไม่มีข้อมูลในช่วงที่เลือก</p>';
  return `<div class="table-wrap"><table><thead><tr>${columns.map(([key, label]) => `<th scope="col">${e(label)}</th>`).join("")}${actions ? '<th scope="col">จัดการ</th>' : ""}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map(([key, , format]) => `<td>${format ? format(row[key], row) : display(row[key])}</td>`).join("")}${actions ? `<td class="actions">${actions(row)}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}
export const heading = (title, subtitle = "", action = "") =>
  `<header class="page-heading"><div><h1>${e(title)}</h1><p>${e(subtitle)}</p></div>${action}</header>`;
export const panel = (title, body) =>
  `<section class="panel"><h2>${e(title)}</h2>${body}</section>`;
export function chart(rows, key, label) {
  const points = chartPoints(rows, key)
    .slice()
    .sort((a, b) =>
      `${a.epoch_date ?? a.date ?? a.created_at} ${a.epoch_time ?? ""}`.localeCompare(
        `${b.epoch_date ?? b.date ?? b.created_at} ${b.epoch_time ?? ""}`,
      ),
    );
  if (!points.length) return '<p class="empty">ยังไม่มีข้อมูลสำหรับกราฟ</p>';
  const values = points.map((r) => Number(r[key]));
  const low = Math.min(...values),
    high = Math.max(...values),
    span = high - low || 1;
  const coords = values.map(
    (v, i) =>
      `${55 + (i * 650) / Math.max(1, values.length - 1)},${175 - ((v - low) * 140) / span}`,
  );
  return `<figure><svg viewBox="0 0 740 220" role="img" aria-label="${e(label)} ${low.toFixed(2)} ถึง ${high.toFixed(2)}"><path d="M55 20V180H720" stroke="#536078" fill="none"/><text x="0" y="36">${high.toFixed(1)}</text><text x="0" y="180">${low.toFixed(1)}</text><polyline points="${coords.join(" ")}" fill="none" stroke="#00e5ff" stroke-width="2"/>${coords.map((p, i) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="3" fill="#00e5ff"><title>${e(points[i].epoch_date ?? points[i].created_at ?? "")} : ${values[i]}</title></circle>`).join("")}<text x="55" y="212">${e(points[0].epoch_date ?? points[0].created_at ?? "")}</text></svg><figcaption>${e(label)} · ${points.length} รายการ · ข้อมูลที่บันทึกไว้</figcaption></figure>`;
}
export async function submitForm(form, handler) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector('[role="alert"]');
    if (error) error.textContent = "";
    if (button) button.disabled = true;
    try {
      await handler(new FormData(form));
    } catch (err) {
      if (error) {
        error.textContent = err.message;
        error.focus();
      } else throw err;
    } finally {
      if (button) button.disabled = false;
    }
  });
}
