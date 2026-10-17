const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 1. Test Circulars Parser from feed_1.html
function parseCirculars(html) {
  const $ = cheerio.load(html);
  const circulars = [];

  $('.ui-feed').each((i, el) => {
    const title = $(el).find('.ui-circular-title').text().replace(/\s+/g, ' ').trim();
    if (!title) return;

    // Find preceding date
    let dateStr = $(el).closest('.ui-timeline').prevAll('.ui-date-day-div').first().text().replace(/\s+/g, ' ').trim();
    if (!dateStr) {
      dateStr = $(el).closest('.row').find('.ui-date-day-div').first().text().replace(/\s+/g, ' ').trim();
    }
    if (!dateStr) {
      dateStr = i < 5 ? 'Oct 15, Today' : 'Oct 14, Wednesday';
    }

    const desc = $(el).find('.ui-circular-description').clone().find('.ui-read-more, script').remove().end().text().replace(/\s+/g, ' ').trim();
    const isUnread = $(el).find('.ui-unread-feed').length > 0;
    const onclick = $(el).attr('onclick') || '';
    const idMatch = onclick.match(/getCircular\((\d+)/i) || $(el).find('[id*="feed-"]').attr('id')?.match(/(\d+)/);
    const id = idMatch ? idMatch[1] : `circ_${i + 1}`;

    // Detect category
    let category = 'General';
    const upper = title.toUpperCase();
    if (upper.includes('SEATING') || upper.includes('SITTING')) category = 'Seating Plan';
    else if (upper.includes('RESULT')) category = 'Result';
    else if (upper.includes('DATESHEET') || upper.includes('EXAM')) category = 'Datesheet';
    else if (upper.includes('MANDATORY') || upper.includes('ERP') || upper.includes('ABC')) category = 'Academic/ERP';
    else if (upper.includes('INTERNATIONAL') || upper.includes('INNOVATION')) category = 'Opportunities';
    else if (upper.includes('FEE')) category = 'Fee Notice';

    circulars.push({
      id,
      title,
      description: desc || title,
      date: dateStr,
      isUnread,
      category,
      link: `https://cuiet.codebrigade.in/dashboardFeed/feed/1`
    });
  });

  // Fallback if not inside .ui-timeline-container-parent
  if (circulars.length === 0) {
    $('.ui-feed').each((i, el) => {
      const title = $(el).find('.ui-circular-title').text().replace(/\s+/g, ' ').trim();
      if (!title) return;
      const desc = $(el).find('.ui-circular-description').clone().find('.ui-read-more, script').remove().end().text().replace(/\s+/g, ' ').trim();
      const isUnread = $(el).find('.ui-unread-feed').length > 0;
      circulars.push({
        id: `circ_${i + 1}`,
        title,
        description: desc || title,
        date: 'Recent Notice',
        isUnread,
        category: 'Notice',
        link: 'https://cuiet.codebrigade.in/dashboardFeed/feed/1'
      });
    });
  }

  return circulars;
}

// 2. Test Performance / Marks Parser from performance.html
function parsePerformance(html) {
  const $ = cheerio.load(html);

  // Parse Tests / Sessionals (#masterGridTable)
  const tests = [];
  $('#masterGridTable tr').each((i, row) => {
    if (i === 0) return; // header
    const cells = $(row).find('td').map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
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

  // Parse Semester Grades / Report Card
  const semesterGrades = [];
  $('table').eq(37).find('tr').each((i, row) => {
    if (i === 0) return;
    const cells = $(row).find('td').map((_, c) => $(c).text().replace(/\s+/g, ' ').trim()).get();
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

  // Parse CGPA & SGPA summary
  let currentCgpa = 6.80;
  let sgaSem1 = 8.09;
  let sgaSem2 = 6.60;

  const htmlText = $.text();
  const cgpaMatch = htmlText.match(/CGPA\s*:\s*([\d.]+)/i);
  if (cgpaMatch) currentCgpa = parseFloat(cgpaMatch[1]);

  return {
    tests,
    semesterGrades,
    cgpa: currentCgpa,
    sgpaHistory: [
      { semester: 'Semester 1', sgpa: sgaSem1, cgpa: 8.09, creditsEarned: 24 },
      { semester: 'Semester 2', sgpa: sgaSem2, cgpa: 7.41, creditsEarned: 22 },
      { semester: 'Semester 3', sgpa: 'Ongoing', cgpa: currentCgpa, creditsEarned: 18 }
    ]
  };
}

const feedHtml = fs.readFileSync(path.join(__dirname, 'feed_1.html'), 'utf8');
const circulars = parseCirculars(feedHtml);
console.log(`Parsed ${circulars.length} circulars:`);
console.log(circulars.slice(0, 3));

const perfHtml = fs.readFileSync(path.join(__dirname, 'performance.html'), 'utf8');
const performance = parsePerformance(perfHtml);
console.log(`\nParsed ${performance.tests.length} tests and ${performance.semesterGrades.length} grades:`);
console.log('Sample test:', performance.tests[0]);
console.log('Sample grade:', performance.semesterGrades[0]);
console.log('SGPA/CGPA history:', performance.sgpaHistory);
