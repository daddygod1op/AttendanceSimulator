const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./server/last_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- ALL TABLES CONTAINING TIMETABLE OR SCHEDULE ---');
$('table').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ');
  if (text.includes('Days/Periods') || text.includes('09:00') || text.includes('09:10') || text.includes('09:30') || text.includes('10:00')) {
    console.log(`\nTable ${i}:`);
    console.log(text.slice(0, 300));
  }
});
