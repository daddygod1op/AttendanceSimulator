const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const $ = cheerio.load(html);

console.log('--- Circulars & Notices in HTML ---');
$('a, span, td, div').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  const href = $(el).attr('href') || '';
  const onclick = $(el).attr('onclick') || '';
  if (text.toLowerCase().includes('circular') || text.toLowerCase().includes('notice') || href.includes('circular') || href.includes('notice') || onclick.includes('circular') || onclick.includes('notice')) {
    if (text.length > 5 && text.length < 200) {
      console.log(`Element: tag=${el.tagName} text="${text}" href="${href}" onclick="${onclick}"`);
    }
  }
});
