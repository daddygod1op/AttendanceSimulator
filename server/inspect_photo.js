const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const $ = cheerio.load(html);

// Look for image in Tab 0
$('.dhtmlgoodies_aTab').eq(0).find('img').each((i, el) => {
  console.log('Tab 0 image:', $(el).attr('src'));
});

// Look for any image with width/height of a profile photo or in tables
$('img').each((i, el) => {
  const src = $(el).attr('src') || '';
  if (!src.includes('loader') && !src.includes('icon') && !src.includes('arrow') && !src.includes('btn')) {
    console.log(`General image ${i}: src="${src}" parent="${$(el).parent().prop('tagName')}" id="${$(el).attr('id')}"`);
  }
});
