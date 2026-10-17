const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('feed_1.html', 'utf8');
const $ = cheerio.load(html);

$('.ui-feed').each((i, el) => {
  const title = $(el).find('.ui-circular-title').text().trim();
  const desc = $(el).find('.ui-circular-description').text().replace(/\s+/g, ' ').replace(/More$/, '').trim();
  const onclick = $(el).attr('onclick') || '';
  const match = onclick.match(/getCircular\((\d+),\s*'([^']+)'/);
  const id = match ? match[1] : '';
  const timestamp = match ? match[2] : '';

  console.log(`[Notice #${id}] Timestamp: ${timestamp}`);
  console.log(`Title: ${title}`);
  console.log(`Description: ${desc}`);
  console.log(`Official CUIET Print URL: https://cuiet.codebrigade.in/dashboardFeed/printItem/1/${id}`);
  console.log('--------------------------------------------------');
});
