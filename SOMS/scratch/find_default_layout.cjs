const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

const idx = isr.indexOf('typeId:`globe`');
if (idx !== -1) {
  console.log('--- Code around typeId: globe ---');
  console.log(isr.slice(Math.max(0, idx - 200), Math.min(isr.length, idx + 1000)));
} else {
  const idx2 = isr.indexOf('"globe"');
  console.log('pos of "globe":', idx2);
}
