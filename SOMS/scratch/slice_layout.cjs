const fs = require('fs');
const isr = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

console.log(isr.slice(50300, 52000));
