const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

const matches = isr.match(/typeId\s*===?\s*["'`][^"'`]+["'`]/g) || [];
console.log('typeId matches:', [...new Set(matches)]);

const typeMatches = isr.match(/item\.typeId\s*===?\s*["'`][^"'`]+["'`]/g) || [];
console.log('item.typeId matches:', [...new Set(typeMatches)]);

const widgetTypes = isr.match(/["'`][a-zA-Z0-9_\-]+["'`]\s*:\s*\{[^}]*typeId/g) || [];
console.log('widget definitions:', widgetTypes);
