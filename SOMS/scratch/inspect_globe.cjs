const fs = require('fs');

const globeContent = fs.readFileSync('scratch/original_update/DashboardGlobe-BmO1LG8E.js', 'utf8');
console.log('DashboardGlobe Length:', globeContent.length);

// Let's find Thai text or prominent UI labels
const thaiMatches = globeContent.match(/[\u0E00-\u0E7F]+/g) || [];
console.log('Thai words in DashboardGlobe:', [...new Set(thaiMatches)].slice(0, 30));

// Let's find CSS classes or selectors
const cssClasses = globeContent.match(/class(?:Name)?\s*[:=]\s*["'`]([^"'`]+)["'`]/g) || [];
console.log('Classes:', [...new Set(cssClasses)].slice(0, 20));

// Also let's inspect DashboardGlobe-CdmFNWcq.css
if (fs.existsSync('scratch/original_update/DashboardGlobe-CdmFNWcq.css')) {
  console.log('\n--- DashboardGlobe CSS preview ---');
  console.log(fs.readFileSync('scratch/original_update/DashboardGlobe-CdmFNWcq.css', 'utf8').slice(0, 500));
}
