const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('last_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

// Find student info
console.log('--- Student Profile Headers ---');
$('td.title, td.welcome, .user_name, .profile-name, .welcome_txt, #userName').each((_, el) => {
  console.log($(el).text().trim());
});

// Find table containing Database Management
console.log('\n--- Finding Attendance Table ---');
$('table').each((i, tbl) => {
  const text = $(tbl).text();
  if (text.includes('Database Management') && text.includes('Delivered')) {
    console.log(`Table #${i} has id="${$(tbl).attr('id')}" class="${$(tbl).attr('class')}"`);
    console.log('Table HTML slice:\n', $(tbl).html().slice(0, 1500));
  }
});
