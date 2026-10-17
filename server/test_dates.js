const fs = require('fs');

const raw = fs.readFileSync('.session_cache.json', 'utf8');
const data = JSON.parse(raw);

console.log('Session student:', data.student?.name);
console.log('Total register entries:', data.attendance?.register?.length);

const dates = [...new Set(data.attendance?.register?.map(r => r.date))];
console.log('Unique dates:', dates.length);
console.log('Earliest date:', dates[0], 'Latest date:', dates[dates.length - 1]);

// Check date breakdown by month
const months = {};
dates.forEach(d => {
  const [day, month, year] = d.split('-');
  const key = `${year}-${month}`;
  months[key] = (months[key] || 0) + 1;
});

console.log('Month breakdown (days with classes):', months);
