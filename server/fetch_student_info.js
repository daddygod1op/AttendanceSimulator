const fs = require('fs');
const sessionStore = require('./sessionStore');

async function fetchStudentInfo() {
  const cookieString = sessionStore.getCookieString();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Cookie': cookieString
  };

  const res = await fetch('https://cuiet.codebrigade.in/studentInfo/display/', { headers });
  const html = await res.text();
  fs.writeFileSync('server/student_info_display.html', html);
  console.log('Saved student_info_display.html, length:', html.length);
}

fetchStudentInfo();
