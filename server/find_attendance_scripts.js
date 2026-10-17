const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('last_response.html', 'utf8');

// Find all occurrences of attendance in scripts
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
console.log('Total scripts found:', scripts.length);

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (
    s.includes('attendance') ||
    s.includes('Attendance') ||
    s.includes('masterGridTable') ||
    s.includes('24CSE0209') ||
    s.includes('printAttendance')
  ) {
    console.log(`\n--- Script #${i} ---`);
    console.log(s.slice(0, 1500));
  }
}

// Check for any divs or tabs named attendance
const $ = cheerio.load(html);
$('[id*="ttendance"], [class*="ttendance"]').each((_, el) => {
  console.log('Element ID:', $(el).attr('id'), 'Class:', $(el).attr('class'));
});
