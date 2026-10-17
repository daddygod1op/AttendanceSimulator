const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const ajaxCalls = [...html.matchAll(/url\s*:\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log('AJAX urls:', [...new Set(ajaxCalls)]);

const mainEndpoints = [...html.matchAll(/https:\/\/cuiet\.codebrigade\.in\/([a-zA-Z0-9_\/]+)/g)].map(m => m[1]);
console.log('CUIET full URLs in page:', [...new Set(mainEndpoints)]);
