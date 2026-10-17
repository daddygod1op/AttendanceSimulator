const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('server/feed_1.html', 'utf8'));

console.log('Total ui-feed elements:', $('.ui-feed').length);
const parent = $('.ui-feed').eq(0).parent();
console.log('Parent tag:', parent.prop('tagName'), 'class:', parent.attr('class'), 'id:', parent.attr('id'));
console.log('Parent outer snippet:', parent.html().slice(0, 800));

// Let's check dates in feed_1.html
$('[class*="date"], [class*="time"], [id*="date"]').each((i, el) => {
  if (i < 10) {
    console.log('Date element:', $(el).attr('class'), $(el).attr('id'), $(el).text().trim());
  }
});
