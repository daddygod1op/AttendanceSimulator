const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('last_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== MASTER GRID TABLE INSPECTION ===');
const table = $('#masterGridTable');
console.log('Row count:', table.find('tr').length);

table.find('tr').each((rIdx, row) => {
  const cells = $(row).find('td');
  const texts = [];
  cells.each((cIdx, cell) => {
    texts.push(`[${cIdx}] ${$(cell).text().trim().replace(/\s+/g, ' ')}`);
  });
  console.log(`Row ${rIdx}:`, texts.join(' | '));
  // check for any links, onclicks, or ids inside this row
  const htmlContent = $(row).html();
  const onclickMatches = [...htmlContent.matchAll(/onclick=["']([^"']+)["']/gi)].map(m => m[1]);
  const hrefMatches = [...htmlContent.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
  if (onclickMatches.length || hrefMatches.length) {
    console.log(`   Events: onclick=[${onclickMatches.join(', ')}] href=[${hrefMatches.join(', ')}]`);
  }
});
