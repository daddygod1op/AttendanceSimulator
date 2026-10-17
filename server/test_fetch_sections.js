const fs = require('fs');
const path = require('path');
const sessionStore = require('./sessionStore');

async function testPages() {
  const cookieString = sessionStore.getCookieString();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Cookie': cookieString
  };

  // 1. Fetch Circulars Feed
  console.log('--- 1. Fetching dashboardFeed/feed/1 ---');
  try {
    const res1 = await fetch('https://cuiet.codebrigade.in/dashboardFeed/feed/1', { headers });
    console.log('Feed Status:', res1.status);
    const html1 = await res1.text();
    fs.writeFileSync(path.join(__dirname, 'feed_1.html'), html1);
    console.log('Feed length:', html1.length, 'written to feed_1.html');
  } catch (e) {
    console.log('Error 1:', e.message);
  }

  // 2. Fetch Performance
  console.log('\n--- 2. Fetching studentPerformanceParent/graphDisplay ---');
  try {
    const res2 = await fetch('https://cuiet.codebrigade.in/studentPerformanceParent/graphDisplay', { headers });
    console.log('Performance Status:', res2.status);
    const html2 = await res2.text();
    fs.writeFileSync(path.join(__dirname, 'performance.html'), html2);
    console.log('Performance length:', html2.length, 'written to performance.html');
  } catch (e) {
    console.log('Error 2:', e.message);
  }

  // 3. Fetch circulars list if available
  console.log('\n--- 3. Fetching circularsDisplay/display ---');
  try {
    const res3 = await fetch('https://cuiet.codebrigade.in/circularsDisplay/display', { headers });
    console.log('Circulars Status:', res3.status);
    const html3 = await res3.text();
    fs.writeFileSync(path.join(__dirname, 'circulars_display.html'), html3);
    console.log('Circulars length:', html3.length);
  } catch (e) {
    console.log('Error 3:', e.message);
  }
}

testPages();
