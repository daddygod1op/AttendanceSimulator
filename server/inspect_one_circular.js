const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('server/feed_1.html', 'utf8'));
console.log('--- UI-FEED 0 HTML ---');
console.log($('.ui-feed').eq(0).html());
