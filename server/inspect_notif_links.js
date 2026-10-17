const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'notifications_response.html'), 'utf8');
const $ = cheerio.load(html);

console.log($('#ui-notification-container').html());

$('a').each((i, a) => {
  const text = $(a).text().trim();
  const href = $(a).attr('href') || '';
  if (text.includes('Circular') || text.includes('Resource') || href.includes('circular') || href.includes('resource')) {
    console.log(`Link: text="${text}" href="${href}"`);
  }
});
