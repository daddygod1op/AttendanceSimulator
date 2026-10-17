const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('attendance_register_response.html', 'utf8');
const $ = cheerio.load(html);

// Subjects list from master grid table
const subjectsMap = {
  '24CSE0209': { name: 'Database Management System', faculty: 'Sourabh Batra' },
  '25CAI0201': { name: 'Statistics and Data Engineering', faculty: 'Hemant Kumar, SARAVJEET SINGH' },
  '25CSE0202': { name: 'Programming in Java', faculty: 'Gourav Kaloniya' },
  '25CSE0203': { name: 'Front End Engineering-II', faculty: 'Himanshu Sharma' },
  '25CSE0204': { name: 'Object Oriented Programming', faculty: 'Gourav Kaloniya' }
};

const allRegisterEntries = [];

// Find each <tr id^="subject_">
$('tr[id^="subject_"]').each((_, tr) => {
  const trId = $(tr).attr('id');
  const subjectId = trId.replace('subject_', '');

  // Find the corresponding header row
  // The header row is the <tr> containing <th>Database Management System...
  // In the DOM, each table or thead/tbody has pairs:
  const theadTr = $(tr).closest('tbody').prev('thead').find('tr').last();
  const thCells = theadTr.find('th');
  const subjectTitle = thCells.first().text().replace(/\s+/g, ' ').trim();
  
  // Extract code
  const codeMatch = subjectTitle.match(/\((.*?)\)/);
  const subjectCode = codeMatch ? codeMatch[1].trim() : '';
  const subjInfo = subjectsMap[subjectCode] || { name: subjectTitle, faculty: 'Faculty Member' };

  console.log(`\nParsing register for ${subjInfo.name} (${subjectCode})...`);

  const tdCells = $(tr).find('td');
  // First td is "Attendance Count"
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  tdCells.slice(1).each((idx, td) => {
    const tdId = $(td).attr('id') || '';
    // id format: subject_10580_2026_06_30_5
    const idParts = tdId.split('_');
    let dateStr = '';
    let periodStr = '';

    if (idParts.length >= 6) {
      const year = idParts[2];
      const month = idParts[3];
      const day = idParts[4];
      const period = idParts[5];
      dateStr = `${day}-${month}-${year}`;
      periodStr = `Period ${period}`;
    } else {
      // Fallback from TH
      const thHtml = thCells.eq(idx + 1).html() || '';
      const thParts = thHtml.split(/<br\s*\/?>/i);
      dateStr = thParts[1] ? `${thParts[1]}-2026` : '';
      periodStr = thParts[2] ? `Period ${thParts[2]}` : '';
    }

    const rawVal = $(td).text().trim();
    let status = 'Present';

    if (rawVal.toUpperCase() === 'X') {
      status = 'Absent';
      absentCount++;
    } else if (rawVal.toUpperCase() === 'ML') {
      status = 'Medical Leave';
      leaveCount++;
    } else if (rawVal.toUpperCase() === 'DL') {
      status = 'Duty Leave';
      leaveCount++;
    } else {
      status = 'Present';
      presentCount++;
    }

    allRegisterEntries.push({
      id: `${subjectCode}_${tdId || idx}`,
      date: dateStr,
      time: periodStr || 'Standard Lecture',
      subjectCode: subjectCode,
      subjectName: subjInfo.name,
      faculty: subjInfo.faculty,
      status: status,
      lectureNo: idx + 1,
      room: 'Lecture Room'
    });
  });

  console.log(`   Present: ${presentCount}, Absent: ${absentCount}, Leaves: ${leaveCount}, Total: ${presentCount + absentCount + leaveCount}`);
});

console.log('\n=======================================');
console.log('TOTAL EXTRACTED SESSIONS:', allRegisterEntries.length);
console.log('TOTAL PRESENT:', allRegisterEntries.filter(r => r.status === 'Present').length);
console.log('TOTAL ABSENT:', allRegisterEntries.filter(r => r.status === 'Absent').length);
console.log('TOTAL LEAVES:', allRegisterEntries.filter(r => r.status.includes('Leave')).length);
console.log('=======================================');
