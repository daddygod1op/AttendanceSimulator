const fs = require('fs');

async function fetchAttendanceRegister() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': 'PHPSESSID=2c5nqm9v7jri8rfd088okp0hr3; ci_session=b2f39c77fdfdb6db0b9872789808246d'
  };

  const body = new URLSearchParams();
  body.append('studentId', '17705');

  console.log('Fetching getAttendanceRegister...');
  const res = await fetch('https://cuiet.codebrigade.in//chalkpadpro/studentDetails/getAttendanceRegister', {
    method: 'POST',
    headers,
    body: body.toString()
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response length:', text.length);
  fs.writeFileSync('attendance_register_response.html', text);
  console.log('Preview:\n', text.slice(0, 1500));
}

fetchAttendanceRegister().catch(console.error);
