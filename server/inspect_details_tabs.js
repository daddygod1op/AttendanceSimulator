const cheerio = require('cheerio');
const fs = require('fs');
const $ = cheerio.load(fs.readFileSync('server/last_response.html', 'utf8'));

$('.dhtmlgoodies_aTab').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  console.log(`\n=== Tab ${i} ===`);
  console.log(text.slice(0, 300));
});
