const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./server/feed_1.html', 'utf8');
const $ = cheerio.load(html);

$('.ui-feed').each((i, el) => {
  console.log(`\n================= NOTICE ${i + 1} =================`);
  console.log('TITLE:', $(el).find('.ui-circular-title').text().trim());
  console.log('HTML SNIPPET:', $(el).html().slice(0, 1200));
});
