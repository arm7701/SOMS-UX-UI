import { api } from "../api.js";
import { e } from "../components.js";
import { originalHeading, originalTable, monthDates, calendarDate, dateText } from "./management.js";
const alertBox = '<p class="error text-danger mb-0" role="alert" tabindex="-1"></p>';
export async function observations(root, kind) {
  const pass = kind === "passes", altitude = kind === "satellite-data";
  const refresh = ''; // Original page has no provider refresh button.
  root.innerHTML = originalHeading(pass ? "Pass Detail" : altitude ? "ORBITAL ALTITUDE" : "SPACE WEATHER", pass ? "แผนการผ่านดาวเทียม" : altitude ? "ระดับความสูงของวงโคจร" : "สภาพอวกาศ", pass ? "calendar-week" : "ticket-detailed", refresh) + alertBox + '<p id="refresh-status" role="status" class="mb-0"></p>' + (pass
    ? '<div class="card border-0 shadow-sm"><div class="card-header"><form id="filters"><label for="satellite" class="text-secondary">Satellite :</label><select name="satellite" id="satellite" class="form-select" required><option value="">-- Select Satellite --</option><option value="46320">NAPA-1 N</option><option value="48963">NAPA-2 N</option></select><button type="submit" class="btn btn-outline-success">Submit</button> <button type="reset" class="btn btn-outline-danger">Clear</button></form><div id="observations" class="mt-4 border rounded overflow-auto p-3"><p class="text-center mb-0">Detail</p></div></div></div>'
    : '<div class="card border-0 shadow-sm"><div id="observations" class="card-body p-3"></div></div>');
  const host = root.querySelector("#observations");
  let loadVersion = 0;
  const load = async () => {
    const version = ++loadVersion;
    const satellite = pass ? root.querySelector("#satellite").value : "";
    if (pass && !satellite) { host.innerHTML = '<p class="text-center mb-0">Detail</p>'; return; }
    const rows = await api.get(`/${kind}${satellite ? `?satellite_id=${encodeURIComponent(satellite)}` : ""}`);
    if (version !== loadVersion || !host.isConnected) return;
    if (pass) {
      const sorted = [...rows].sort((a, b) => `${a.aos_date_utc} ${a.aos_time_utc}`.localeCompare(`${b.aos_date_utc} ${b.aos_time_utc}`));
      let currentDate = "";
      host.innerHTML = sorted.length ? `<table class="table table-dark table-bordered w-100"><thead><tr class="text-center">${["DateTime (UTC)", "Date (Local)", "AOS (Local)", "LOS (Local)", "Duration", "Max EL.", "Comments"].map((label, index) => `<th scope="col" class="${index === 0 ? "w-25 text-start" : ""}">${e(label)}</th>`).join("")}</tr></thead><tbody>${sorted.map(row => {
        let heading = "";
        if (currentDate !== row.aos_date_utc) { currentDate = row.aos_date_utc; heading = `<tr class="table-secondary"><td colspan="7" class="fw-semibold">📅 ${e(dateText(currentDate, "-"))}</td></tr>`; }
        const utc = new Date(`${row.aos_date_utc}T00:00:00Z`);
        const day = Number.isFinite(utc.getTime()) ? new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(utc) : "";
        const low = Number(row.maxEl) < 5;
        return `${heading}<tr class="${low ? "low-el" : ""}"><td class="text-start">${e(day)},${e(dateText(row.aos_date_utc, "-"))}<br>${e(row.aos_time_utc)} - ${e(row.los_time_utc)} (UTC)</td><td class="text-center">${e(dateText(row.aos_date_local, "-"))}</td><td class="text-center">${e(row.aos_time_local)}</td><td class="text-center">${e(row.los_time_local)}</td><td class="text-center">${e(row.duration_min)}m ${e(row.duration_sec)}s</td><td class="text-center">${Number.isFinite(Number(row.maxEl)) ? Number(row.maxEl).toFixed(2) : "-"}°</td><td class="text-center">${low ? "abort" : "-"}</td></tr>`;
      }).join("")}</tbody></table>` : '<p class="text-center mb-0">Detail</p>';
      return;
    }
    const { today, dates } = monthDates();
    const daily = new Map();
    for (const row of rows) {
      const key = altitude ? `${row.epoch_date}/${row.norad_id}` : row.spaceweather_date;
      if (!daily.has(key) || (altitude && String(row.epoch_time) > String(daily.get(key).epoch_time))) daily.set(key, row);
    }
    const headers = altitude ? ["DATE", "NAPA-1 N", "NAPA-2 N", "Action"] : ["DATE", "Radio Blackout (R)", "Solar Radiation Storm (S)", "Geomagnetic Storm (G)", "Action"];
    originalTable(host, dates, headers, date => {
      const values = altitude ? [46320, 48963].map(id => {
        const value = daily.get(`${date}/${id}`)?.altitude_km;
        return value !== null && value !== undefined && Number.isFinite(Number(value)) ? `${Number(Number(value).toFixed(2))} km` : "-";
      }) : ["r", "s", "g"].map(scale => {
        const value = daily.get(date)?.[`spaceweather_${scale}`];
        return value !== null && value !== undefined ? `${scale.toUpperCase()}${value}` : "-";
      });
      return `<tr class="${date === today ? "table-danger fw-bold" : ""}"><td class="text-center">${calendarDate(date, today)}</td>${values.map(value => `<td class="text-center">${e(value)}</td>`).join("")}<td class="text-center">-</td></tr>`;
    }, 50);
  };
  if (!pass) await load();
  if (pass) {
    root.querySelector("#filters").onsubmit = async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      button.disabled = true;
      try { await load(); root.querySelector('[role="alert"]').textContent = ""; }
      catch (error) { root.querySelector('[role="alert"]').textContent = error.message; }
      finally { button.disabled = false; }
    };
    root.querySelector("#filters").onreset = () => {
      loadVersion++;
      host.innerHTML = '<p class="text-center mb-0">Detail</p>';
      root.querySelector('[role="alert"]').textContent = "";
    };
  }
}
