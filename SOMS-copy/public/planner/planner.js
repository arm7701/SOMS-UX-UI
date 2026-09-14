
// ─── Satellite catalogue ──────────────────────────────────────────────────────
const SATS = {
  '46320': { name:'NAPA-1',      color:'#38bdf8', maxRoll:20,  swathKm:19,   imageDurSec:4.500, preRollSec:3.0, gsKms:6.20, gsdM:5.0,  conf:true  },
  '48963': { name:'NAPA-2',      color:'#58a6ff', maxRoll:20,  swathKm:19,   imageDurSec:4.775, preRollSec:3.0, gsKms:6.18, gsdM:1.0,  conf:true  },
  '58016': { name:'THEOS-2',     color:'#3fb950', maxRoll:45,  swathKm:10.3, imageDurSec:3.0,   preRollSec:1.5, gsKms:6.90, gsdM:0.5,  conf:false },
  '33396': { name:'THEOS-1',     color:'#d29922', maxRoll:30,  swathKm:22,   imageDurSec:4.0,   preRollSec:2.0, gsKms:6.60, gsdM:2.5,  conf:false },
  '40697': { name:'Sentinel-2A', color:'#c084fc', maxRoll:20.6,swathKm:290,  imageDurSec:30.0,  preRollSec:2.0, gsKms:7.16, gsdM:10.0, conf:true  },
  '42063': { name:'Sentinel-2B', color:'#e879f9', maxRoll:20.6,swathKm:290,  imageDurSec:30.0,  preRollSec:2.0, gsKms:7.16, gsdM:10.0, conf:true  },
  '60989': { name:'Sentinel-2C', color:'#a855f7', maxRoll:20.6,swathKm:290,  imageDurSec:30.0,  preRollSec:2.0, gsKms:7.16, gsdM:10.0, conf:true  },
  '39084': { name:'Landsat 8',   color:'#f78166', maxRoll:7.5, swathKm:185,  imageDurSec:24.0,  preRollSec:2.0, gsKms:7.00, gsdM:30.0, conf:true  },
  '49260': { name:'Landsat 9',   color:'#ff9f1c', maxRoll:7.5, swathKm:185,  imageDurSec:24.0,  preRollSec:2.0, gsKms:7.00, gsdM:30.0, conf:true  },
};

// Default checked satellites
const DEFAULT_CHECKED = new Set(['46320','48963','58016','40697','42063','39084']);

const BUILTIN_IDS = Object.keys(SATS);

// Single satOrder covering all sats — init from localStorage, fallback to BUILTIN_IDS
let satOrder = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('sat_order')||'[]');
    if (!Array.isArray(stored) || stored.length === 0) return [...BUILTIN_IDS];
    const valid   = stored.filter(id => SATS[id]);
    const missing = BUILTIN_IDS.filter(id => !valid.includes(id));
    return [...valid, ...missing];
  } catch(e) { return [...BUILTIN_IDS]; }
})();

function saveSatOrder() {
  try { localStorage.setItem('sat_order', JSON.stringify(satOrder)); } catch(e) {}
}

function getOrderedSatIds() {
  const all = Object.keys(SATS);
  if (!satOrder.length) return all;
  const ordered = satOrder.filter(id => SATS[id]);
  const extra   = all.filter(id => !ordered.includes(id));
  return [...ordered, ...extra];
}

// ─── Add Satellite tab switch ─────────────────────────────────────────────────
function switchAddTab(tab) {
  document.getElementById('add-norad').style.display = tab==='norad' ? 'block' : 'none';
  document.getElementById('add-tle').style.display   = tab==='tle'   ? 'block' : 'none';
  document.getElementById('at-norad').classList.toggle('act', tab==='norad');
  document.getElementById('at-tle').classList.toggle('act',   tab==='tle');
  document.getElementById('custom-note').textContent = '';
}

async function addByNorad() {
  const idRaw  = document.getElementById('add-norad-id').value.trim();
  const nameIn = document.getElementById('add-norad-name').value.trim();
  const note   = document.getElementById('custom-note');
  if (!idRaw || !/^\d{4,6}$/.test(idRaw)) { note.textContent='กรุณาใส่ NORAD ID (ตัวเลข 4-6 หลัก)'; note.style.color='#f85149'; return; }
  if (SATS[idRaw]) { note.textContent='ดาวเทียม '+idRaw+' มีอยู่แล้ว'; note.style.color='#d29922'; return; }
  note.textContent='กำลังดึง TLE...'; note.style.color='#bae6fd';
  const color = CUSTOM_COLORS[++customCount % CUSTOM_COLORS.length];
  // Add placeholder first
  SATS[idRaw] = { name: nameIn||'SAT-'+idRaw, color, maxRoll:30, swathKm:20, imageDurSec:5.0, preRollSec:2.0, gsKms:6.5, gsdM:5.0, conf:false, isCustom:true };
  DEFAULT_CHECKED.add(idRaw);
  satOrder.push(idRaw);
  buildSatList();
  const ok = await fetchTLE(idRaw);
  if (ok && nameIn) { SATS[idRaw].name = nameIn; buildSatList(); }
  note.textContent = ok ? '✓ เพิ่ม "'+(SATS[idRaw]?.name||idRaw)+'" แล้ว — ปรับ Sensor Specs ได้' : '✗ ดึง TLE ไม่สำเร็จ — ลอง Paste TLE แทน';
  note.style.color = ok ? '#3fb950' : '#f85149';
  document.getElementById('add-norad-id').value = '';
  document.getElementById('add-norad-name').value = '';
}

function renameSat(id) {
  const cur = SATS[id]?.name || id;
  const newName = prompt('เปลี่ยนชื่อดาวเทียม:', cur);
  if (!newName || newName===cur) return;
  SATS[id].name = newName;
  buildSatList();
  // Update specsel
  const sel = document.getElementById('specsel');
  if (sel) { const opt = sel.querySelector(`option[value="${id}"]`); if (opt) opt.textContent = newName; }
}



// TLE storage: satId → '3-line string'
const TLE_STORE = {};

// Satrec cache
const SATREC_CACHE = {};

// All computed passes (all sats combined)
let allPasses = [];
let cloudData = null; // { times:[], cover:[] }
let currentFilter = 'all';
let pLayers = [], tgtMarker = null, map = null;

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('view-passes').style.display   = tab==='passes'   ? 'block'  : 'none';
  document.getElementById('view-timeline').style.display = tab==='timeline' ? 'flex'   : 'none';
  document.getElementById('view-timeline').style.flexDirection = 'column';
  document.getElementById('tab-passes').classList.toggle('act',   tab==='passes');
  document.getElementById('tab-timeline').classList.toggle('act', tab==='timeline');
  if (tab==='timeline') { updateTimelineTargetList(); drawTimeline(); }
}

function updateTimelineTargetList() {
  const sel = document.getElementById('tl-target');
  const prev = sel.value;
  sel.innerHTML = savedTargets.length
    ? savedTargets.map(t=>`<option value="${t.id}">${t.name} (${t.lat.toFixed(3)},${t.lon.toFixed(3)})</option>`).join('')
    : '<option value="">— บันทึก Target ก่อน —</option>';
  if (prev) sel.value = prev;
}

