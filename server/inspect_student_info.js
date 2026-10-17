const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('server/student_info_display.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

console.log('\n--- .dhtmlgoodies_aTab ---');
$('.dhtmlgoodies_aTab').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  console.log(`Tab ${i}: ${text.slice(0, 150)}`);
});

console.log('\n--- Tables ---');
$('table').each((i, el) => {
  const id = $(el).attr('id') || '';
  const cls = $(el).attr('class') || '';
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text.length > 20 && text.length < 500) {
    console.log(`Table ${i} (id=${id}, class=${cls}): ${text}`);
  }
});

console.log('\n--- Any mention of students / batch / classmates / roll ---');
const rollMatches = html.match(/\b251099\d{4}\b/g) || [];
const uniqueRolls = Array.from(new Set(rollMatches));
console.log('Roll numbers found in student_info_display.html:', uniqueRolls);
