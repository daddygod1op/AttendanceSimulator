const fs = require('fs');
const html = fs.readFileSync('server/notifications_response.html', 'utf8');
const lines = html.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('find students')) {
    console.log(`Match at Line ${i}:`);
    for (let j = Math.max(0, i - 15); j <= Math.min(lines.length - 1, i + 15); j++) {
      console.log(`${j}: ${lines[j]}`);
    }
  }
}
