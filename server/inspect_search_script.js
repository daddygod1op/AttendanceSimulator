const fs = require('fs');
const html = fs.readFileSync('server/notifications_response.html', 'utf8');
const lines = html.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Type here to find students') || lines[i].includes('find students')) {
    console.log(`Line ${i}:`, lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 35)).join('\n'));
    break;
  }
}
