const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

const idx = isr.indexOf('pr=');
if (idx !== -1) {
  console.log('--- Code around pr= ---');
  console.log(isr.slice(Math.max(0, idx - 100), Math.min(isr.length, idx + 800)));
} else {
  // Let's search for widget type definitions
  const m = isr.match(/\[["'`][a-z\-]+["'`],\s*["'`][^"'`]+["'`]/g);
  console.log('Matches:', m);
}
