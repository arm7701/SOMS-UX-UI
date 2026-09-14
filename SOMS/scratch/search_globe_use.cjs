const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

const idx = isr.indexOf('DashboardGlobe');
if (idx !== -1) {
  console.log('--- Code around DashboardGlobe in isr-main.js ---');
  console.log(isr.slice(Math.max(0, idx - 400), Math.min(isr.length, idx + 1200)));
}
