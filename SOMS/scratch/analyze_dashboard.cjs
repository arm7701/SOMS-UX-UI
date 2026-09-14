const fs = require('fs');

const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

// Find Dashboard component definition
const dMatches = isr.match(/Dashboard[a-zA-Z0-9_]*/g) || [];
console.log('Dashboard identifiers:', [...new Set(dMatches)]);

// Find all API endpoints called
const apiMatches = isr.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
console.log('API endpoints:', [...new Set(apiMatches)]);

// Find widget types
const wTypes = isr.match(/type:\s*["'`][^"'`]+["'`]/g) || [];
console.log('Types:', [...new Set(wTypes)].slice(0, 30));

// Find Dashboard template or render function snippets
const idx = isr.indexOf('dashboard-stage');
if (idx !== -1) {
  console.log('\n--- Code around dashboard-stage ---');
  console.log(isr.slice(Math.max(0, idx - 500), Math.min(isr.length, idx + 1500)));
}