function drawTimeline() {
  const canvas = document.getElementById('tlcanvas');
  const wrap   = document.getElementById('view-timeline');
  const W = wrap.clientWidth || 700;
  const headerH = 32;
  const rowH = 22, rowPad = 3;
  const lblW = 90;

  // Collect satellites that have passes
  const satIds = [...new Set(allPasses.map(p=>p.satId))];
  if (!satIds.length) {
    canvas.width=W; canvas.height=80;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#93c5fd'; ctx.font='12px "Prompt", sans-serif'; ctx.textAlign='center';
    ctx.fillText('ยังไม่มีข้อมูล — กด Calculate Passes ก่อนครับ', W/2, 44);
    return;
  }

  // Time range from date pickers
  const dsVal = document.getElementById('date-start').value;
  const deVal = document.getElementById('date-end').value;
  const tMin  = dsVal ? new Date(dsVal+'T00:00:00').getTime() : allPasses[0].aos.getTime();
  const tMax  = deVal ? new Date(deVal+'T23:59:59').getTime() : allPasses[allPasses.length-1].los.getTime();
  const tSpan = tMax - tMin;

  const H = headerH + satIds.length*(rowH+rowPad) + 24;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.height = H+'px';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);

  // Background
  ctx.fillStyle = '#10141b';
  ctx.fillRect(0,0,W,H);

  // Day grid lines
  const dayMs = 86400000;
  ctx.strokeStyle = '#283548';
  ctx.lineWidth   = 1;
  let dayT = Math.ceil(tMin/dayMs)*dayMs;
  while (dayT <= tMax) {
    const x = lblW + (dayT-tMin)/tSpan*(W-lblW-8);
    ctx.beginPath(); ctx.moveTo(x,headerH); ctx.lineTo(x,H-4); ctx.stroke();
    // Date label
    const d = new Date(dayT+7*3600000);
    ctx.fillStyle='#94a3b8'; ctx.font='9px "Prompt", monospace'; ctx.textAlign='center';
    ctx.fillText(d.toISOString().slice(5,10), x, 12);
    dayT += dayMs;
  }

  // Hour ticks (every 6h)
  const h6 = 6*3600000;
  ctx.strokeStyle = '#1c2637';
  let hT = Math.ceil(tMin/h6)*h6;
  while (hT <= tMax) {
    const x = lblW + (hT-tMin)/tSpan*(W-lblW-8);
    ctx.beginPath(); ctx.moveTo(x,headerH); ctx.lineTo(x,H-4); ctx.stroke();
    hT += h6;
  }

  // Rows
  satIds.forEach((id, ri) => {
    const s    = SATS[id] || {};
    const y    = headerH + ri*(rowH+rowPad);
    const passes = allPasses.filter(p => p.satId===id);

    // Sat label
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 10.5px "Prompt", sans-serif'; ctx.textAlign='right';
    ctx.fillText(s.name||id, lblW-4, y+rowH/2+4);

    // Row bg
    ctx.fillStyle = ri%2===0 ? '#151c27' : '#10141b';
    ctx.fillRect(lblW, y, W-lblW-4, rowH);

    // Pass bars
    passes.forEach(p => {
      const x1 = lblW + (p.aos.getTime()-tMin)/tSpan*(W-lblW-8);
      const x2 = lblW + (p.los.getTime()-tMin)/tSpan*(W-lblW-8);
      const bw  = Math.max(x2-x1, 2);

      // Bar fill — dim if not feasible/night
      ctx.globalAlpha = p.isGood ? 1.0 : p.rollFeasible ? 0.55 : 0.3;
      ctx.fillStyle   = s.color||'#58a6ff';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x1, y+2, bw, rowH-4, 3) : ctx.rect(x1, y+2, bw, rowH-4);
      ctx.fill();

      // White border for Good passes
      if (p.isGood) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x1, y+2, bw, rowH-4, 3) : ctx.rect(x1, y+2, bw, rowH-4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  });

  // Now-line
  const nowX = lblW + (Date.now()-tMin)/tSpan*(W-lblW-8);
  if (nowX > lblW && nowX < W-8) {
    ctx.strokeStyle='#f85149'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(nowX,headerH); ctx.lineTo(nowX,H-4); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#f85149'; ctx.font='8px sans-serif'; ctx.textAlign='center';
    ctx.fillText('NOW', nowX, headerH-2);
  }

  // Click handler
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX-rect.left)*(W/rect.width);
    const my   = (e.clientY-rect.top)*(H/rect.height);
    const ri   = Math.floor((my-headerH)/(rowH+rowPad));
    if (ri < 0 || ri >= satIds.length) return;
    const id   = satIds[ri];
    const tClick = tMin + (mx-lblW)/(W-lblW-8)*tSpan;
    const pass = allPasses.find(p => p.satId===id && p.aos.getTime()<=tClick && p.los.getTime()>=tClick);
    if (pass) {
      switchTab('passes');
      showPass(allPasses.indexOf(pass));
    }
  };
}


let savedTargets = JSON.parse(localStorage.getItem('sat_targets')||'[]');
let activeTargetId = null;

function saveTarget() {
  const lat = parseFloat(document.getElementById('lat').value);
  const lon = parseFloat(document.getElementById('lon').value);
  if (isNaN(lat)||isNaN(lon)) { alert('คลิกแผนที่ก่อนครับ'); return; }
  const name = prompt('ตั้งชื่อ target:', 'Target '+(savedTargets.length+1));
  if (!name) return;
  const id = Date.now().toString();
  savedTargets.push({ id, name, lat, lon });
  localStorage.setItem('sat_targets', JSON.stringify(savedTargets));
  renderTargetList();
  setActiveTarget(id);
}

function loadTarget(id) {
  const t = savedTargets.find(t=>t.id===id);
  if (!t) return;
  document.getElementById('lat').value = t.lat.toFixed(4);
  document.getElementById('lon').value = t.lon.toFixed(4);
  setTgt(t.lat, t.lon);
  document.getElementById('minfo').textContent = t.name+' · '+t.lat.toFixed(4)+'°N, '+t.lon.toFixed(4)+'°E — กด Calculate Passes';
  setActiveTarget(id);
}

function deleteTarget(id) {
  savedTargets = savedTargets.filter(t=>t.id!==id);
  localStorage.setItem('sat_targets', JSON.stringify(savedTargets));
  if (activeTargetId===id) activeTargetId=null;
  renderTargetList();
}

function setActiveTarget(id) {
  activeTargetId = id;
  renderTargetList();
}

function renderTargetList() {
  const el = document.getElementById('targetlist');
  if (!savedTargets.length) {
    el.innerHTML='<div style="font-size:10px;color:#94a3b8;padding:4px 0">ยังไม่มี target — คลิกแผนที่แล้วกด Save</div>';
    return;
  }
  el.innerHTML = savedTargets.map(t => `
    <div class="tgt-item ${t.id===activeTargetId?'active':''}" onclick="loadTarget('${t.id}')">
      <span style="font-size:14px;flex-shrink:0">📍</span>
      <div style="flex:1;min-width:0">
        <div class="tgt-name">${t.name}</div>
        <div class="tgt-coord">${t.lat.toFixed(4)}°N ${t.lon.toFixed(4)}°E</div>
      </div>
      <button class="tgt-del" onclick="event.stopPropagation();deleteTarget('${t.id}')" title="ลบ">✕</button>
    </div>`).join('');
}


const CUSTOM_COLORS = ['#a5f3fc','#fde68a','#bbf7d0','#fecaca','#ddd6fe','#fed7aa','#f9a8d4'];
let customCount = 0;

