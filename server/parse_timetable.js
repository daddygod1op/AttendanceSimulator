const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./last_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- Desktop Timetable ---');
$('.timetable-desktop tr').each((i, tr) => {
  const row = [];
  $(tr).find('th, td').each((_, td) => {
    row.push($(td).text().replace(/\s+/g, ' ').trim());
  });
  if (row.length > 0) console.log(`Row ${i}:`, row.join(' | '));
});

console.log('\n--- Mobile Timetable Cards ---');
$('.timetable-mobile .day-card').each((i, card) => {
  const dayName = $(card).find('.day-header').text().replace(/\s+/g, ' ').trim();
  console.log(`Day ${i}: ${dayName}`);
  $(card).find('.day-body tr, .day-body .period-row, .day-body div').each((j, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length < 150) {
      console.log(`   Period: ${text}`);
    }
  });
});
