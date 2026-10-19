/**
 * Authentic Evening Shift Timetable (04:10 PM - 09:20 PM)
 * Hall: LH-402
 * Verified zero teacher names.
 */
const CANONICAL_EVENING_TIMETABLE = {
  periods: [
    { period: 1, time: '04:10 PM - 05:00 PM' },
    { period: 2, time: '05:00 PM - 05:50 PM' },
    { period: 3, time: '05:50 PM - 06:40 PM' },
    { period: 4, time: '06:40 PM - 07:30 PM' },
    { period: 5, time: '07:50 PM - 08:30 PM' },
    { period: 6, time: '08:30 PM - 09:20 PM' }
  ],
  schedule: {
    Monday: [
      { period: 1, time: '04:10 PM - 05:00 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 2, time: '05:00 PM - 05:50 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 3, time: '05:50 PM - 06:40 PM', subject: 'Database Management System', subjectName: 'Database Management System', subjectCode: '24CSE0209', code: '24CSE0209', room: 'LH-402' },
      { period: 4, time: '06:40 PM - 07:30 PM', subject: 'Database Management System', subjectName: 'Database Management System', subjectCode: '24CSE0209', code: '24CSE0209', room: 'LH-402' },
      { period: 5, time: '07:50 PM - 08:30 PM', subject: 'Programming in Java', subjectName: 'Programming in Java', subjectCode: '25CSE0202', code: '25CSE0202', room: 'LH-402' },
      { period: 6, time: '08:30 PM - 09:20 PM', subject: 'Programming in Java', subjectName: 'Programming in Java', subjectCode: '25CSE0202', code: '25CSE0202', room: 'LH-402' }
    ],
    Tuesday: [
      { period: 1, time: '04:10 PM - 05:00 PM', subject: 'Programming in Java', subjectName: 'Programming in Java', subjectCode: '25CSE0202', code: '25CSE0202', room: 'LH-402' },
      { period: 2, time: '05:00 PM - 05:50 PM', subject: 'Object Oriented Programming', subjectName: 'Object Oriented Programming', subjectCode: '25CSE0204', code: '25CSE0204', room: 'LH-402' },
      { period: 3, time: '05:50 PM - 06:40 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 4, time: '06:40 PM - 07:30 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 5, time: '07:50 PM - 08:30 PM', subject: 'Database Management System', subjectName: 'Database Management System', subjectCode: '24CSE0209', code: '24CSE0209', room: 'LH-402' },
      { period: 6, time: '08:30 PM - 09:20 PM', subject: 'Database Management System', subjectName: 'Database Management System', subjectCode: '24CSE0209', code: '24CSE0209', room: 'LH-402' }
    ],
    Wednesday: [
      { period: 1, time: '04:10 PM - 05:00 PM', subject: 'Statistics and Data Engineering', subjectName: 'Statistics and Data Engineering', subjectCode: '25CAI0201', code: '25CAI0201', room: 'LH-402' },
      { period: 2, time: '05:00 PM - 05:50 PM', subject: 'Statistics and Data Engineering', subjectName: 'Statistics and Data Engineering', subjectCode: '25CAI0201', code: '25CAI0201', room: 'LH-402' },
      { period: 3, time: '05:50 PM - 06:40 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 4, time: '06:40 PM - 07:30 PM', subject: 'Front End Engineering-II', subjectName: 'Front End Engineering-II', subjectCode: '25CSE0203', code: '25CSE0203', room: 'LH-402' },
      { period: 5, time: '07:50 PM - 08:30 PM', subject: 'Object Oriented Programming', subjectName: 'Object Oriented Programming', subjectCode: '25CSE0204', code: '25CSE0204', room: 'LH-402' },
      { period: 6, time: '08:30 PM - 09:20 PM', subject: 'Object Oriented Programming', subjectName: 'Object Oriented Programming', subjectCode: '25CSE0204', code: '25CSE0204', room: 'LH-402' }
    ],
    Thursday: [
      { period: 1, time: '04:10 PM - 05:00 PM', subject: 'Object Oriented Programming', subjectName: 'Object Oriented Programming', subjectCode: '25CSE0204', code: '25CSE0204', room: 'LH-402' },
      { period: 2, time: '05:00 PM - 05:50 PM', subject: 'Object Oriented Programming', subjectName: 'Object Oriented Programming', subjectCode: '25CSE0204', code: '25CSE0204', room: 'LH-402' },
      { period: 3, time: '05:50 PM - 06:40 PM', subject: 'Statistics and Data Engineering', subjectName: 'Statistics and Data Engineering', subjectCode: '25CAI0201', code: '25CAI0201', room: 'LH-402' },
      { period: 4, time: '06:40 PM - 07:30 PM', subject: 'Statistics and Data Engineering', subjectName: 'Statistics and Data Engineering', subjectCode: '25CAI0201', code: '25CAI0201', room: 'LH-402' }
    ],
    Friday: [
      { period: 1, time: '04:10 PM - 05:00 PM', subject: 'Programming in Java', subjectName: 'Programming in Java', subjectCode: '25CSE0202', code: '25CSE0202', room: 'LH-402' },
      { period: 2, time: '05:00 PM - 05:50 PM', subject: 'Programming in Java', subjectName: 'Programming in Java', subjectCode: '25CSE0202', code: '25CSE0202', room: 'LH-402' }
    ],
    Saturday: []
  }
};

module.exports = { CANONICAL_EVENING_TIMETABLE };