function addCustomTLE() {
  const raw = document.getElementById('custom-tle').value.trim();
  const note = document.getElementById('custom-note');
  if (!raw) { note.textContent = 'กรุณาใส่ TLE ก่อน'; note.style.color='#f85149'; return; }

  const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean);
  if (lines.length < 2) { note.textContent = 'TLE ต้องมีอย่างน้อย 2 บรรทัด'; note.style.color='#f85149'; return; }

  const hasName = !lines[0].startsWith('1 ');
  const name  = hasName ? lines[0].slice(0,20).trim() : 'Custom-'+(++customCount);
  const tle1  = hasName ? lines[1] : lines[0];
  const tle2  = hasName ? lines[2] : lines[1];
  if (!tle1 || !tle2) { note.textContent = 'TLE ไม่ครบ 2 บรรทัด'; note.style.color='#f85149'; return; }

  // Validate
  let satrec;
  try { satrec = satellite.twoline2satrec(tle1, tle2); } catch(e) { note.textContent = 'TLE format ผิด'; note.style.color='#f85149'; return; }
  if (satrec.error) { note.textContent = 'TLE error: '+satrec.error; note.style.color='#f85149'; return; }

  // Extract NORAD from line 1
  const norad = 'C'+tle1.substring(2,7).trim();
  const color = CUSTOM_COLORS[customCount % CUSTOM_COLORS.length];

  // Add to SATS
  SATS[norad] = { name, color, maxRoll:30, swathKm:20, imageDurSec:5.0, preRollSec:2.0, gsKms:6.5, conf:false, isCustom:true };
  TLE_STORE[norad] = [name, tle1, tle2].join('\n');
  SATREC_CACHE[norad] = satrec;

  // Rebuild sat list & auto-check new entry
  DEFAULT_CHECKED.add(norad);
  buildSatList();

  // Clear textarea
  document.getElementById('custom-tle').value = '';
  note.textContent = '✓ เพิ่ม "'+name+'" แล้ว — ปรับ Sensor Specs ได้ด้านล่าง';
  note.style.color = '#3fb950';
}


function buildSatList() {
  const el = document.getElementById('satlist');
  el.innerHTML = '';
  const specSel = document.getElementById('specsel');
  specSel.innerHTML = '';
  let dragSrcId = null;

  getOrderedSatIds().forEach(id => {
    const s = SATS[id];
    if (!s) return;
    const checked = DEFAULT_CHECKED.has(id);
    const hasTLE  = !!TLE_STORE[id];
    const stHtml  = hasTLE ? `<span style="color:#4ade80;font-size:9.5px;font-weight:600">TLE ✓</span>` : `<span style="color:#94a3b8;font-size:9.5px">no TLE</span>`;
    const fetchBtn = s.isCustom
      ? `<button class="sat-fetch" title="Remove" onclick="event.stopPropagation();removeSat('${id}')" style="color:#f87171">✕</button>`
      : `<button class="sat-fetch" id="fb_${id}" title="Fetch TLE" onclick="event.stopPropagation();fetchTLE('${id}')">↓</button>
         <button class="sat-fetch" title="Remove" onclick="event.stopPropagation();removeSat('${id}')" style="color:#f87171">✕</button>`;

    const row = document.createElement('div');
    row.className = 'sat-item';
    row.draggable = true;
    row.dataset.id = id;
    row.innerHTML = `
      <span class="sat-drag" title="ลากเพื่อเรียงลำดับ">⠿</span>
      <input type="checkbox" id="chk_${id}" ${checked?'checked':''} onclick="event.stopPropagation();updateSpecBox()" style="width:14px;height:14px;cursor:pointer;flex-shrink:0;accent-color:#64748b">
      <div class="sat-dot" style="background:${s.color}"></div>
      <span class="sat-name" style="color:#ffffff;font-size:11.5px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</span>
      <span class="sat-status" id="st_${id}">${stHtml}</span>
      <button class="sat-edit" title="เปลี่ยนชื่อ" onclick="event.stopPropagation();renameSat('${id}')">✎</button>
      ${fetchBtn}`;

    row.onclick = (e) => { if (!e.target.closest('input,button')) toggleSat(e, id); };

    // Drag events
    row.addEventListener('dragstart', e => {
      dragSrcId = id;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    });
    row.addEventListener('dragend', e => {
      dragSrcId = null;
      row.classList.remove('dragging');
      el.querySelectorAll('.drag-over').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', e => { row.classList.remove('drag-over'); });
    row.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      row.classList.remove('drag-over');
      const fromId = e.dataTransfer.getData('text/plain') || dragSrcId;
      if (!fromId || fromId === id) return;
      // Build full ordered list and reorder
      const ids = getOrderedSatIds();
      const fromIdx = ids.indexOf(fromId);
      const toIdx   = ids.indexOf(id);
      if (fromIdx < 0 || toIdx < 0) return;
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, fromId);
      satOrder = ids;
      saveSatOrder();
      buildSatList();
    });

    el.appendChild(row);
    specSel.innerHTML += `<option value="${id}">${s.name}</option>`;
  });
  updateSpecBox();
}

function removeSat(id) {
  if (!SATS[id]) return;
  const name = SATS[id].name;
  // Remove from satOrder so it disappears from list
  satOrder = satOrder.filter(x => x !== id);
  saveSatOrder();
  // For custom sats: fully delete from SATS
  if (!BUILTIN_IDS.includes(id)) {
    delete SATS[id];
    delete TLE_STORE[id];
    delete SATREC_CACHE[id];
  }
  DEFAULT_CHECKED.delete(id);
  // Remember removed built-ins so they don't reappear on reload
  try {
    const removed = JSON.parse(localStorage.getItem('sat_removed')||'[]');
    if (!removed.includes(id)) { removed.push(id); localStorage.setItem('sat_removed', JSON.stringify(removed)); }
  } catch(e) {}
  buildSatList();
  const note = document.getElementById('custom-note');
  if (note) { note.textContent = 'ลบ "'+name+'" แล้ว — เพิ่มกลับได้ด้วย NORAD ID'; note.style.color='#bae6fd'; }
}

function toggleSat(e, id) {
  const chk = document.getElementById('chk_'+id);
  chk.checked = !chk.checked;
  updateSpecBox();
}

function updateSpecBox() {
  const anyChecked = Object.keys(SATS).some(id => document.getElementById('chk_'+id)?.checked);
  document.getElementById('specbox').style.display = anyChecked ? 'block' : 'none';
  // Load spec for first checked
  const first = Object.keys(SATS).find(id => document.getElementById('chk_'+id)?.checked);
  if (first) {
    document.getElementById('specsel').value = first;
    loadSpec();
  }
}

function loadSpec() {
  const id = document.getElementById('specsel').value;
  if (!id || !SATS[id]) return;
  const s = SATS[id];
  document.getElementById('s-roll').value  = s.maxRoll;
  document.getElementById('s-swath').value = s.swathKm;
  document.getElementById('s-dur').value   = s.imageDurSec;
  document.getElementById('s-pre').value   = s.preRollSec;
  document.getElementById('s-gs').value    = s.gsKms;
  document.getElementById('s-gsd').value   = s.gsdM || 1.0;
  const saved = JSON.parse(localStorage.getItem('sat_specs')||'{}');
  const msg = document.getElementById('specmsg');
  if (msg) msg.textContent = saved[id] ? '✓ ใช้ค่าที่บันทึกไว้' : 'ค่า default';
  if (msg) msg.style.color = saved[id] ? '#4ade80' : '#bae6fd';
}

function saveSpec() {
  const id = document.getElementById('specsel').value;
  if (!id || !SATS[id]) return;
  const vals = {
    maxRoll:     parseFloat(document.getElementById('s-roll').value),
    swathKm:     parseFloat(document.getElementById('s-swath').value),
    imageDurSec: parseFloat(document.getElementById('s-dur').value),
    preRollSec:  parseFloat(document.getElementById('s-pre').value),
    gsKms:       parseFloat(document.getElementById('s-gs').value),
    gsdM:        parseFloat(document.getElementById('s-gsd').value),
  };
  // Save to SATS object
  Object.assign(SATS[id], vals);
  // Persist to localStorage
  const saved = JSON.parse(localStorage.getItem('sat_specs')||'{}');
  saved[id] = vals;
  localStorage.setItem('sat_specs', JSON.stringify(saved));
  const msg = document.getElementById('specmsg');
  if (msg) { msg.textContent = '✓ บันทึกแล้ว — กด Calculate ใหม่เพื่ออัปเดตผล'; msg.style.color='#3fb950'; }
}

