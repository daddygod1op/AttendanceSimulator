const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

console.log('=== MARKS & TESTS (Table 33 masterGridTable) ===');
const perfHtml = fs.readFileSync(path.join(__dirname, 'performance.html'), 'utf8');
const $perf = cheerio.load(perfHtml);

$perf('#masterGridTable tr').each((i, el) => {
  const cells = $perf(el).find('td, th').map((j, c) => $perf(c).text().replace(/\s+/g, ' ').trim()).get();
  console.log(`Test Row ${i}:`, JSON.stringify(cells));
});

console.log('\n=== GRADES / REPORT CARD (Table 37) ===');
$perf('table').eq(37).find('tr').each((i, el) => {
  const cells = $perf(el).find('td, th').map((j, c) => $perf(c).text().replace(/\s+/g, ' ').trim()).get();
  if (cells.length > 0) {
    console.log(`Grade Row ${i}:`, JSON.stringify(cells));
  }
});

console.log('\n=== CUMULATIVE GRADES (Table 40) ===');
$perf('table').eq(40).find('tr').each((i, el) => {
  const cells = $perf(el).find('td, th').map((j, c) => $perf(c).text().replace(/\s+/g, ' ').trim()).get();
  if (cells.length > 0) {
    console.log(`Cumulative Row ${i}:`, JSON.stringify(cells));
  }
});

console.log('\n=== CIRCULARS DETAILS in feed_1.html ===');
const feedHtml = fs.readFileSync(path.join(__dirname, 'feed_1.html'), 'utf8');
const $feed = cheerio.load(feedHtml);

// Find how feed posts / circulars are displayed in feed_1.html
$feed('div[id^="feed_"], div[id^="notice"], div[class*="feed"], .content, .post, .ui-feed-wrap').each((i, el) => {
  if (i < 15) {
    const text = $feed(el).text().replace(/\s+/g, ' ').trim();
    const id = $feed(el).attr('id') || '';
    const cls = $feed(el).attr('class') || '';
    if (text.length > 30) {
      console.log(`Feed Item ${i} (id=${id}, cls=${cls}):`, text.slice(0, 150));
    }
  }
});
