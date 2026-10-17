const fs = require('fs');
const html = fs.readFileSync('attendance_register_response.html', 'utf8');

const idx = html.indexOf('Database Management System');
console.log(html.slice(idx - 200, idx + 1200));