function applySavedSpecs() {
  const saved = JSON.parse(localStorage.getItem('sat_specs')||'{}');
  Object.entries(saved).forEach(([id, vals]) => {
    if (SATS[id]) Object.assign(SATS[id], vals);
  });
}

function getSpecFor(id) {
  const s = SATS[id];
  return {
    maxRoll:     s.maxRoll,
    swathKm:     s.swathKm,
    imageDurSec: s.imageDurSec,
    preRollSec:  s.preRollSec,
    gsKms:       s.gsKms,
    gsdM:        s.gsdM || 1.0,
    color:       s.color,
    name:        s.name
  };
}

// ─── TLE Fetch ────────────────────────────────────────────────────────────────
// Use allorigins.win which returns JSON { contents: "..." }
async function fetchTLE(id) {
  const btn = document.getElementById('fb_'+id);
  const st  = document.getElementById('st_'+id);
  if (btn) { btn.textContent = '↻'; btn.className = 'sat-fetch loading'; btn.disabled = true; }
  if (st)  { st.innerHTML = '<span style="color:#38bdf8">fetching...</span>'; }

  const celestrakUrl = `https://celestrak.org/SPACETRACK/query/rest/gp/NORAD_CAT_ID/${id}/orderby/EPOCH%20desc/limit/1/format/TLE`;

  // Strategy 1: tle.ivanstanojevic.me — CORS enabled, no proxy needed
  async function tryDirect() {
    const resp = await fetch(`https://tle.ivanstanojevic.me/api/tle/${id}`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error('HTTP '+resp.status);
    const j = await resp.json();
    if (!j.line1 || !j.line2) throw new Error('no TLE');
    return [(j.name||SATS[id]?.name||'SAT').trim(), j.line1.trim(), j.line2.trim()];
  }

  // Strategy 2: allorigins.win proxy → Celestrak
  async function tryAllOrigins() {
    const resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(celestrakUrl)}`, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('HTTP '+resp.status);
    const j = await resp.json();
    const lines = (j.contents||'').trim().split('\n').map(l=>l.trim()).filter(l=>l.length>10);
    if (lines.length < 2) throw new Error('empty');
    const l1 = lines.find(l=>l.startsWith('1 ')), l2 = lines.find(l=>l.startsWith('2 '));
    if (!l1||!l2) throw new Error('bad format');
    const name = lines.find(l=>!l.startsWith('1 ')&&!l.startsWith('2 ')) || (SATS[id]?.name||'SAT');
    return [name.trim(), l1, l2];
  }

  // Strategy 3: corsproxy.io → Celestrak
  async function tryCorsproxy() {
    const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('HTTP '+resp.status);
    const text = await resp.text();
    const lines = text.trim().split('\n').map(l=>l.trim()).filter(l=>l.length>10);
    if (lines.length < 2) throw new Error('empty');
    const l1 = lines.find(l=>l.startsWith('1 ')), l2 = lines.find(l=>l.startsWith('2 '));
    if (!l1||!l2) throw new Error('bad format');
    const name = lines.find(l=>!l.startsWith('1 ')&&!l.startsWith('2 ')) || (SATS[id]?.name||'SAT');
    return [name.trim(), l1, l2];
  }

  let result = null;
  const strategies = [
    { fn: tryDirect,     label: 'TLE API' },
    { fn: tryAllOrigins, label: 'AllOrigins' },
    { fn: tryCorsproxy,  label: 'CorsProxy' },
  ];

  for (const s of strategies) {
    try {
      result = await s.fn();
      console.log(`[TLE] ${id} fetched via ${s.label}`);
      break;
    } catch(e) {
      console.warn(`[TLE] ${id} failed ${s.label}: ${e.message}`);
    }
  }

  if (result) {
    const [name, l1, l2] = result;
    TLE_STORE[id] = [name, l1, l2].join('\n');
    SATREC_CACHE[id] = null;
    const epoch = l1.substring(18,32).trim().slice(0,8);
    if (st) st.innerHTML = `<span style="color:#3fb950">TLE ✓ ${epoch}</span>`;
    if (btn) { btn.textContent = '✓'; btn.className = 'sat-fetch ok'; }
  } else {
    if (st) st.innerHTML = `<span style="color:#f85149">failed</span>`;
    if (btn) { btn.textContent = '!'; btn.className = 'sat-fetch err'; }
  }
  if (btn) btn.disabled = false;
  return !!result;
}

async function fetchAllTLEs() {
  const checked = Object.keys(SATS).filter(id => document.getElementById('chk_'+id)?.checked);
  await Promise.all(checked.map(id => fetchTLE(id)));
}

function getSatrec(id) {
  if (SATREC_CACHE[id]) return SATREC_CACHE[id];
  const tle = TLE_STORE[id];
  if (!tle) return null;
  const lines = tle.split('\n').map(l=>l.trim()).filter(Boolean);
  const l1 = lines.length >= 3 ? lines[1] : lines[0];
  const l2 = lines.length >= 3 ? lines[2] : lines[1];
  try {
    const sr = satellite.twoline2satrec(l1, l2);
    if (sr.error) return null;
    SATREC_CACHE[id] = sr;
    return sr;
  } catch(e) { return null; }
}

// ─── Cloud Cover (Open-Meteo, free, CORS OK) ─────────────────────────────────
async function fetchCloudCover(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloudcover&timezone=UTC&forecast_days=7`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) throw new Error('HTTP '+resp.status);
    const json = await resp.json();
    cloudData = { times: json.hourly.time, cover: json.hourly.cloudcover };
  } catch(e) {
    cloudData = null;
  }
}

function getCloudCover(dt) {
  if (!cloudData) return null;
  const iso = dt.toISOString().slice(0,13); // "YYYY-MM-DDTHH"
  const idx = cloudData.times.findIndex(t => t.startsWith(iso));
  if (idx < 0) return null;
  return cloudData.cover[idx];
}

// ─── Map ─────────────────────────────────────────────────────────────────────
function setLayer(name, btn){
  if(window._curLayer) map.removeLayer(window._curLayer);
  window._curLayer = window._layers[name];
  window._curLayer.addTo(map);
  document.querySelectorAll('.ls-btn').forEach(b=>b.classList.remove('ls-act'));
  if(btn) btn.classList.add('ls-act');
  try{localStorage.setItem('map_layer',name);}catch(e){}
}

function initMap() {
  map = L.map('map', { center:[13,101], zoom:5 });
  window._layers = {
    dark:   L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CARTO',maxZoom:19,subdomains:'abcd'}),
    sat:    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Imagery © Esri',maxZoom:19}),
    hybrid: (()=>{ const base=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Imagery © Esri',maxZoom:19}); const labels=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,opacity:.9}); return L.layerGroup([base,labels]); })(),
    street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19,subdomains:'abc'}),
  };
  // Default map layer to 'sat' (Satellite imagery as in SOMS reference) or restore saved layer
  let saved = 'sat';
  try {
    const stored = localStorage.getItem('map_layer');
    if (stored && window._layers[stored]) saved = stored;
  } catch(e) {}

  window._curLayer = window._layers[saved] || window._layers.sat;
  window._curLayer.addTo(map);

  // Layer switcher UI
  const _lsWrap = document.createElement('div');
  _lsWrap.style.cssText = 'position:absolute;bottom:28px;left:10px;z-index:999;display:flex;gap:4px';
  _lsWrap.innerHTML = '<button onclick="setLayer(\'dark\',this)" class="ls-btn '+(saved==='dark'?'ls-act':'')+'">🌑 Dark</button><button onclick="setLayer(\'sat\',this)" class="ls-btn '+(saved==='sat'?'ls-act':'')+'">🛰 Satellite</button><button onclick="setLayer(\'hybrid\',this)" class="ls-btn '+(saved==='hybrid'?'ls-act':'')+'">🌐 Hybrid</button><button onclick="setLayer(\'street\',this)" class="ls-btn '+(saved==='street'?'ls-act':'')+'">🗺 Street</button>';
  document.getElementById('mwrap').appendChild(_lsWrap);
  map.on('click', e => {
    document.getElementById('lat').value = e.latlng.lat.toFixed(4);
    document.getElementById('lon').value = e.latlng.lng.toFixed(4);
    setTgt(e.latlng.lat, e.latlng.lng);
    document.getElementById('minfo').textContent = 'Target: '+e.latlng.lat.toFixed(4)+'°N, '+e.latlng.lng.toFixed(4)+'°E — กด Calculate Passes';
  });
  setTgt(13.9125, 100.6067);
}

