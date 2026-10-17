const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('attendance_register_response.html', 'utf8');
const $ = cheerio.load(html);

const registerEntries = [];

$('table').find('tr').each((rIdx, row) => {
  const thCells = $(row).find('th');
  if (thCells.length > 5) {
    // This is a subject header row with dates/periods
    const subjectTitleTh = thCells.first();
    const subjectTitle = subjectTitleTh.text().trim();
    
    // Parse subject name and code, e.g. "Database Management System (24CSE0209)"
    const match = subjectTitle.match(/^(.*?)\s*(?:\((.*?)\))?$/s);
    const subjectName = match ? match[1].replace(/\n/g, ' ').trim() : subjectTitle;
    const subjectCode = match && match[2] ? match[2].trim() : '';

    // The next sibling row should be the Attendance Count (TDs)
    const nextRow = $(row).next('tr');
    const tdCells = nextRow.find('td');

    // thCells[1..N] correspond to tdCells[1..N]
    const numLectures = Math.min(thCells.length - 1, tdCells.length - 1);
    console.log(`\nParsing Subject: ${subjectName} (${subjectCode}) - Lectures: ${numLectures}`);

    for (let i = 1; i <= numLectures; i++) {
      const thHtml = thCells.eq(i).html() || '';
      // Structure: 1<br>30-06<br>5
      const thParts = thHtml.split(/<br\s*\/?>/i).map(p => p.trim());
      const lectureNo = thParts[0] || i.toString();
      const datePart = thParts[1] || ''; // e.g. "30-06"
      const period = thParts[2] || '';   // e.g. "5"

      // Determine full date (e.g. "30-06-2026")
      // Since session is 2026:
      const fullDate = datePart ? `${datePart}-2026` : '';

      const tdVal = tdCells.eq(i).text().trim();
      let status = 'Present';
      if (tdVal.toUpperCase() === 'X') {
        status = 'Absent';
      } else if (tdVal.toUpperCase() === 'ML') {
        status = 'Medical Leave';
      } else if (tdVal.toUpperCase() === 'DL') {
        status = 'Duty Leave';
      } else if (!isNaN(parseInt(tdVal, 10))) {
        status = 'Present';
      }

      registerEntries.push({
        id: `reg_${subjectCode}_${lectureNo}_${datePart}`,
        lectureNo: parseInt(lectureNo, 10) || i,
        date: fullDate,
        time: period ? `Period ${period}` : 'Standard Lecture',
        subjectCode,
        subjectName,
        status,
        cumulativeAttended: isNaN(parseInt(tdVal, 10)) ? null : parseInt(tdVal, 10),
        rawMark: tdVal
      });
    }
  }
});

console.log('\nTotal parsed register entries:', registerEntries.length);
console.log('Sample 10 entries:\n', registerEntries.slice(0, 10));
console.log('Sample absent entries:\n', registerEntries.filter(r => r.status === 'Absent').slice(0, 5));
