const fs = require('fs');
const path = require('path');
const sessionStore = require('./sessionStore');

async function testEndpoints() {
  const cookieString = sessionStore.getCookieString();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Cookie': cookieString,
    'X-Requested-With': 'XMLHttpRequest'
  };

  // 1. Test getQuickSearchValue
  console.log('--- 1. Testing dashboardFeed/getQuickSearchValue ---');
  try {
    const res1 = await fetch('https://cuiet.codebrigade.in/dashboardFeed/getQuickSearchValue', {
      method: 'POST',
      headers
    });
    console.log('Status 1:', res1.status);
    const text1 = await res1.text();
    console.log('Length 1:', text1.length);
    console.log('Preview 1:', text1.slice(0, 500));
  } catch (e) {
    console.log('Error 1:', e.message);
  }

  // 2. Test getAppMessages (Circulars / Notices)
  console.log('\n--- 2. Testing dashboardFeed/getAppMessages ---');
  try {
    const res2 = await fetch('https://cuiet.codebrigade.in/dashboardFeed/getAppMessages/', {
      method: 'POST',
      headers
    });
    console.log('Status 2:', res2.status);
    const text2 = await res2.text();
    console.log('Length 2:', text2.length);
    console.log('Preview 2:', text2.slice(0, 500));
  } catch (e) {
    console.log('Error 2:', e.message);
  }

  // 3. Test createNONCCEMarksTab (Marks)
  console.log('\n--- 3. Testing studentDetails/createNONCCEMarksTab ---');
  try {
    const res3 = await fetch('https://cuiet.codebrigade.in/studentDetails/createNONCCEMarksTab/', {
      method: 'POST',
      headers
    });
    console.log('Status 3:', res3.status);
    const text3 = await res3.text();
    console.log('Length 3:', text3.length);
    console.log('Preview 3:', text3.slice(0, 500));
  } catch (e) {
    console.log('Error 3:', e.message);
  }

  // 4. Test notifications/display
  console.log('\n--- 4. Testing notifications/display ---');
  try {
    const res4 = await fetch('https://cuiet.codebrigade.in/notifications/display', {
      headers
    });
    console.log('Status 4:', res4.status);
    const text4 = await res4.text();
    console.log('Length 4:', text4.length);
    console.log('Preview 4:', text4.slice(0, 500));
  } catch (e) {
    console.log('Error 4:', e.message);
  }
}

testEndpoints().catch(console.error);
