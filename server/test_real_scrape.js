const scraper = require('./scraper');

async function run() {
  const cookieStr = 'PHPSESSID=2c5nqm9v7jri8rfd088okp0hr3; ci_session=b2f39c77fdfdb6db0b9872789808246d';
  console.log('Connecting and scraping with provided cookies...');
  const data = await scraper.connectWithCookieString(cookieStr);
  console.log('=== SCRAPING RESULT ===');
  console.log('Student:', JSON.stringify(data.student, null, 2));
  console.log('Overall:', JSON.stringify(data.overall, null, 2));
  console.log('Subject count:', data.subjects.length);
  data.subjects.forEach(s => {
    console.log(`  ${s.code} - ${s.name}: ${s.attended}/${s.delivered} (${s.percentage}%) - ${s.faculty}`);
  });
  console.log('Total register entries:', data.register.length);
  console.log('Sample register entry 1:\n', data.register[0]);
  console.log('Sample register entry 50:\n', data.register[49]);
  console.log('Sample absent entry:\n', data.register.find(r => r.status === 'Absent'));
}

run().catch(console.error);
