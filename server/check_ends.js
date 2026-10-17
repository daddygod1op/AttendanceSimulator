const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('attendance_register_response.html', 'utf8'));
const tr = $('tr#subject_10580');
const theadTr = tr.closest('tbody').prev('thead').find('tr').last();

console.log('th count:', theadTr.find('th').length);
console.log('td count:', tr.find('td').length);

theadTr.find('th').slice(-4).each((i, el) => console.log('th end:', $(el).text()));
tr.find('td').slice(-4).each((i, el) => console.log('td end:', $(el).text(), 'id:', $(el).attr('id')));
