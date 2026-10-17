const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sessionStore = require('./sessionStore');

async function testFetchCirculars() {
  const cookieString = sessionStore.getCookieString();
  console.log('Using cookie string length:', cookieString.length);

  const res = await fetch('https://cuiet.codebrigade.in/studentCircularManager/displayGrid', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': cookieString
    }
  });

  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);
  fs.writeFileSync(path.join(__dirname, 'circulars_response.html'), html, 'utf8');

  const $ = cheerio.load(html);
  console.log('Title:', $('title').text());
  
  // Look for circular table
  $('table').each((i, t) => {
    const text = $(t).text().replace(/\s+/g, ' ').trim();
    if (text.includes('Circular') || text.includes('Notice') || text.includes('Subject') || text.includes('Date')) {
      console.log(`Table ${i} text preview:`, text.slice(0, 300));
    }
  });

  // Look for rows
  $('tr').each((i, r) => {
    const text = $(r).text().replace(/\s+/g, ' ').trim();
    if (text.length > 10 && text.length < 200 && !text.includes('function') && !text.includes('var ')) {
      console.log(`Row ${i}:`, text);
    }
  });
}

testFetchCirculars().catch(console.error);