function setTgt(lat, lon) {
  if (tgtMarker) map.removeLayer(tgtMarker);
  tgtMarker = L.marker([lat,lon], {icon:L.divIcon({
    html:`<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="none" stroke="#f85149" stroke-width="1.5"/><line x1="11" y1="2" x2="11" y2="7" stroke="#f85149" stroke-width="1.5"/><line x1="11" y1="15" x2="11" y2="20" stroke="#f85149" stroke-width="1.5"/><line x1="2" y1="11" x2="7" y2="11" stroke="#f85149" stroke-width="1.5"/><line x1="15" y1="11" x2="20" y2="11" stroke="#f85149" stroke-width="1.5"/><circle cx="11" cy="11" r="2.5" fill="#f85149"/></svg>`,
    className:'',iconSize:[22,22],iconAnchor:[11,11]
  })}).addTo(map).bindTooltip(lat.toFixed(4)+'°N, '+lon.toFixed(4)+'°E');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtT(d) {
  const lc = new Date(d.getTime()+7*3600000);
  return lc.toISOString().replace('T',' ').slice(0,19);
}
function fmtTime(d) { return fmtT(d).slice(11); }

function bearingBetween(la1,lo1,la2,lo2) {
  const dL=(lo2-lo1)*Math.PI/180;
  const y=Math.sin(dL)*Math.cos(la2*Math.PI/180);
  const x=Math.cos(la1*Math.PI/180)*Math.sin(la2*Math.PI/180)
          -Math.sin(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.cos(dL);
  return((Math.atan2(y,x)*180/Math.PI)+360)%360;
}

function sunEl(dt, lat, lon) {
  const JD=dt.getTime()/86400000+2440587.5, n=JD-2451545.0;
  const L=((280.46+0.9856474*n)%360+360)%360;
  const g=((357.528+0.9856003*n)%360+360)%360, gr=g*Math.PI/180;
  const lam=(L+1.915*Math.sin(gr)+0.02*Math.sin(2*gr))*Math.PI/180;
  const eps=23.439*Math.PI/180;
  const dec=Math.asin(Math.sin(eps)*Math.sin(lam));
  const ra=Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam));
  const UT=dt.getUTCHours()+dt.getUTCMinutes()/60+dt.getUTCSeconds()/3600;
  const gmst=((6.697375+0.0657098242*n+UT)%24+24)%24;
  const lmst=((gmst+lon/15)%24+24)%24;
  const RAh=((ra*12/Math.PI)%24+24)%24;
  const HA=(lmst-RAh)*15*Math.PI/180;
  const lr=lat*Math.PI/180;
  return Math.asin(Math.sin(lr)*Math.sin(dec)+Math.cos(lr)*Math.cos(dec)*Math.cos(HA))*180/Math.PI;
}

function computeFootprint(tLat, tLon, bearingDeg, spec) {
  const B=bearingDeg*Math.PI/180;
  const pre=spec.preRollSec*spec.gsKms, post=(spec.imageDurSec-spec.preRollSec)*spec.gsKms, hw=spec.swathKm/2;
  function pt(da,dc){
    return [tLat+(da*Math.cos(B)+dc*(-Math.sin(B)))/111,
            tLon+(da*Math.sin(B)+dc*Math.cos(B))/(111*Math.cos(tLat*Math.PI/180))];
  }
  return [pt(-pre,-hw),pt(-pre,+hw),pt(+post,+hw),pt(+post,-hw)];
}

