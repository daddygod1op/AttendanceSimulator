const sessionStore = require('./sessionStore');

async function testAll() {
  const cookieString = sessionStore.getCookieString();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Cookie': cookieString,
    'X-Requested-With': 'XMLHttpRequest'
  };

  const urls = [
    'https://cuiet.codebrigade.in/miscLibrary/groupDropDownOptions',
    'https://cuiet.codebrigade.in/miscLibrary/dropDownOptions',
    'https://cuiet.codebrigade.in/chalkpadpro/studentFeedback/displayGrid',
    'https://cuiet.codebrigade.in/dashboardFeed/getCounts/',
    'https://cuiet.codebrigade.in/onlineTestStudent/display',
    'https://cuiet.codebrigade.in/studentDetails/populateStudentInfo/',
    'https://cuiet.codebrigade.in/studentInfo/showAttendanceInfo',
    'https://cuiet.codebrigade.in/studentInfo/display/',
    'https://cuiet.codebrigade.in/calendarEventStudent/index'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      console.log(`\nURL: ${url}`);
      console.log(`Status: ${res.status}, Length: ${text.length}`);
      console.log(`Snippet: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
    } catch (e) {
      console.log(`URL: ${url} -> Error: ${e.message}`);
    }
  }
}

testAll();
