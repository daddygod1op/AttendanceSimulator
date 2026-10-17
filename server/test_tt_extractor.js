const fs = require('fs');
const cheerio = require('cheerio');

function extractTimetable($) {
  const periods = [
    { period: 1, time: '04:10 PM - 05:00 PM' },
    { period: 2, time: '05:00 PM - 05:50 PM' },
    { period: 3, time: '05:50 PM - 06:40 PM' },
    { period: 4, time: '06:40 PM - 07:30 PM' },
    { period: 5, time: '07:50 PM - 08:30 PM' },
    { period: 6, time: '08:30 PM - 09:20 PM' }
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
    // Check if this row represents a day
    const cells = $(tr).find('td, th');
    const firstCellText = cells.first().text().trim();
    const matchedDay = days.find(d => firstCellText.startsWith(d));
    if (!matchedDay) return;

    cells.slice(1).each((idx, td) => {
      const text = $(td).text().trim().replace(/\s+/g, ' ');
      if (text && text !== '&nbsp;' && text.length > 2) {
        // e.g. 25CSE0203LH-402P25AIML-G13Himanshu Sharma
        schedule[matchedDay].push({
          period: idx + 1,
          time: periods[idx]?.time || `Period ${idx + 1}`,
          raw: text
        });
      }
    });
  });

  return { periods, schedule };
}

const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const $ = cheerio.load(html);
const tt = extractTimetable($);
console.log('Periods:', tt.periods);
console.log('Schedule:', JSON.stringify(tt.schedule, null, 2));
