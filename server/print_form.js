const cheerio = require('cheerio');

async function printLoginForm() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const res = await fetch('https://cuiet.codebrigade.in/loginManager/load', { headers });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const form = $('#loginForm');
  console.log('Action:', form.attr('action'));
  console.log('Method:', form.attr('method'));
  console.log('Enctype:', form.attr('enctype'));
  
  form.find('input, select, button').each((i, el) => {
    console.log(`Element ${i}: tag=${el.tagName}, type=${$(el).attr('type')}, name=${$(el).attr('name')}, id=${$(el).attr('id')}, value=${$(el).attr('value')}`);
  });
}

printLoginForm().catch(console.error);
