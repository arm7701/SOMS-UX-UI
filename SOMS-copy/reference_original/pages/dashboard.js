import { api } from '../api.js';
import { e } from '../components.js';

let charts = [];
let revision = 0;
export function disposeDashboard() {
  revision += 1;
  charts.forEach(chart => chart.destroy());
  charts = [];
}
const numeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const chartDefinitions = [
  ['altitudeNapa2', 'Altitude – NAPA-2 (km)', 'altitude_km', 'Altitude (km)', 'Kilometers', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['missionIssues', 'Mission Anomalies (จำนวนครั้ง)', null, 'จำนวนครั้ง', 'Occurrences', '#dc3545', '#dc3545'],
  ['velocityGraph', 'Velocity (km/s)', 'velocity_km_s', 'Velocity (km/s)', 'Velocity (km/s)', '#dc3545', 'rgba(220,53,69,0.1)'],
  ['inclinationGraph', 'Inclination (°)', 'inclination_deg', 'Inclination (°)', 'Inclination (°)', '#ffc107', 'rgba(255,193,7,0.1)'],
  ['orbitalPeriodGraph', 'Orbital Period (min)', 'orbital_period_min', 'Orbital Period (min)', 'Orbital Period (min)', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['tleAgeGraph', 'TLE Age (hours)', 'tle_age_hours', 'TLE Age (hours)', 'TLE Age (hours)', '#28a745', 'rgba(40,167,69,0.1)'],
  ['meanMotionGraph', 'Mean Motion', 'mean_motion', 'Mean Motion', 'Mean Motion', '#6f42c1', 'rgba(111,66,193,0.1)'],
  ['eccentricityGraph', 'Eccentricity', 'eccentricity', 'Eccentricity', 'Eccentricity', '#17a2b8', 'rgba(23,162,184,0.1)'],
];
function series(rows, key) {
  const days = [...new Set(rows.map(row => row.epoch_date).filter(Boolean))].sort().slice(-7);
  return {
    labels: days,
    values: days.map(date => {
      const values = rows.filter(row => row.epoch_date === date && numeric(row[key])).map(row => Number(row[key]));
      return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
    }),
  };
}
const emptyChart = {
  id: 'emptyData',
  afterDraw(chart) {
    if (chart.data.datasets.some(dataset => dataset.data.some(numeric))) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.fillStyle = '#6c757d';
    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillText('No data', (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2);
    ctx.restore();
  },
};
function passCard(passes, id, name) {
  const rows = passes.filter(pass => Number(pass.satellite_id) === id).sort((a, b) => String(a.aos_time_utc).localeCompare(String(b.aos_time_utc)));
  const content = ['Day', 'Night'].map(kind => rows.filter(pass => (Number(String(pass.aos_time_utc).slice(0, 2)) < 13 ? 'Day' : 'Night') === kind).map((pass, index) => `<div class="mb-2"><span class="fw-bold text-${kind === 'Day' ? 'success' : 'primary'}">${kind}Pass-${index + 1} :</span> ${e(pass.aos_time_utc)} – ${e(pass.los_time_utc)} (UTC)</div>`).join('')).join('');
  return `<div class="col-md-6"><div class="card shadow-sm h-100"><div class="card-body"><h6 class="fw-bold mb-3">Pass Detail (${name})</h6>${content || '<div class="text-muted">No pass today</div>'}</div></div></div>`;
}
export async function dashboard(root) {
  disposeDashboard();
  const current = revision;
  const data = await api.get('/dashboard');
  if (current !== revision) return;
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).formatToParts(now);
  const part = type => dateParts.find(item => item.type === type)?.value ?? '';
  const dateLabel = `${part('weekday')}, ${part('day')} ${part('month').replace('Sept', 'Sep')} ${part('year')}`;
  const summary = [[46320, 'NAPA-1 N'], [48963, 'NAPA-2 N']].map(([id, name]) => {
    const satellite = (data.satellites ?? []).find(row => Number(row.norad_id) === id);
    const altitude = numeric(satellite?.altitude_km) ? `${Number(Number(satellite.altitude_km).toFixed(2))} KM` : '—';
    return `<div class="col-md-3"><div class="card shadow-sm h-100 text-center"><div class="card-body"><h6 class="fw-bold">${name}</h6><div class="text-muted">Altitude</div><div class="h4 fw-bold text-primary" title="${e(satellite?.epoch_date ?? 'No observation')} ${e(satellite?.epoch_time ?? '')} UTC">${altitude}</div></div></div></div>`;
  }).join('');
  const weather = [['r', 'Radio Blackout'], ['s', 'Solar Radiation Storm'], ['g', 'Geomagnetic Storm']].map(([key, label]) => {
    const value = data.weather?.[`spaceweather_${key}`];
    const color = numeric(value) ? ['#28a745', '#85c440', '#ffc107', '#fd7e14', '#e8491e', '#dc3545'][Number(value)] ?? '#6c757d' : '#6c757d';
    return `<div class="col"><div class="h4 fw-bold" style="color:${color}">${key.toUpperCase()}${numeric(value) ? e(value) : '—'}</div><small>${label}</small></div>`;
  }).join('');
  const chartRows = [];
  for (let index = 0; index < chartDefinitions.length; index += 2) {
    chartRows.push(`<div class="row g-3 mb-4">${chartDefinitions.slice(index, index + 2).map(([id, title]) => `<div class="col-md-6"><div class="card shadow-sm"><div class="card-body"><h6 class="fw-bold text-center">${title}</h6><canvas id="${id}" height="120" role="img" aria-label="${e(title)}"></canvas></div></div></div>`).join('')}</div>`);
  }
  const operators = [['MD', 'Mission Director (MD)'], ['FMO', 'Flight and Mission Operator (FMO)'], ['GSO', 'Ground Station Operator (GSO)']].map(([role, label]) => {
    const names = (data.operations ?? []).filter(row => row.rbac_role === role).map(row => row.rbac_fullname).filter(Boolean);
    return `<div class="col-md-4"><div class="fw-bold">${e([...new Set(names)].join(', ') || '-')}</div><small class="text">${label}</small></div>`;
  }).join('');
  root.innerHTML = `<div class="mb-3"><h3 class="fw-bold">${dateLabel}</h3></div><div class="row g-3 mb-4">${summary}<div class="col-md-6"><div class="card shadow-sm h-100"><div class="card-body"><h6 class="fw-bold mb-3" title="${e(data.weather?.spaceweather_date ?? 'No observation')}">Space Weather</h6><div class="row text-center">${weather}</div></div></div></div></div><div class="row g-3 mb-4">${passCard(data.passes ?? [], 46320, 'NAPA-1 N')}${passCard(data.passes ?? [], 48963, 'NAPA-2 N')}</div>${chartRows.join('')}<div class="card shadow-sm"><div class="card-header fw-bold">Mission Operator</div><div class="card-body text-center"><div class="row">${operators}</div></div></div>`;
  const history = (data.altitudeHistory ?? []).filter(row => Number(row.norad_id) === 48963);
  for (const [id, title, key, label, unit, color, fill] of chartDefinitions) {
    // The API has no anomaly counts; do not reproduce the original hard-coded examples.
    const values = key ? series(history, key) : { labels: [], values: [] };
    const canvas = root.querySelector(`#${id}`);
    canvas.setAttribute('aria-label', `${title}: ${values.values.some(numeric) ? values.labels.map((day, index) => `${day}: ${values.values[index] ?? 'No data'}`).join('; ') : 'No data'}`);
    if (!globalThis.Chart) {
      canvas.replaceWith(Object.assign(document.createElement('p'), { className: 'text-muted text-center', textContent: 'Chart unavailable' }));
      continue;
    }
    charts.push(new globalThis.Chart(canvas, {
      type: key ? 'line' : 'bar',
      data: { labels: values.labels, datasets: [{ label, data: values.values, borderColor: color, backgroundColor: fill, fill: true, tension: 0.3, spanGaps: false, borderRadius: key ? 0 : 6 }] },
      plugins: [emptyChart],
      options: { responsive: true, plugins: { legend: { display: Boolean(key) } }, scales: { y: { ...(key ? {} : { beginAtZero: true, ticks: { stepSize: 1 } }), title: { display: true, text: unit } } } },
    }));
  }
}
