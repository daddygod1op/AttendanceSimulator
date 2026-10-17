const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const $ = cheerio.load(html);

console.log('=== PAGE TITLE ===', $('title').text());

console.log('=== TABS ===');
$('.dhtmlgoodies_tabPane, div.tab, span.tab').each((i, el) => {
  console.log($(el).text().slice(0, 100));
});

console.log('=== SCRIPT TAB ARRAYS ===');
$('script').each((i, el) => {
  const content = $(el).html() || '';
  if (content.includes('initTabs') || content.includes('createTab') || content.includes('tabArray')) {
    console.log(`Script ${i}:`, content.slice(0, 300));
  }
});

console.log('=== MENU ITEMS / NAVIGATION ===');
$('.menu, #menu, .navigation, nav, ul.dropdown, .ui-menu-dropdown').each((i, el) => {
  console.log($(el).text().replace(/\s+/g, ' ').trim().slice(0, 200));
});

$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  const onclick = $(el).attr('onclick') || '';
  if (text.length > 2 && (href.startsWith('http') || href.startsWith('/') || onclick.length > 5)) {
    if (!href.includes('#') && !href.includes('javascript') && (href.includes('student') || href.includes('marks') || href.includes('feed') || href.includes('circular') || href.includes('attendance') || href.includes('report') || href.includes('subject') || href.includes('class') || href.includes('batch'))) {
      console.log(`Link: "${text}" -> href: "${href}" onclick: "${onclick}"`);
    }
  }
});
