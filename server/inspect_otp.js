const fs = require('fs');
const cheerio = require('cheerio');

async function inspectMultiAuthDetails() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Cookie': 'PHPSESSID=2c5nqm9v7jri8rfd088okp0hr3; ci_session=b2f39c77fdfdb6db0b9872789808246d'
  };
  const res = await fetch('https://cuiet.codebrigade.in/multiAuthentication/displayGrid', { headers });
  const html = await res.text();
  const $ = cheerio.load(html);

  $('script').each((i, s) => {
    const text = $(s).html();
    if (text.includes('multiAuthentication')) {
      console.log(`--- Script #${i} ---`);
      console.log(text);
    }
  });

  console.log('--- Body inputs & buttons ---');
  $('input, button, select').each((_, el) => {
    console.log($(el).parent().html() || $(el).attr('id') || $(el).attr('name'));
  });
}

inspectMultiAuthDetails().catch(console.error);