// ─── Main calc ───────────────────────────────────────────────────────────────
async function calc() {
  const lat  = parseFloat(document.getElementById('lat').value);
  const lon  = parseFloat(document.getElementById('lon').value);
  const minElDeg = parseFloat(document.getElementById('minel').value)||10;

  // Date range
  const dsVal = document.getElementById('date-start').value;
  const deVal = document.getElementById('date-end').value;
  if (!dsVal || !deVal) { alert('กรุณาเลือก Start Date และ End Date'); return; }
  const t0 = new Date(dsVal+'T00:00:00').getTime();
  const t1 = new Date(deVal+'T23:59:59').getTime();
  if (t1 <= t0) { alert('End Date ต้องมากกว่า Start Date'); return; }
  const daysDiff = (t1-t0)/86400000;
  if (daysDiff > 14) { alert('ช่วงวันที่สูงสุด 14 วันครับ'); return; }

  const checked = Object.keys(SATS).filter(id => document.getElementById('chk_'+id)?.checked);
  const ready   = checked.filter(id => TLE_STORE[id]);

  if (ready.length === 0) {
    // Auto-fetch then calc
    setSpin(true,'กำลังดึง TLE...');
    await fetchAllTLEs();
    const nowReady = checked.filter(id => TLE_STORE[id]);
    if (nowReady.length === 0) { setSpin(false); alert('ดึง TLE ไม่สำเร็จสำหรับดาวเทียมที่เลือก'); return; }
  }

  setSpin(true,'กำลังดึงข้อมูลเมฆ...');
  await fetchCloudCover(lat, lon);

  setSpin(true,'กำลังคำนวณ orbital passes...');
  await new Promise(r=>setTimeout(r,30));

  const minEl = minElDeg*Math.PI/180;
  const obs   = { longitude:satellite.degreesToRadians(lon), latitude:satellite.degreesToRadians(lat), height:0.001 };
  const STEP       = 30000;
  const TRACK_STEP = 5000;
  allPasses   = [];

  for (const id of checked) {
    const satrec = getSatrec(id);
    if (!satrec) continue;
    const spec = getSpecFor(id);
    let inP=false, pAOS, pLOS_t, pMaxEl=0, pMaxElDt, pAz=0, pAlt=0;

    // Pass 1: detect pass windows at 30s resolution
    const passWindows = [];
    for (let t=t0; t<=t1; t+=STEP) {
      const d  = new Date(t);
      const pv = satellite.propagate(satrec, d);
      const pos = pv?.position;
      if (!pos || typeof pos !== 'object') continue;
      const gmst = satellite.gstime(d);
      const ecf  = satellite.eciToEcf(pos, gmst);
      const look = satellite.ecfToLookAngles(obs, ecf);
      const el   = look.elevation;
      const gd   = satellite.eciToGeodetic(pos, gmst);
      const sAlt = gd.height;
      if (sAlt<0) continue;

      if (!inP && el>=minEl) {
        inP=true; pAOS=t; pMaxEl=el; pMaxElDt=d; pAz=look.azimuth; pAlt=sAlt;
      } else if (inP) {
        if (el>pMaxEl) { pMaxEl=el; pMaxElDt=d; pAz=look.azimuth; pAlt=sAlt; }
        if (el<minEl) {
          inP=false;
          passWindows.push({ aos:pAOS, los:t, maxEl:pMaxEl, maxElDt:pMaxElDt, az:pAz, alt:pAlt });
          pMaxEl=0;
        }
      }
    }

    // Pass 2: for each window, re-scan at 5s to get precise track + maxEl
    for (const win of passWindows) {
      let pTrack=[], wMaxEl=0, wMaxElDt=win.maxElDt, wAz=win.az, wAlt=win.alt;
      let wAOS=null, wLOS=null;

      for (let t=win.aos-STEP; t<=win.los+STEP; t+=TRACK_STEP) {
        const d  = new Date(t);
        const pv = satellite.propagate(satrec, d);
        const pos = pv?.position;
        if (!pos || typeof pos !== 'object') continue;
        const gmst = satellite.gstime(d);
        const ecf  = satellite.eciToEcf(pos, gmst);
        const look = satellite.ecfToLookAngles(obs, ecf);
        const el   = look.elevation;
        const gd   = satellite.eciToGeodetic(pos, gmst);
        const sLat = satellite.radiansToDegrees(gd.latitude);
        let   sLon = satellite.radiansToDegrees(gd.longitude);
        if (sLon>180) sLon-=360;
        const sAlt = gd.height;
        if (sAlt<0) continue;

        if (el >= minEl) {
          if (!wAOS) wAOS = d;
          wLOS = d;
          const last = pTrack[pTrack.length-1];
          if (last !== null && last !== undefined && Math.abs(sLon - last[1]) > 180) pTrack.push(null);
          pTrack.push([sLat, sLon]);
          if (el > wMaxEl) { wMaxEl=el; wMaxElDt=d; wAz=look.azimuth; wAlt=sAlt; }
        }
      }
      if (!wAOS || !wLOS || pTrack.length < 2) continue;

      const Re=6371;
      const offNabs = Math.asin(Re*Math.cos(wMaxEl)/(Re+wAlt))*180/Math.PI;
      let bearing=180;
      let offN = offNabs; // will be signed below
      try {
        const d1=new Date(wMaxElDt.getTime()-10000), d2=new Date(wMaxElDt.getTime()+10000);
        const pv1=satellite.propagate(satrec,d1), pv2=satellite.propagate(satrec,d2);
        if (pv1?.position && pv2?.position) {
          const g1=satellite.eciToGeodetic(pv1.position,satellite.gstime(d1));
          const g2=satellite.eciToGeodetic(pv2.position,satellite.gstime(d2));
          const ssLat1=satellite.radiansToDegrees(g1.latitude);
          const ssLon1=satellite.radiansToDegrees(g1.longitude);
          const ssLat2=satellite.radiansToDegrees(g2.latitude);
          const ssLon2=satellite.radiansToDegrees(g2.longitude);
          bearing=bearingBetween(ssLat1,ssLon1,ssLat2,ssLon2);

          // Sub-satellite nadir at maxElDt
          const pvM=satellite.propagate(satrec,wMaxElDt);
          if (pvM?.position) {
            const gdM=satellite.eciToGeodetic(pvM.position,satellite.gstime(wMaxElDt));
            const ssLat=satellite.radiansToDegrees(gdM.latitude);
            let   ssLon=satellite.radiansToDegrees(gdM.longitude);
            if(ssLon>180) ssLon-=360;
            // Bearing from sub-sat to target
            const bearToTarget = bearingBetween(ssLat, ssLon, lat, lon);
            // Cross-track angle: positive = target is RIGHT of flight direction
            let crossAngle = bearToTarget - bearing;
            if (crossAngle > 180)  crossAngle -= 360;
            if (crossAngle < -180) crossAngle += 360;
            offN = crossAngle >= 0 ? offNabs : -offNabs;
          }
        }
      } catch(e){}
      const sunElev=sunEl(wMaxElDt,lat,lon);
      // Half-swath angle at satellite altitude
      const halfSwathAngle = Math.atan((spec.swathKm/2) / wAlt) * 180/Math.PI;
      // Capture mode: if |offNadir| <= halfSwathAngle, target is within swath without rolling
      const inSwath = Math.abs(offN) <= halfSwathAngle;
      // For in-swath, satellite doesn't need to roll at all — it just images nadir
      // For roll-required, satellite must actively slew
      const captureMode = inSwath ? 'swath' : 'roll';
      const rollFeasible = inSwath || (Math.abs(offN) <= spec.maxRoll);
      // GSD at off-nadir angle (simple cos model: GSD = GSD_nadir / cos(θ))
      const offNrad = Math.abs(offN) * Math.PI / 180;
      const gsdAtAngle = (spec.gsdM / Math.cos(offNrad));
      const cloud=getCloudCover(wMaxElDt);
      const isGood=rollFeasible&&sunElev>5&&wMaxEl*180/Math.PI>=15;
      allPasses.push({
        satId:id, satName:spec.name, satColor:spec.color,
        spec, satrec,
        aos:wAOS, los:wLOS, dur:(wLOS-wAOS)/1000,
        maxEl:wMaxEl*180/Math.PI, az:wAz*180/Math.PI, alt:wAlt,
        offNadir:offN, rollFeasible, captureMode, gsdAtAngle,
        sunElev, cloud, isGood,
        track:pTrack, maxElDt:wMaxElDt, bearing,
        imageStartDt:new Date(wMaxElDt.getTime()-spec.preRollSec*1000),
        imageEndDt:new Date(wMaxElDt.getTime()+(spec.imageDurSec-spec.preRollSec)*1000)
      });
    }
  }

  // Sort by AOS time
  allPasses.sort((a,b) => a.aos-b.aos);

  setSpin(false);
  applyFilter(currentFilter);
  renderStats();
  updateTimelineTargetList();
  if (document.getElementById('tab-timeline').classList.contains('act')) drawTimeline();
  clearPL();
  const first = filteredPasses().find(p=>p.isGood) || filteredPasses()[0];
  if (first) showPass(allPasses.indexOf(first));
}

function setSpin(on, msg='') {
  document.getElementById('spin').style.display = on ? 'flex' : 'none';
  if (msg) document.getElementById('spinmsg').textContent = msg;
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act');
  applyFilter(f);
}

function filteredPasses() {
  switch(currentFilter) {
    case 'good':     return allPasses.filter(p=>p.isGood);
    case 'feasible': return allPasses.filter(p=>p.rollFeasible);
    case 'day':      return allPasses.filter(p=>p.sunElev>5);
    default:         return allPasses;
  }
}

function applyFilter(f) {
  currentFilter = f;
  const ps = filteredPasses();
  document.getElementById('rescount').textContent = ps.length+' / '+allPasses.length+' passes';
  renderTbl(ps);
}

