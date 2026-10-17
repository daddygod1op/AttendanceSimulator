const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./last_response.html', 'utf8');
const regHtml = fs.readFileSync('./attendance_register_response.html', 'utf8');
const $ = cheerio.load(html);

// Extract subjects
const subjects = [];
$('#masterGridTable tr').each((i, row) => {
  if (i === 0) return;
  const cells = $(row).find('td');
  if (cells.length < 10) return;
  const clean = (idx) => cells.eq(idx).text().trim().replace(/\s+/g, ' ');
  const code = clean(1);
  const name = clean(2);
  const teacher = clean(3);
  const delivered = parseInt(clean(5), 10);
  const attended = parseInt(clean(6), 10);
  const absent = parseInt(clean(7), 10);
  if (!code || !name || delivered === 0) return;
  subjects.push({ code, name, teacher, delivered, attended, absent });
});

// Parse register
const subjectMap = {};
subjects.forEach(s => { subjectMap[s.code] = s; });
const registerEntries = [];
const $reg = cheerio.load(regHtml);

$reg('tr[id^="subject_"]').each((_, tr) => {
  const theadTr = $reg(tr).closest('tbody').prev('thead').find('tr').last();
  const thCells = theadTr.find('th');
  const subjectTitle = thCells.first().text().replace(/\s+/g, ' ').trim();
  const codeMatch = subjectTitle.match(/\((.*?)\)/);
  const subjectCode = codeMatch ? codeMatch[1].trim() : '';
  const subjectObj = subjectMap[subjectCode] || { name: subjectTitle };

  const tdCells = $reg(tr).find('td').slice(1, -2);
  tdCells.each((idx, td) => {
    const tdId = $reg(td).attr('id') || '';
    const parts = tdId.split('_');
    let dateStr = '';
    let periodStr = '';
    if (parts.length >= 6) {
      dateStr = parts[4] + '-' + parts[3] + '-' + parts[2];
      periodStr = 'Period ' + parts[5];
    }
    const rawVal = $reg(td).text().trim();
    let status = 'Present';
    if (rawVal.toUpperCase() === 'X') status = 'Absent';
    else if (rawVal.toUpperCase() === 'ML') status = 'Medical Leave';
    else if (rawVal.toUpperCase() === 'DL') status = 'Duty Leave';

    registerEntries.push({
      date: dateStr,
      time: periodStr,
      subjectCode,
      subjectName: subjectObj.name,
      status
    });
  });
});

console.log('Total lectures:', registerEntries.length);

// Group by date
const days = {};
registerEntries.forEach(r => {
  if (!days[r.date]) days[r.date] = [];
  days[r.date].push(r);
});

console.log('Total unique calendar dates with lectures:', Object.keys(days).length);

const missedAllDays = [];
const partialDays = [];
const fullPresentDays = [];

Object.entries(days).forEach(([date, lecs]) => {
  const total = lecs.length;
  const absentCount = lecs.filter(l => l.status === 'Absent').length;
  const presentCount = lecs.filter(l => l.status === 'Present').length;
  const leaveCount = lecs.filter(l => l.status === 'Medical Leave' || l.status === 'Duty Leave').length;

  if (absentCount === total && total > 0) {
    missedAllDays.push({ date, total, lecs });
  } else if (presentCount === total) {
    fullPresentDays.push({ date, total });
  } else {
    partialDays.push({ date, total, absentCount, presentCount, leaveCount });
  }
});

console.log('=== SUMMARY OF DAYS ===');
console.log('100% Present Days:', fullPresentDays.length);
console.log('Partial Attendance Days:', partialDays.length);
console.log('100% MISSED / BUNKED DAYS (where student missed ALL classes in the day):', missedAllDays.length);

missedAllDays.forEach(d => {
  console.log(`- Date: ${d.date} | Missed all ${d.total} classes: ${d.lecs.map(l => `${l.subjectCode} (${l.time})`).join(', ')}`);
});
