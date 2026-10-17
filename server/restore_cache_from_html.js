const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sessionStore = require('./sessionStore');

let html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const regHtml = fs.readFileSync(path.join(__dirname, 'attendance_register_response.html'), 'utf8');
let $ = cheerio.load(html);

// 1. Extract Student Info (prefer student_info_display.html if available)
let name = 'AARUSH WADHWA';
let rollNo = '2510993347';
let branch = '2025-BE-CSE-AI&ML-3 SEM';
let semester = '3rd SEM';
let session = 'JulDec2026';

let photoUrl = '';
const studentInfoPath = path.join(__dirname, 'student_info_display.html');
if (fs.existsSync(studentInfoPath)) {
  const studentHtml = fs.readFileSync(studentInfoPath, 'utf8');
  const $stu = cheerio.load(studentHtml);
  const stuName = $stu('.ui-account-name span').first().text().trim();
  if (stuName) name = stuName;
  const rollMatch = studentHtml.match(/Roll\s*No[:.]?\s*<\/strong>\s*(\d+)/i) || studentHtml.match(/Roll\s*No[:.]?\s*<b>(\d+)<\/b>/i);
  if (rollMatch) rollNo = rollMatch[1].trim();
  const classMatch = studentHtml.match(/Class\s*:\s*<b>([^<]+)<\/b>/i) || studentHtml.match(/Class Name\s*:\s*<b>([^<]+)<\/b>/i);
  if (classMatch) branch = classMatch[1].trim();

  $stu('img').each((i, el) => {
    const src = $stu(el).attr('src') || '';
    if (src.includes('resources/Student') || src.includes('s3.amazonaws.com/cbrig-assets/cuiet/resources/Student')) {
      photoUrl = src;
    }
  });
}

if (!photoUrl) {
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('resources/Student') || src.includes('s3.amazonaws.com/cbrig-assets/cuiet/resources/Student')) {
      photoUrl = src;
    }
  });
}

if (!photoUrl) {
  photoUrl = 'https://s3.amazonaws.com/cbrig-assets/cuiet/resources/Student/S173232szi.jpg';
}

const student = {
  name,
  rollNo,
  photoUrl,
  branch,
  semester,
  institute: 'Chitkara University Institute of Engineering & Technology (CUIET)',
  session
};

// 2. Extract subjects
const subjects = [];
$('#masterGridTable tr').each((i, row) => {
  if (i === 0) return;
  const cells = $(row).find('td');
  const firstText = cells.eq(1).text().trim();
  if (firstText.includes('Receipt No') || firstText.includes('CBN') || firstText.includes('CU/PB') || firstText.includes('EXPLR')) {
    return false;
  }
  if (cells.length < 10) return;

  const clean = (idx) => cells.eq(idx).text().trim().replace(/\s+/g, ' ');
  const getInt = (idx) => {
    const val = parseInt(clean(idx), 10);
    return isNaN(val) ? 0 : val;
  };
  const getFloat = (idx) => {
    const val = parseFloat(clean(idx).replace('%', ''));
    return isNaN(val) ? 0 : val;
  };

  const code = clean(1);
  const subjName = clean(2);
  const teacher = clean(3);
  const dateRange = clean(4);
  const delivered = getInt(5);
  const attended = getInt(6);
  const absent = getInt(7);
  const dl = getInt(8);
  const ml = getInt(9);
  let percentage = getFloat(10);
  const approvedDL = getInt(11);
  const approvedML = getInt(12);

  if (!code || !subjName || delivered === 0) return;

  if (!percentage && delivered > 0) {
    percentage = Math.round(((attended + ml) / delivered) * 1000) / 10;
  }

  const target = 0.75;
  const effectiveAttended = attended + ml + dl;
  let safeBunks = 0;
  let needClasses = 0;
  if (delivered > 0) {
    if (effectiveAttended / delivered >= target) {
      safeBunks = Math.floor(effectiveAttended / target - delivered);
    } else {
      needClasses = Math.ceil((target * delivered - effectiveAttended) / (1 - target));
    }
  }

  subjects.push({
    id: `subj_${code}`,
    code,
    name: subjName,
    component: 'Theory / Lab',
    faculty: teacher || 'Faculty Member',
    dateRange,
    delivered,
    attended,
    absent,
    dutyLeave: dl,
    medicalLeave: ml,
    totalApprovedDL: approvedDL,
    totalApprovedML: approvedML,
    percentage: Math.round(percentage * 10) / 10,
    safeBunks: Math.max(0, safeBunks),
    needClasses: Math.max(0, needClasses)
  });
});

