const fs = require('fs');
const content = fs.readFileSync('scratch/original_update/isr-main.js', 'utf8');

// Search for routes or path definitions
const routeMatches = content.match(/path:\s*["'`][^"'`]+["'`]/g) || [];
console.log('Routes in isr-main.js:', [...new Set(routeMatches)]);

// Search for dashboard widgets
const widgetMatches = content.match(/widget[a-zA-Z0-9_\-]+/gi) || [];
console.log('Widget keywords:', [...new Set(widgetMatches)].slice(0, 30));

// Search for dashboard layout or dashboard sections
const dashboardSections = content.match(/["'`]dashboard-[a-zA-Z0-9_\-]+["'`]/g) || [];
console.log('Dashboard sections:', [...new Set(dashboardSections)]);
