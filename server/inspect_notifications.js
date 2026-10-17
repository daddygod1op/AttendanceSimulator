const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sessionStore = require('./sessionStore');

async function inspectNotifications() {
  const cookieString = sessionStore.getCookieString();
  const res = await fetch('https://cuiet.codebrigade.in/notifications/display', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': cookieString
    }
  });

  const html = await res.text();
  fs.writeFileSync(path.join(__dirname, 'notifications_response.html'), html, 'utf8');
  console.log('Saved notifications_response.html (length = ' + html.length + ')');

  const $ = cheerio.load(html);
  console.log('Title:', $('title').text());

  // Find notifications / circular cards
  const items = [];
  $('.notification-card, .timeline-item, .feed-item, tr, li, .card').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20 && text.length < 350 && !text.includes('function') && !text.includes('script')) {
      items.push(text);
    }
  });

  console.log(`Found ${items.length} candidate notification items:`);
  items.slice(0, 15).forEach((item, idx) => {
    console.log(`[${idx + 1}] ${item}`);
  });
}

inspectNotifications().catch(console.error);
