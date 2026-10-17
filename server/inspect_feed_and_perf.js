const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Inspect Circulars Feed
console.log('================== CIRCULARS FEED (feed_1.html) ==================');
const feedHtml = fs.readFileSync(path.join(__dirname, 'feed_1.html'), 'utf8');
const $feed = cheerio.load(feedHtml);

console.log('Title:', $feed('title').text());
// Look for feed items, circular items, titles, dates, descriptions
const circulars = [];
$feed('.feed-item, .item, .ui-feed-wrap, .ui-notification-item, .notification-item, tr, div[class*="feed"], div[class*="circular"], div[class*="notice"]').each((i, el) => {
  const text = $feed(el).text().replace(/\s+/g, ' ').trim();
  const cls = $feed(el).attr('class') || '';
  if (cls.includes('item') || cls.includes('wrap') || cls.includes('card') || cls.includes('feed')) {
    if (text.length > 20 && text.length < 300) {
      // console.log(`[Feed class="${cls}"]`, text);
    }
  }
});

// Let's search for actual headings / anchors in feedHtml
$feed('a, h3, h4, h5, .title, .subject').each((i, el) => {
  const text = $feed(el).text().replace(/\s+/g, ' ').trim();
  const href = $feed(el).attr('href') || '';
  const onclick = $feed(el).attr('onclick') || '';
  if (text.length > 10 && text.length < 150 && !text.includes('function') && !text.includes('JavaScript')) {
    if (href.includes('download') || href.includes('notice') || href.includes('circular') || onclick.includes('notice') || onclick.includes('circular') || onclick.includes('feed') || onclick.includes('View') || href.includes('View')) {
      console.log(`[Circular Link] "${text}" -> href="${href}" onclick="${onclick}"`);
    }
  }
});

// 2. Inspect Performance / Marks
console.log('\n================== PERFORMANCE / MARKS (performance.html) ==================');
const perfHtml = fs.readFileSync(path.join(__dirname, 'performance.html'), 'utf8');
const $perf = cheerio.load(perfHtml);

console.log('Title:', $perf('title').text());
$perf('table').each((i, el) => {
  const id = $perf(el).attr('id') || '';
  const cls = $perf(el).attr('class') || '';
  const rows = $perf(el).find('tr').length;
  console.log(`Table ${i}: id="${id}" class="${cls}" rows=${rows}`);
  if (rows > 1 && rows < 50) {
    console.log('Sample row text:', $perf(el).find('tr').eq(0).text().replace(/\s+/g, ' ').trim());
  }
});

// Look for subjects and marks
$perf('tr').each((i, el) => {
  const text = $perf(el).text().replace(/\s+/g, ' ').trim();
  if (text.includes('ST1') || text.includes('FA') || text.includes('Assignment') || text.includes('Internal') || text.includes('Sessional') || text.includes('Marks') || text.includes('Subject')) {
    if (text.length < 250) {
      console.log('Marks row:', text);
    }
  }
});