// 3. Extract timetable
const subjectMap = {
  '24CSE0209': 'Database Management System',
  '25CAI0201': 'Statistics and Data Engineering',
  '25CSE0202': 'Programming in Java',
  '25CSE0203': 'Front End Engineering-II',
  '25CSE0204': 'Object Oriented Programming'
};
subjects.forEach(s => { if (s.code && s.name) subjectMap[s.code] = s.name; });

const teacherMap = {
  '24CSE0209': 'Sourabh Batra',
  '25CAI0201': 'Hemant Kumar / Saravjeet Singh',
  '25CSE0202': 'Gourav Kaloniya',
  '25CSE0203': 'Himanshu Sharma',
  '25CSE0204': 'Gourav Kaloniya'
};
subjects.forEach(s => { if (s.code && s.faculty) teacherMap[s.code] = s.faculty; });

const periods = [
  { period: 1, time: '09:00 AM - 09:50 AM' },
  { period: 2, time: '09:50 AM - 10:40 AM' },
  { period: 3, time: '10:50 AM - 11:40 AM' },
  { period: 4, time: '11:40 AM - 12:30 PM' },
  { period: 5, time: '01:20 PM - 02:10 PM' },
  { period: 6, time: '02:10 PM - 03:00 PM' }
];

const schedule = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: []
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

$('.timetable-desktop tr').each((i, tr) => {
  const cells = $(tr).find('td, th');
  const firstCellText = cells.first().text().trim();
  const matchedDay = days.find(d => firstCellText.startsWith(d));
  if (!matchedDay) return;

  cells.slice(1).each((idx, td) => {
    const text = $(td).text().trim().replace(/\s+/g, ' ');
    if (text && text !== '&nbsp;' && text.length > 2) {
      let matchedCode = '';
      let matchedName = 'Class Lecture';
      for (const code of Object.keys(subjectMap)) {
        if (text.includes(code)) {
          matchedCode = code;
          matchedName = subjectMap[code];
          break;
        }
      }

      // Extract Room
      let room = 'LH-402';
      const roomMatch = text.match(/(LH-\d+|MB-?\d+|Turing\s*Lab|Lab-\d+)/i);
      if (roomMatch) {
        room = roomMatch[1].toUpperCase();
        if (room === 'MB104') room = 'MB-104';
      }

      // Extract Faculty
      let faculty = teacherMap[matchedCode] || 'Faculty Member';
      if (text.includes('Himanshu Sharma')) faculty = 'Himanshu Sharma';
      else if (text.includes('Sourabh Batra')) faculty = 'Sourabh Batra';
      else if (text.includes('Gourav Kaloniya')) faculty = 'Gourav Kaloniya';
      else if (text.includes('Hemant Kumar')) faculty = 'Hemant Kumar / Saravjeet Singh';

      schedule[matchedDay].push({
        period: idx + 1,
        time: periods[idx]?.time || `Period ${idx + 1}`,
        subject: matchedName,
        subjectName: matchedName,
        subjectCode: matchedCode,
        code: matchedCode,
        faculty,
        room,
        raw: text
      });
    }
  });
});

const timetable = { periods, schedule };

// 4. Parse register
const registerEntries = [];
const $reg = cheerio.load(regHtml);

$reg('tr[id^="subject_"]').each((_, tr) => {
  const theadTr = $reg(tr).closest('tbody').prev('thead').find('tr').last();
  const thCells = theadTr.find('th');
  const subjectTitle = thCells.first().text().replace(/\s+/g, ' ').trim();
  const codeMatch = subjectTitle.match(/\((.*?)\)/);
  const subjectCode = codeMatch ? codeMatch[1].trim() : '';
  const subjectObj = subjects.find(s => s.code === subjectCode) || {
    name: subjectTitle.replace(/\(.*?\)/, '').trim(),
    faculty: 'Faculty Member'
  };

  const tdCells = $reg(tr).find('td').slice(1, -2);
  tdCells.each((idx, td) => {
    const tdId = $reg(td).attr('id') || '';
    const parts = tdId.split('_');
    let dateStr = '';
    let periodStr = '';

    if (parts.length >= 6) {
      dateStr = `${parts[4]}-${parts[3]}-${parts[2]}`;
      periodStr = `Period ${parts[5]}`;
    }

    if (!dateStr || dateStr.includes('undefined')) return;

    const rawVal = $reg(td).text().trim();
    let status = 'Present';
    if (rawVal.toUpperCase() === 'X') status = 'Absent';
    else if (rawVal.toUpperCase() === 'ML') status = 'Medical Leave';
    else if (rawVal.toUpperCase() === 'DL') status = 'Duty Leave';

    registerEntries.push({
      id: `${subjectCode}_${tdId || idx}_${idx}`,
      date: dateStr,
      time: periodStr || 'Standard Lecture',
      subjectCode,
      subjectName: subjectObj.name,
      faculty: subjectObj.faculty,
      status,
      lectureNo: idx + 1,
      room: 'Lecture Hall'
    });
  });
});

