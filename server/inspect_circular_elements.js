const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const feedHtml = fs.readFileSync(path.join(__dirname, 'feed_1.html'), 'utf8');
const $ = cheerio.load(feedHtml);

$('.ui-feed').each((i, el) => {
  if (i < 5) {
    console.log(`\n================ FEED ITEM ${i} ================`);
    console.log('Title:', $(el).find('.ui-feed-title, h4, h3, .title, a.title').text().trim());
    console.log('Date/Time:', $(el).find('.ui-feed-date, .date, .time, span.date').text().trim());
    console.log('Author/Dept:', $(el).find('.ui-feed-author, .author, .posted-by').text().trim());
    console.log('Content snippet:', $(el).find('.ui-feed-content, .desc, p').text().replace(/\s+/g, ' ').trim().slice(0, 150));
    console.log('Attachment links:');
    $(el).find('a').each((j, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      if (href && !href.startsWith('#')) {
        console.log(`  - [${text}](${href})`);
      }
    });
    console.log('Full HTML snippet:', $(el).html().slice(0, 400));
  }
});
