const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('attendance_register_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('Tables count:', $('table').length);

$('table').each((tIdx, tbl) => {
  console.log(`\n--- TABLE ${tIdx} ---`);
  $(tbl).find('tr').each((rIdx, row) => {
    const ths = $(row).find('th').map((_, el) => $(el).text().trim().replace(/\s+/g, ' ')).get();
    const tds = $(row).find('td').map((_, el) => $(el).text().trim().replace(/\s+/g, ' ')).get();
    if (ths.length) console.log(`  TR (TH) ${rIdx} (${ths.length} cells):`, ths.slice(0, 15).join(' | '));
    if (tds.length) console.log(`  TR (TD) ${rIdx} (${tds.length} cells):`, tds.slice(0, 15).join(' | '));
  });
});
