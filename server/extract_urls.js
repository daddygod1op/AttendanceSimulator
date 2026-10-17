const fs = require('fs');
const html = fs.readFileSync('server/last_response.html', 'utf8');

const urls = new Set();
const hrefRegex = /href=["']([^"']+)["']/g;
let match;
while ((match = hrefRegex.exec(html)) !== null) {
  urls.add(match[1]);
}

const actionRegex = /action=["']([^"']+)["']/g;
while ((match = actionRegex.exec(html)) !== null) {
  urls.add(match[1]);
}

const ajaxRegex = /url\s*:\s*["']([^"']+)["']/g;
while ((match = ajaxRegex.exec(html)) !== null) {
  urls.add(match[1]);
}

const clean = Array.from(urls)
  .filter(u => !u.endsWith('.css') && !u.endsWith('.js') && !u.endsWith('.png') && !u.endsWith('.jpg') && !u.endsWith('.ico') && !u.startsWith('#') && !u.startsWith('javascript:'));

console.log('Found URLs:', clean);
