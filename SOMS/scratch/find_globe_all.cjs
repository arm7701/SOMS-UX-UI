const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

let pos = 0;
while (true) {
  const found = isr.indexOf('DashboardGlobe', pos);
  if (found === -1) break;
  console.log(`Found DashboardGlobe at pos ${found}:`);
  console.log(isr.slice(Math.max(0, found - 200), Math.min(isr.length, found + 300)));
  pos = found + 1;
}
