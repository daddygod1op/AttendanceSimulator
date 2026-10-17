const fs = require('fs');

async function testUserSession() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  const sessionId = 'b2f39c77fdfdb6db0b9872789808246d';
  const phpsessid = '2c5nqm9v7jri8rfd088okp0hr3';

  // Test different cookie configurations
  const cookieAttempts = [
    `PHPSESSID=${phpsessid}`,
    `PHPSESSID=${phpsessid}; ci_session=${sessionId}`,
    `ci_session=${sessionId}; PHPSESSID=${phpsessid}`
  ];

  const testUrls = [
    'https://cuiet.codebrigade.in/studentDetails/display',
    'https://cuiet.codebrigade.in/chalkpadpro/studentDetails/display',
    'https://cuiet.codebrigade.in/main'
  ];

  for (const cookieStr of cookieAttempts) {
    console.log('--- Testing cookie:', cookieStr.slice(0, 50), '---');
    for (const url of testUrls) {
      try {
        const res = await fetch(url, {
          headers: { ...headers, Cookie: cookieStr },
          redirect: 'manual'
        });
        console.log(`[${res.status}] ${url} -> Location: ${res.headers.get('location')}`);
        if (res.status === 200) {
          const body = await res.text();
          console.log(`   Body length: ${body.length}, contains 'Database Management': ${body.includes('Database Management')}`);
          fs.writeFileSync('last_response.html', body);
        }
      } catch (e) {
        console.log(`   Error: ${e.message}`);
      }
    }
  }
}

testUserSession().catch(console.error);
