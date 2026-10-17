const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./server/student_info_display.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- STUDENT INFO IMAGES ---');
$('img').each((i, el) => {
  const src = $(el).attr('src');
  if (src && (src.includes('Student') || src.includes('resources') || src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
    console.log(`Image ${i}: ${src}`);
  }
});

// Also check studentDetails in scraper
console.log('\n--- Checking scraper studentDetails parsing ---');
const scraper = require('./server/scraper.js');
console.log('Student details regex or cheerio check:');