// ─── Render table ─────────────────────────────────────────────────────────────
function renderTbl(ps) {
  const tb = document.getElementById('tbl');
  if (!ps.length) {
    tb.innerHTML='<tr><td colspan="16" style="text-align:center;padding:24px;color:#94a3b8">ไม่พบ pass ตาม filter ที่เลือก</td></tr>';
    return;
  }
  tb.innerHTML = ps.map((p,i) => {
    const realIdx = allPasses.indexOf(p);
    const dm=Math.floor(p.dur/60), ds=Math.round(p.dur%60);
    const elC  = p.maxEl>=45?'#38bdf8':p.maxEl>=30?'#4ade80':p.maxEl>=15?'#fde047':'#94a3b8';
    const rollC = p.rollFeasible?'#4ade80':'#f87171';
    const rollSign = p.offNadir >= 0 ? '+' : '';
    const sunC  = p.sunElev>10?'#4ade80':p.sunElev>0?'#fde047':'#94a3b8';
    const feasBadge = p.rollFeasible
      ? '<span class="bd bg">✓</span>'
      : `<span class="bd br">✗ ${rollSign}${p.offNadir.toFixed(1)}°</span>`;
    // Cloud badge
    let cloudBadge = '<span style="color:#94a3b8">—</span>';
    if (p.cloud !== null && p.cloud !== undefined) {
      const cc = p.cloud;
      const ccC = cc<=30?'#4ade80':cc<=60?'#fde047':'#f87171';
      cloudBadge = `<span style="color:${ccC};font-weight:600">${cc}%</span>`;
    }
    const statusBadge = p.sunElev<-5
      ? '<span class="bd br">Night</span>'
      : !p.rollFeasible
        ? '<span class="bd br">OutRange</span>'
        : p.isGood
          ? '<span class="bd bg">Good ✓</span>'
          : '<span class="bd ba">Marginal</span>';
    const along = (p.spec.imageDurSec*p.spec.gsKms).toFixed(1);
    // Capture mode badge
    const modeBadge = p.captureMode==='swath'
      ? '<span class="bd bi" title="Target อยู่ใน swath โดยไม่ต้อง roll">Swath</span>'
      : `<span class="bd ba" title="ต้อง roll ไปถ่าย">Roll</span>`;
    // GSD at angle
    const gsdC = p.gsdAtAngle <= p.spec.gsdM*1.05 ? '#4ade80'
               : p.gsdAtAngle <= p.spec.gsdM*1.2  ? '#fde047' : '#f87171';
    const gsdTxt = p.rollFeasible ? `<span style="color:${gsdC};font-weight:600">${p.gsdAtAngle.toFixed(1)}</span>` : '—';
    return `<tr onclick="showPass(${realIdx})" id="r${realIdx}">
      <td style="color:#cbd5e1;font-weight:600;font-family:monospace">${i+1}</td>
      <td><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:${p.satColor};flex-shrink:0"></span><span style="color:#ffffff;font-weight:600;font-size:11px">${p.satName}</span></span></td>
      <td style="font-family:monospace;font-size:10px">${fmtT(p.aos).slice(5)}</td>
      <td>${dm}m ${ds}s</td>
      <td style="color:${elC};font-weight:600">${p.maxEl.toFixed(1)}°</td>
      <td style="color:${rollC};font-weight:600">${rollSign}${p.offNadir.toFixed(1)}°</td>
      <td>${modeBadge}</td>
      <td>${feasBadge}</td>
      <td>${gsdTxt}</td>
      <td style="font-family:monospace;font-size:10px">${p.rollFeasible?fmtTime(p.imageStartDt):'—'}</td>
      <td style="font-family:monospace;font-size:10px;font-weight:600">${p.rollFeasible?fmtTime(p.maxElDt):'—'}</td>
      <td style="font-family:monospace;font-size:10px">${p.rollFeasible?fmtTime(p.imageEndDt):'—'}</td>
      <td style="color:#e2e8f0">${p.rollFeasible?along+' km':'—'}</td>
      <td style="color:${sunC}">${p.sunElev.toFixed(1)}°</td>
      <td>${cloudBadge}</td>
      <td>${statusBadge}</td>
    </tr>`;
  }).join('');
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function renderStats() {
  const el = document.getElementById('stats');
  if (!allPasses.length) { el.style.display='none'; return; }
  const good  = allPasses.filter(p=>p.isGood).length;
  const feas  = allPasses.filter(p=>p.rollFeasible).length;
  const best  = allPasses.reduce((b,p)=>p.maxEl>b.maxEl?p:b, allPasses[0]);
  const bysat = {};
  allPasses.forEach(p=>{ bysat[p.satName]=(bysat[p.satName]||0)+1; });
  const satline = Object.entries(bysat).map(([n,c])=>n+':'+c).join(' · ');
  document.getElementById('sbody').innerHTML =
    `<div class="srow"><span class="sl">Total passes</span><span class="sv">${allPasses.length}</span></div>`+
    `<div class="srow"><span class="sl">Good imaging</span><span class="sv" style="color:${good?'#4ade80':'#94a3b8'}">${good}</span></div>`+
    `<div class="srow"><span class="sl">Feasible</span><span class="sv">${feas}</span></div>`+
    `<div class="srow"><span class="sl">Best elev</span><span class="sv" style="color:#ffffff">${best.maxEl.toFixed(1)}° (${best.satName})</span></div>`+
    `<div class="srow"><span class="sl">By sat</span><span class="sv" style="font-size:9.5px;color:#94a3b8">${satline}</span></div>`;
  el.style.display='block';
}

// ─── Map display ─────────────────────────────────────────────────────────────
function clearPL() { pLayers.forEach(l=>map.removeLayer(l)); pLayers=[]; }

function showPass(idx) {
  clearPL();
  const p = allPasses[idx];
  if (!p) return;
  const spec = p.spec;
  const lat = parseFloat(document.getElementById('lat').value);
  const lon = parseFloat(document.getElementById('lon').value);

  // Highlight row
  document.querySelectorAll('#tbl tr').forEach(r=>r.classList.remove('ar'));
  const row = document.getElementById('r'+idx);
  if (row) { row.classList.add('ar'); row.scrollIntoView({block:'nearest',behavior:'smooth'}); }

  // Ground track
  let seg=[], allPts=[];
  for (const pt of p.track) {
    if (pt===null) {
      if (seg.length>1) pLayers.push(L.polyline(seg,{color:spec.color,weight:2,opacity:.6,dashArray:'5 4'}).addTo(map));
      seg=[];
    } else { seg.push(pt); allPts.push(pt); }
  }
  if (seg.length>1) pLayers.push(L.polyline(seg,{color:spec.color,weight:2,opacity:.6,dashArray:'5 4'}).addTo(map));

  if (allPts.length) {
    pLayers.push(L.circleMarker(allPts[0],{radius:5,color:'#3fb950',fillColor:'#3fb950',fillOpacity:1,weight:2}).addTo(map).bindTooltip('AOS '+fmtTime(p.aos)));
    pLayers.push(L.circleMarker(allPts[allPts.length-1],{radius:5,color:'#f85149',fillColor:'#f85149',fillOpacity:1,weight:2}).addTo(map).bindTooltip('LOS '+fmtTime(p.los)));
  }

  if (p.rollFeasible) {
    const color = spec.color;
    const fp = computeFootprint(lat, lon, p.bearing, spec);
    const startM = [(fp[0][0]+fp[1][0])/2,(fp[0][1]+fp[1][1])/2];
    const endM   = [(fp[2][0]+fp[3][0])/2,(fp[2][1]+fp[3][1])/2];
    const cloudTxt = p.cloud!==null ? `Cloud: <b>${p.cloud}%</b><br>` : '';
    const rollSignM = p.offNadir >= 0 ? '+' : '';
    const modeTxt = p.captureMode==='swath' ? 'In Swath (no roll)' : `Roll ${rollSignM}${p.offNadir.toFixed(1)}°`;
    const gsdTxt2 = `GSD: <b>${p.gsdAtAngle.toFixed(1)} m</b> (nadir: ${p.spec.gsdM} m)<br>`;
    const poly = L.polygon(fp,{color,fillColor:color,fillOpacity:.18,weight:2}).addTo(map);
    poly.bindPopup(
      `<div style="font-size:11px;line-height:1.9;font-family:monospace">
      <b style="color:${color}">${spec.name} · Strip</b><br>
      IMG START : <b>${fmtT(p.imageStartDt).slice(5)}</b><br>
      TARGET TS : <b style="color:${color}">${fmtT(p.maxElDt).slice(5)}</b><br>
      IMG END   : <b>${fmtT(p.imageEndDt).slice(5)}</b><br>
      <span style="border-top:1px solid #333;display:block;margin:3px 0"></span>
      ${cloudTxt}${gsdTxt2}Along: ${(spec.imageDurSec*spec.gsKms).toFixed(1)} km · Swath: ${spec.swathKm} km<br>
      Mode: <b>${modeTxt}</b> / max ±${spec.maxRoll}°
      </div>`,{maxWidth:280}
    );
    pLayers.push(poly);
    pLayers.push(L.circleMarker(startM,{radius:5,color,fillColor:'#10141b',fillOpacity:1,weight:2}).addTo(map).bindTooltip('▶ IMG START '+fmtTime(p.imageStartDt)));
    pLayers.push(L.circleMarker(endM,{radius:5,color,fillColor:color,fillOpacity:1,weight:2}).addTo(map).bindTooltip('■ IMG END '+fmtTime(p.imageEndDt)));
    const tsIcon=L.divIcon({html:`<div style="background:${color};color:#090b0f;font-family:'Prompt',monospace;font-size:9.5px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;margin-top:4px;box-shadow:0 2px 6px rgba(0,0,0,0.6)">TS ${fmtTime(p.maxElDt)}</div>`,className:'',iconAnchor:[0,0]});
    pLayers.push(L.marker([lat,lon],{icon:tsIcon}).addTo(map));

    // Look vector
    try {
      const pv = satellite.propagate(p.satrec, p.maxElDt);
      if (pv?.position) {
        const gd=satellite.eciToGeodetic(pv.position,satellite.gstime(p.maxElDt));
        let ssLat=satellite.radiansToDegrees(gd.latitude), ssLon=satellite.radiansToDegrees(gd.longitude);
        if(ssLon>180) ssLon-=360;
        pLayers.push(L.polyline([[ssLat,ssLon],[lat,lon]],{color:'#d29922',weight:1.5,opacity:.5,dashArray:'3 4'}).addTo(map).bindTooltip('Look vector · Roll: '+p.offNadir.toFixed(1)+'°'));
        pLayers.push(L.circleMarker([ssLat,ssLon],{radius:4,color:'#d29922',fillColor:'#d29922',fillOpacity:.8,weight:1}).addTo(map).bindTooltip('Sub-sat nadir'));
      }
    } catch(e){}
  } else {
    pLayers.push(L.circle([lat,lon],{radius:30000,color:'#f85149',fillColor:'#f85149',fillOpacity:.05,weight:1.5,dashArray:'6 4'}).addTo(map).bindTooltip('Roll req: '+p.offNadir.toFixed(1)+'° > max '+spec.maxRoll+'°'));
  }

  if (allPts.length) {
    const lats=allPts.map(x=>x[0]).concat([lat]);
    const lons=allPts.map(x=>x[1]).concat([lon]);
    try { map.fitBounds([[Math.min(...lats)-1.5,Math.min(...lons)-2.5],[Math.max(...lats)+1.5,Math.max(...lons)+2.5]],{padding:[30,30]}); } catch(e){}
  }
}

// ─── Sidebar resize ───────────────────────────────────────────────────────────
(function(){
  const handle = document.getElementById('sb-resize');
  const sb     = document.getElementById('sb');
  let dragging = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startW = sb.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.min(480, Math.max(200, startW + e.clientX - startX));
    sb.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try { localStorage.setItem('sb_width', sb.offsetWidth); } catch(e){}
    if (map) map.invalidateSize();
  });
  // Restore saved width
  try {
    const w = parseInt(localStorage.getItem('sb_width'));
    if (w >= 200 && w <= 480) sb.style.width = w + 'px';
  } catch(e){}
})();



