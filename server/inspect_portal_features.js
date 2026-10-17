const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const $ = cheerio.load(html);

console.log('=== IMAGES IN STUDENT DETAILS ===');
$('img').each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const id = $(el).attr('id') || '';
  if (src.includes('photo') || src.includes('student') || src.includes('upload') || src.includes('download') || id.includes('photo') || alt.includes('photo')) {
    console.log(`Image ${i}: id="${id}" src="${src}" alt="${alt}"`);
  }
});

console.log('\n=== TABS / BLOCKS IN STUDENT DETAILS ===');
$('.dhtmlgoodies_aTab').each((i, el) => {
  const id = $(el).attr('id') || `tab_${i}`;
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  console.log(`Tab ${i} (id=${id}): ${text.slice(0, 80)}`);
});

console.log('\n=== CIRCULARS / NOTICES / MARKS REFERENCES ===');
const keywords = ['circular', 'notice', 'mark', 'grade', 'result', 'exam', 'batch', 'classmate', 'studentPhoto'];
keywords.forEach(kw => {
  const count = (html.match(new RegExp(kw, 'gi')) || []).length;
  console.log(`Keyword "${kw}": found ${count} times`);
});
