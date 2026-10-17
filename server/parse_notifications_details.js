const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'notifications_response.html'), 'utf8');
const $ = cheerio.load(html);

console.log('=== MAIN NOTIFICATION CONTENT ===');
$('#notificationContainer, #feedContainer, .main-content, #main-content, body').find('div, tr, li, p').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  const id = $(el).attr('id') || '';
  const cls = $(el).attr('class') || '';
  if (text.includes('Circular') || text.includes('Notice') || text.includes('Reminder') || text.includes('Academic') || text.includes('Exam') || text.includes('Fee') || text.includes('Chitkara')) {
    if (text.length > 25 && text.length < 250) {
      console.log(`[Item] id="${id}" class="${cls}": ${text}`);
    }
  }
});

// Also check scripts for notification data JSON
const scripts = $('script').map((i, el) => $(el).html()).get();
scripts.forEach((s, idx) => {
  if (s && (s.includes('notification') || s.includes('circular') || s.includes('notice')) && s.includes('[')) {
    console.log(`\nScript #${idx} snippet:\n`, s.slice(0, 400));
  }
});