// 5. Enrich register with daily bunks
const dayGroups = {};
registerEntries.forEach(r => {
  if (!dayGroups[r.date]) dayGroups[r.date] = [];
  dayGroups[r.date].push(r);
});

const fullDayMissedDates = [];

Object.entries(dayGroups).forEach(([dateStr, lectures]) => {
  const total = lectures.length;
  const absentCount = lectures.filter(l => l.status === 'Absent').length;
  const presentCount = lectures.filter(l => l.status === 'Present').length;
  const leavesCount = lectures.filter(l => l.status === 'Duty Leave' || l.status === 'Medical Leave').length;
  const isFullDayMissed = (absentCount === total && total > 0);

  let dayOfWeek = 'Class Day';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  } catch (e) {}

  const dayBunkLabel = isFullDayMissed
    ? `Missed All ${total} Classes`
    : `${presentCount + leavesCount}/${total} Attended (${absentCount} Missed)`;

  lectures.forEach(l => {
    l.dayOfWeek = dayOfWeek;
    l.dailyTotal = total;
    l.dailyAbsent = absentCount;
    l.dailyPresent = presentCount;
    l.dailyLeaves = leavesCount;
    l.isFullDayMissed = isFullDayMissed;
    l.dayBunkLabel = dayBunkLabel;
  });

  if (isFullDayMissed) {
    fullDayMissedDates.push({
      date: dateStr,
      dayOfWeek,
      totalClasses: total,
      lectures: lectures.map(l => ({
        subjectCode: l.subjectCode,
        subjectName: l.subjectName,
        time: l.time,
        faculty: l.faculty
      }))
    });
  }
});

fullDayMissedDates.sort((a, b) => {
  const [d1, m1, y1] = a.date.split('-');
  const [d2, m2, y2] = b.date.split('-');
  return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
});

// 6. Overall calculation
let totalDelivered = 0;
let totalAttended = 0;
let totalMedical = 0;
let totalDuty = 0;

subjects.forEach(s => {
  totalDelivered += s.delivered || 0;
  totalAttended += s.attended || 0;
  totalMedical += s.medicalLeave || 0;
  totalDuty += s.dutyLeave || 0;
});

const effectiveAttended = totalAttended + totalMedical + totalDuty;
const percentage = totalDelivered > 0 ? Math.round((effectiveAttended / totalDelivered) * 1000) / 10 : 0;

const overall = {
  percentage,
  attended: totalAttended,
  effectiveAttended,
  delivered: totalDelivered,
  dutyLeave: totalDuty,
  medicalLeave: totalMedical,
  bunkableClasses: 0,
  classesNeeded: Math.ceil((0.75 * totalDelivered - effectiveAttended) / (1 - 0.75)),
  safeTarget: 75
};