// ─── Accordion ────────────────────────────────────────────────────────────────
function acToggle(id){
  const body=document.getElementById(id);
  const tog=document.getElementById('tog-'+id);
  if(!body) return;
  const collapsed=body.classList.toggle('collapsed');
  if(tog) tog.textContent=collapsed?'+':'−';
  try{
    const s=JSON.parse(localStorage.getItem('sat_ac_state')||'{}');
    s[id]=collapsed; localStorage.setItem('sat_ac_state',JSON.stringify(s));
  }catch(e){}
}

function restoreAcState(){
  try{
    const s=JSON.parse(localStorage.getItem('sat_ac_state')||'{}');
    Object.entries(s).forEach(([id,collapsed])=>{
      if(collapsed){
        const body=document.getElementById(id);
        const tog=document.getElementById('tog-'+id);
        if(body) body.classList.add('collapsed');
        if(tog) tog.textContent='+';
      }
    });
  }catch(e){}
}

// ─── Panel resize ─────────────────────────────────────────────────────────────
(function(){
  const handle=document.getElementById('panel-resize');
  const tblwrap=document.getElementById('tblwrap');
  if(!handle||!tblwrap) return;
  let d=false,sy=0,sh=0;
  handle.addEventListener('mousedown',e=>{
    d=true; sy=e.clientY; sh=tblwrap.offsetHeight;
    handle.classList.add('dragging');
    document.body.style.cssText='cursor:row-resize;user-select:none';
    e.preventDefault();
  });
  document.addEventListener('mousemove',e=>{
    if(!d) return;
    const h=Math.min(600,Math.max(40,sh-(e.clientY-sy)));
    tblwrap.style.height=h+'px';
  });
  document.addEventListener('mouseup',()=>{
    if(!d) return; d=false;
    handle.classList.remove('dragging');
    document.body.style.cssText='';
    try{localStorage.setItem('sat_tbl_h',tblwrap.offsetHeight);}catch(e){}
  });
  try{const h=parseInt(localStorage.getItem('sat_tbl_h'));if(h>=40&&h<=600)tblwrap.style.height=h+'px';}catch(e){}
})();

function updateClock(){
  const n=new Date(),p=x=>String(x).padStart(2,'0');
  document.getElementById('clk').textContent='UTC '+p(n.getUTCHours())+':'+p(n.getUTCMinutes())+':'+p(n.getUTCSeconds())+'  ·  '+n.toISOString().slice(0,10);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initMap();
  // Filter out previously removed satellites from satOrder on reload
  try {
    const removed = JSON.parse(localStorage.getItem('sat_removed')||'[]');
    satOrder = satOrder.filter(id => !removed.includes(id));
  } catch(e) {}
  applySavedSpecs();
  buildSatList();
  restoreAcState();
  renderTargetList();
  // Set default date range: today → today+3
  const today = new Date();
  const end   = new Date(today); end.setDate(end.getDate()+3);
  const fmt   = d => d.toISOString().slice(0,10);
  document.getElementById('date-start').value = fmt(today);
  document.getElementById('date-end').value   = fmt(end);
  setInterval(updateClock,1000);
  updateClock();
});

/**
 * ฟังก์ชันรับคำสั่งจำลองรอบพาสจากระบบ SOMS เข้าสู่ตัวคำนวณ Planner
 * @param {string|number} satId - รหัส NORAD ID เช่น 46320, 48963
 * @param {number} lat - ละติจูดเป้าหมาย/สถานี (ค่าเริ่มต้น 13.9125 บน.6 ดอนเมือง)
 * @param {number} lon - ลองจิจูดเป้าหมาย/สถานี (ค่าเริ่มต้น 100.6067)
 * @param {string} dateStr - วันที่ YYYY-MM-DD
 */
window.loadSomsPass = async function(satId, lat, lon, dateStr) {
  const sId = String(satId);
  // ตั้งค่าดาวเทียม
  Object.keys(SATS).forEach(id => {
    const chk = document.getElementById('chk_' + id);
    if (chk) chk.checked = (id === sId);
  });
  if (typeof updateSpecBox === 'function') updateSpecBox();

  // ตั้งค่าพิกัด
  const targetLat = (lat !== undefined && lat !== null) ? Number(lat) : 13.9125;
  const targetLon = (lon !== undefined && lon !== null) ? Number(lon) : 100.6067;
  const latInput = document.getElementById('lat');
  const lonInput = document.getElementById('lon');
  if (latInput) latInput.value = targetLat.toFixed(4);
  if (lonInput) lonInput.value = targetLon.toFixed(4);
  setTgt(targetLat, targetLon);

  // ตั้งค่าวันที่
  if (dateStr) {
    const ds = document.getElementById('date-start');
    const de = document.getElementById('date-end');
    if (ds) ds.value = dateStr;
    if (de) de.value = dateStr;
  }

  // ปรับกึ่งกลางแผนที่ Leaflet
  if (map) {
    map.setView([targetLat, targetLon], 6);
    map.invalidateSize();
  }

  // คำนวณพาสทันที
  if (typeof calc === 'function') {
    await calc();
  }
};
