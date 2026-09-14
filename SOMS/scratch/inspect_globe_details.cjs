const fs = require('fs');

const globe = fs.readFileSync('scratch/original_update/DashboardGlobe-BmO1LG8E.js', 'utf8');

// Find all HTML elements created in DashboardGlobe
const matches = globe.match(/_createElementVNode\([^)]+\)/g) || globe.match(/_createVNode\([^)]+\)/g) || [];
console.log('Total VNodes:', matches.length);

// Find string literals
const strMatches = globe.match(/`[^`]{3,100}`/g) || [];
console.log('Templates / Strings:', [...new Set(strMatches)].slice(0, 50));