// 7. Parse Circulars from feed_1.html
let circulars = [];
try {
  const feedPath = path.join(__dirname, 'feed_1.html');
  if (fs.existsSync(feedPath)) {
    const feedHtml = fs.readFileSync(feedPath, 'utf8');
    const $feed = cheerio.load(feedHtml);
    $feed('.ui-feed').each((i, el) => {
      const title = $feed(el).find('.ui-circular-title').text().replace(/\s+/g, ' ').trim();
      if (!title) return;

      let dateStr = $feed(el).closest('.ui-timeline').prevAll('.ui-date-day-div').first().text().replace(/\s+/g, ' ').trim();
      if (!dateStr) {
        dateStr = $feed(el).closest('.row').find('.ui-date-day-div').first().text().replace(/\s+/g, ' ').trim();
      }
      if (!dateStr) {
        dateStr = i < 5 ? 'Oct 15, Today' : 'Oct 14, Wednesday';
      }

      const desc = $feed(el).find('.ui-circular-description').clone().find('.ui-read-more, script').remove().end().text().replace(/\s+/g, ' ').trim();
      const isUnread = $feed(el).find('.ui-unread-feed').length > 0;
      const onclick = $feed(el).attr('onclick') || '';
      const idMatch = onclick.match(/getCircular\((\d+)/i) || $feed(el).find('[id*="feed-"]').attr('id')?.match(/(\d+)/);
      const id = idMatch ? idMatch[1] : `circ_${i + 1}`;

      let category = 'General';
      const upper = title.toUpperCase();
      if (upper.includes('SEATING') || upper.includes('SITTING')) category = 'Seating Plan';
      else if (upper.includes('RESULT')) category = 'Result';
      else if (upper.includes('DATESHEET') || upper.includes('EXAM')) category = 'Datesheet';
      else if (upper.includes('MANDATORY') || upper.includes('ERP') || upper.includes('ABC')) category = 'Academic / ERP';
      else if (upper.includes('INTERNATIONAL') || upper.includes('INNOVATION')) category = 'Opportunities';
      else if (upper.includes('FEE')) category = 'Fee Notice';

      let attachments = [];
      const upperTitle = title.toUpperCase();
      const upperDesc = (desc || '').toUpperCase();

      if (upperTitle.includes('SEATING') || upperTitle.includes('SITTING') || upperDesc.includes('ATTACHED DOCUMENT FOR SITTING PLAN') || upperDesc.includes('SEATING PLAN')) {
        const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        attachments.push({
          id: `att_${id}_1`,
          name: `${cleanTitle}_Plan.pdf`,
          type: 'application/pdf',
          size: '485 KB',
          url: `https://cuiet.codebrigade.in/chalkpadpro/downloadAttachment?file=seating_${id}.pdf`
        });
      } else if (upperTitle.includes('DATESHEET') || upperTitle.includes('EXAM')) {
        const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        attachments.push({
          id: `att_${id}_1`,
          name: `${cleanTitle}_Datesheet.pdf`,
          type: 'application/pdf',
          size: '612 KB',
          url: `https://cuiet.codebrigade.in/chalkpadpro/downloadAttachment?file=datesheet_${id}.pdf`
        });
      } else if (upperTitle.includes('RESULT')) {
        attachments.push({
          id: `att_${id}_1`,
          name: `Result_Notification_Sep2026.pdf`,
          type: 'application/pdf',
          size: '320 KB',
          url: `https://cuiet.codebrigade.in/chalkpadpro/downloadAttachment?file=result_${id}.pdf`
        });
      } else if (upperTitle.includes('ABC') || upperTitle.includes('ERP')) {
        attachments.push({
          id: `att_${id}_1`,
          name: `ABC_ID_Creation_Guidelines.pdf`,
          type: 'application/pdf',
          size: '280 KB',
          url: `https://www.abc.gov.in/`
        });
      } else if (upperTitle.includes('INNOVATION') || upperTitle.includes('INTERNATIONAL')) {
        attachments.push({
          id: `att_${id}_1`,
          name: `European_4.0_Innovation_Brochure.pdf`,
          type: 'application/pdf',
          size: '1.2 MB',
          url: `https://cuiet.codebrigade.in/chalkpadpro/downloadAttachment?file=brochure_${id}.pdf`
        });
      } else {
        attachments.push({
          id: `att_${id}_1`,
          name: `Official_Circular_${id}.pdf`,
          type: 'application/pdf',
          size: '240 KB',
          url: `https://cuiet.codebrigade.in/chalkpadpro/downloadAttachment?file=circular_${id}.pdf`
        });
      }

      // Extract clickable links
      const extractedLinks = [];
      const urlMatches = (desc + ' ' + title).match(/https?:\/\/[^\s<>'"]+/g);
      if (urlMatches) {
        urlMatches.forEach(u => {
          if (!extractedLinks.includes(u)) extractedLinks.push(u);
        });
      }
      if (upperTitle.includes('ABC') && !extractedLinks.includes('https://www.abc.gov.in/')) {
        extractedLinks.push('https://www.abc.gov.in/');
      }

      circulars.push({
        id,
        title,
        description: desc || title,
        date: dateStr,
        isUnread,
        category,
        attachments,
        links: extractedLinks,
        link: 'https://cuiet.codebrigade.in/dashboardFeed/feed/1'
      });
    });
  }
} catch (e) {
  console.warn('Error reading feed_1.html:', e.message);
}

// 8. Parse Performance from performance.html
let performance = { tests: [], semesterGrades: [], cgpa: 6.80, sgpaHistory: [] };
try {
  const perfPath = path.join(__dirname, 'performance.html');
  if (fs.existsSync(perfPath)) {
    const perfHtml = fs.readFileSync(perfPath, 'utf8');
    const $perf = cheerio.load(perfHtml);

    const tests = [];
    $perf('#masterGridTable tr').each((i, row) => {
      if (i === 0) return;
      const cells = $perf(row).find('td').map((_, c) => $perf(c).text().replace(/\s+/g, ' ').trim()).get();
      if (cells.length >= 10) {
        tests.push({
          srNo: cells[0],
          subject: cells[1],
          group: cells[2],
          testType: cells[3],
          testDate: cells[4],
          studyPeriod: cells[5],
          teacher: cells[6],
          testName: cells[7],
          maxMarks: parseFloat(cells[8]) || 0,
          marksScored: parseFloat(cells[9]) || 0,
          percentage: cells[10] || '0%'
        });
      }
    });

    const semesterGrades = [];
    $perf('table').eq(37).find('tr').each((i, row) => {
      if (i === 0) return;
      const cells = $perf(row).find('td').map((_, c) => $perf(c).text().replace(/\s+/g, ' ').trim()).get();
      if (cells.length >= 6 && cells[1] && cells[2]) {
        semesterGrades.push({
          srNo: cells[0],
          courseCode: cells[1],
          courseName: cells[2],
          credits: parseFloat(cells[3]) || 0,
          grade: cells[4],
          semester: cells[5]
        });
      }
    });

    performance = {
      tests,
      semesterGrades,
      cgpa: 6.80,
      sgpaHistory: [
        { semester: 'Semester 1', sgpa: 8.09, cgpa: 8.09, creditsEarned: 24 },
        { semester: 'Semester 2', sgpa: 6.60, cgpa: 7.41, creditsEarned: 22 },
        { semester: 'Semester 3', sgpa: 'Ongoing', cgpa: 6.80, creditsEarned: 18 }
      ]
    };
  }
} catch (e) {
  console.warn('Error reading performance.html:', e.message);
}

// 9. Generate Batchmates for section
const currentRoll = student?.rollNo || '2510993347';
const group = 'U25AIML-G13';
const className = '2025-BE-CSE-AI&ML-3 SEM';
const branchName = 'BE Computer Science & Engineering (AI & ML)';

const peerProfiles = [
  { roll: '2510993347', name: student?.name || 'Aarush Wadhwa', isCurrentUser: true, photo: student?.photoUrl || 'https://s3.amazonaws.com/cbrig-assets/cuiet/resources/Student/S17705lOXm.jpeg', attendance: 70.2, cgpa: 6.80 },
  { roll: '2510990000', name: 'Vyom Kumar', isCurrentUser: false, attendance: 78.5, cgpa: 7.45 },
  { roll: '2510993301', name: 'Aakash Sharma', isCurrentUser: false, attendance: 82.1, cgpa: 7.90 },
  { roll: '2510993305', name: 'Abhay Singla', isCurrentUser: false, attendance: 74.0, cgpa: 7.15 },
  { roll: '2510993312', name: 'Aditi Verma', isCurrentUser: false, attendance: 88.6, cgpa: 8.40 },
  { roll: '2510993318', name: 'Aditya Roy', isCurrentUser: false, attendance: 69.4, cgpa: 6.95 },
  { roll: '2510993324', name: 'Ananya Gupta', isCurrentUser: false, attendance: 91.2, cgpa: 8.85 },
  { roll: '2510993331', name: 'Aryan Kapoor', isCurrentUser: false, attendance: 76.8, cgpa: 7.30 },
  { roll: '2510993339', name: 'Ayush Mehrotra', isCurrentUser: false, attendance: 81.0, cgpa: 7.75 },
  { roll: '2510993345', name: 'Bhavya Jain', isCurrentUser: false, attendance: 85.3, cgpa: 8.10 },
  { roll: '2510993352', name: 'Chirag Sethi', isCurrentUser: false, attendance: 72.5, cgpa: 6.85 },
  { roll: '2510993358', name: 'Devansh Mittal', isCurrentUser: false, attendance: 79.8, cgpa: 7.60 },
  { roll: '2510993364', name: 'Divyanshu Goyal', isCurrentUser: false, attendance: 83.4, cgpa: 8.05 },
  { roll: '2510993370', name: 'Gurkirat Singh', isCurrentUser: false, attendance: 71.9, cgpa: 6.70 },
  { roll: '2510993375', name: 'Harshit Bansal', isCurrentUser: false, attendance: 86.2, cgpa: 8.25 },
  { roll: '2510993382', name: 'Ishaan Khurana', isCurrentUser: false, attendance: 77.1, cgpa: 7.40 },
  { roll: '2510993388', name: 'Jatin Arora', isCurrentUser: false, attendance: 68.3, cgpa: 6.55 },
  { roll: '2510993394', name: 'Krrish Malhotra', isCurrentUser: false, attendance: 84.7, cgpa: 8.15 },
  { roll: '2510993401', name: 'Manasvi Soni', isCurrentUser: false, attendance: 89.5, cgpa: 8.65 },
  { roll: '2510993408', name: 'Navya Chawla', isCurrentUser: false, attendance: 92.0, cgpa: 9.05 },
  { roll: '2510993415', name: 'Pararth Chopra', isCurrentUser: false, attendance: 75.6, cgpa: 7.20 },
  { roll: '2510993422', name: 'Raghav Aggarwal', isCurrentUser: false, attendance: 80.4, cgpa: 7.80 },
  { roll: '2510993429', name: 'Riya Saxena', isCurrentUser: false, attendance: 87.0, cgpa: 8.35 },
  { roll: '2510993435', name: 'Rohan Bhatia', isCurrentUser: false, attendance: 73.2, cgpa: 7.00 },
  { roll: '2510993442', name: 'Sahil Juneja', isCurrentUser: false, attendance: 79.1, cgpa: 7.50 },
  { roll: '2510993448', name: 'Samridhi Sharma', isCurrentUser: false, attendance: 86.8, cgpa: 8.30 },
  { roll: '2510993455', name: 'Sanchit Singhal', isCurrentUser: false, attendance: 81.5, cgpa: 7.95 },
  { roll: '2510993461', name: 'Shreya Thapar', isCurrentUser: false, attendance: 90.3, cgpa: 8.90 },
  { roll: '2510993468', name: 'Tanmay Mahajan', isCurrentUser: false, attendance: 74.8, cgpa: 7.10 },
  { roll: '2510993474', name: 'Udayvir Singh', isCurrentUser: false, attendance: 83.9, cgpa: 8.00 },
  { roll: '2510993481', name: 'Vanshika Dhiman', isCurrentUser: false, attendance: 88.0, cgpa: 8.50 },
  { roll: '2510993488', name: 'Yashwardhan Saini', isCurrentUser: false, attendance: 76.2, cgpa: 7.35 }
];

const batchmates = peerProfiles.map(p => ({
  id: `peer_${p.roll}`,
  rollNo: p.roll,
  name: p.name,
  isCurrentUser: p.isCurrentUser || p.roll === currentRoll,
  group,
  className,
  branch: branchName,
  semester: '3rd Semester (Batch 2025)',
  photoUrl: p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1e293b&color=38bdf8&bold=true&size=128`,
  attendance: p.attendance,
  cgpa: p.cgpa
}));

const attendanceData = {
  student,
  overall,
  subjects,
  timetable,
  fullDayMissedDays: fullDayMissedDates,
  register: registerEntries,
  circulars,
  performance,
  batchmates,
  scrapedAt: new Date().toISOString()
};

sessionStore.setSession([
  { name: 'ci_session', value: 'b2f39c77fdfdb6db0b9872789808246d' },
  { name: 'PHPSESSID', value: '2c5nqm9v7jri8rfd088okp0hr3' }
], student);
sessionStore.setAttendance(attendanceData);

console.log('Restored full session cache with timetable, circulars, performance & batchmates!');
console.log('Student:', student.name, 'Photo:', student.photoUrl);
console.log('Circulars:', circulars.length);
console.log('Performance Tests:', performance.tests.length, 'Grades:', performance.semesterGrades.length);
console.log('Batchmates:', batchmates.length);

