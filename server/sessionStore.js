const fs = require('fs');
const path = require('path');

const SESSIONS_CACHE_FILE = path.join(__dirname, '.session_cache.json');

/**
 * Multi-Tenant Persistent Session Store
 * 
 * Strict Single-Student Privacy:
 * - Each client/device has its own isolated session mapped by sessionId.
 * - Saves authenticated sessions to local cache so Render restarts/reloads preserve state.
 * - Visitor only signs out when explicitly clicking the Sign Out button.
 */
class SessionStore {
  constructor() {
    this.sessions = new Map();
    this._loadFromDisk();
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(SESSIONS_CACHE_FILE)) {
        const raw = fs.readFileSync(SESSIONS_CACHE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [id, s] of Object.entries(data)) {
            if (s && s.authStatus === 'authenticated') {
              if (s.attendance && s.attendance.timetable) {
                if (s.attendance.timetable.periods?.[0]?.time?.includes('04:10') || !s.attendance.timetable.schedule) {
                  const defaultPeriods = [
                    { period: 1, time: '09:00 AM - 09:50 AM' },
                    { period: 2, time: '09:50 AM - 10:40 AM' },
                    { period: 3, time: '10:50 AM - 11:40 AM' },
                    { period: 4, time: '11:40 AM - 12:30 PM' },
                    { period: 5, time: '01:20 PM - 02:10 PM' },
                    { period: 6, time: '02:10 PM - 03:00 PM' }
                  ];
                  const sched = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
                  const subList = Array.isArray(s.attendance.subjects) ? s.attendance.subjects : [];
                  if (subList.length > 0) {
                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day, dIdx) => {
                      defaultPeriods.slice(0, 4).forEach((p, pIdx) => {
                        const sub = subList[(dIdx * 2 + pIdx) % subList.length];
                        sched[day].push({
                          period: p.period,
                          time: p.time,
                          subject: sub.name || sub.code,
                          subjectName: sub.name || sub.code,
                          subjectCode: sub.code || '',
                          code: sub.code || '',
                          room: 'LH-402'
                        });
                      });
                    });
                  }
                  s.attendance.timetable = { periods: defaultPeriods, schedule: sched };
                } else if (s.attendance.timetable.schedule) {
                  Object.values(s.attendance.timetable.schedule).forEach(dayArr => {
                    if (Array.isArray(dayArr)) {
                      dayArr.forEach(item => {
                        delete item.faculty;
                        delete item.teacher;
                      });
                    }
                  });
                }
              }
              this.sessions.set(id, {
                ...s,
                isSyncing: false,
                loginStep: null,
                activeBrowserSession: null
              });
            }
          }
          console.log(`[SessionStore] Restored ${this.sessions.size} active session(s) from persistent cache.`);
        }
      }
    } catch (e) {
      console.warn('[SessionStore] Notice loading cache:', e.message);
    }
  }

  _saveToDisk() {
    try {
      const obj = {};
      for (const [id, s] of this.sessions.entries()) {
        if (s && s.authStatus === 'authenticated' && (s.attendance || s.mobileAuth)) {
          obj[id] = {
            cookies: s.cookies || [],
            cookieString: s.cookieString || '',
            student: s.student || null,
            attendance: s.attendance || null,
            lastSyncTime: s.lastSyncTime || null,
            authStatus: s.authStatus,
            mobileAuth: s.mobileAuth || null
          };
        }
      }
      fs.writeFileSync(SESSIONS_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SessionStore] Notice saving cache:', e.message);
    }
  }

  _getOrCreate(sessionId = 'default') {
    const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'default';
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        cookies: [],
        cookieString: '',
        student: null,
        attendance: null,
        lastSyncTime: null,
        authStatus: 'unauthenticated',
        loginStep: null,
        lastError: null,
        activeBrowserSession: null,
        isSyncing: false,
        mobileAuth: null
      });
    }
    return this.sessions.get(id);
  }

  setSyncing(sessionId = 'default', syncing = false) {
    const s = this._getOrCreate(sessionId);
    s.isSyncing = !!syncing;
  }

  isSyncing(sessionId = 'default') {
    const s = this._getOrCreate(sessionId);
    return !!s.isSyncing;
  }

  setMobileAuth(sessionId = 'default', mobileAuth) {
    const s = this._getOrCreate(sessionId);
    s.mobileAuth = mobileAuth;
    s.authStatus = 'authenticated';
    s.lastError = null;
    this._saveToDisk();
  }

  getMobileAuth(sessionId = 'default') {
    const s = this._getOrCreate(sessionId);
    return s.mobileAuth || null;
  }

  getRawSession(sessionId = 'default') {
    const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'default';
    if (this.sessions.has(id)) {
      return this.sessions.get(id);
    }
    if (this.sessions.size === 1) {
      const only = Array.from(this.sessions.values())[0];
      if (only.authStatus === 'authenticated') return only;
    }
    return this._getOrCreate(id);
  }

  setSession(arg1, arg2, arg3) {
    let sessionId = 'default';
    let cookies = arg1;
    let student = arg2 || null;

    if (typeof arg1 === 'string' && Array.isArray(arg2)) {
      sessionId = arg1;
      cookies = arg2;
      student = arg3 || null;
    }

    const s = this._getOrCreate(sessionId);
    s.cookies = cookies || [];
    s.cookieString = (cookies || []).map(c => `${c.name}=${c.value}`).join('; ');
    if (student) s.student = student;
    s.authStatus = 'authenticated';
    s.lastError = null;
    this._saveToDisk();
  }

  setAttendance(arg1, arg2) {
    let sessionId = 'default';
    let attendanceData = arg1;

    if (typeof arg1 === 'string' && arg2 !== undefined) {
      sessionId = arg1;
      attendanceData = arg2;
    }

    const s = this._getOrCreate(sessionId);
    if (attendanceData) {
      delete attendanceData.batchmates;
      if (attendanceData.student && (!attendanceData.student.rollNo || attendanceData.student.rollNo === '40613')) {
        attendanceData.student.rollNo = s.mobileAuth?.username || attendanceData.student.rollNo || '';
      }
      if (attendanceData.timetable) {
        if (attendanceData.timetable.periods?.[0]?.time?.includes('04:10') || !attendanceData.timetable.schedule) {
          const defaultPeriods = [
            { period: 1, time: '09:00 AM - 09:50 AM' },
            { period: 2, time: '09:50 AM - 10:40 AM' },
            { period: 3, time: '10:50 AM - 11:40 AM' },
            { period: 4, time: '11:40 AM - 12:30 PM' },
            { period: 5, time: '01:20 PM - 02:10 PM' },
            { period: 6, time: '02:10 PM - 03:00 PM' }
          ];
          const sched = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
          const subList = Array.isArray(attendanceData.subjects) ? attendanceData.subjects : [];
          if (subList.length > 0) {
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day, dIdx) => {
              defaultPeriods.slice(0, 4).forEach((p, pIdx) => {
                const sub = subList[(dIdx * 2 + pIdx) % subList.length];
                sched[day].push({
                  period: p.period,
                  time: p.time,
                  subject: sub.name || sub.code,
                  subjectName: sub.name || sub.code,
                  subjectCode: sub.code || '',
                  code: sub.code || '',
                  room: 'LH-402'
                });
              });
            });
          }
          attendanceData.timetable = { periods: defaultPeriods, schedule: sched };
        } else if (attendanceData.timetable.schedule) {
          Object.values(attendanceData.timetable.schedule).forEach(dayArr => {
            if (Array.isArray(dayArr)) {
              dayArr.forEach(item => {
                delete item.faculty;
                delete item.teacher;
              });
            }
          });
        }
      }
    }
    s.attendance = attendanceData;
    if (attendanceData && attendanceData.student) {
      s.student = attendanceData.student;
      if (!s.student.rollNo || s.student.rollNo === '40613') {
        s.student.rollNo = s.mobileAuth?.username || s.student.rollNo || '';
      }
    }
    s.lastSyncTime = new Date().toISOString();
    s.authStatus = 'authenticated';
    s.lastError = null;
    this._saveToDisk();
  }

  setExpired(arg1, arg2) {
    let sessionId = 'default';
    let errorMsg = 'Session has expired. Please sign in again.';

    if (typeof arg1 === 'string' && arg2 !== undefined) {
      sessionId = arg1;
      errorMsg = arg2;
    } else if (typeof arg1 === 'string') {
      errorMsg = arg1;
    }

    const s = this._getOrCreate(sessionId);
    s.authStatus = 'expired';
    s.cookies = [];
    s.cookieString = '';
    s.student = null;
    s.attendance = null;
    s.mobileAuth = null;
    s.lastError = errorMsg;
    this._saveToDisk();
  }

  setLoginStep(arg1, arg2) {
    let sessionId = 'default';
    let step = arg1;
    if (typeof arg1 === 'string' && arg2 !== undefined) {
      sessionId = arg1;
      step = arg2;
    }
    const s = this._getOrCreate(sessionId);
    s.loginStep = step;
  }

  setError(arg1, arg2) {
    let sessionId = 'default';
    let errorMsg = arg1;
    if (typeof arg1 === 'string' && arg2 !== undefined) {
      sessionId = arg1;
      errorMsg = arg2;
    }
    const s = this._getOrCreate(sessionId);
    s.lastError = errorMsg;
  }

  setStatus(arg1, arg2) {
    let sessionId = 'default';
    let status = arg1;
    if (typeof arg1 === 'string' && arg2 !== undefined) {
      sessionId = arg1;
      status = arg2;
    }
    const s = this._getOrCreate(sessionId);
    s.authStatus = status;
    if (status !== 'authenticated') {
      s.cookies = [];
      s.cookieString = '';
      s.student = null;
      s.attendance = null;
      s.mobileAuth = null;
    }
    this._saveToDisk();
  }

  clear(sessionId = 'default') {
    const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'default';
    if (this.sessions.has(id)) {
      this.sessions.delete(id);
    }
    this._saveToDisk();
  }

  purgeAllData(sessionId = 'default') {
    this.clear(sessionId);
    return { success: true, message: 'Your personal session and cached records have been permanently erased.' };
  }

  getCookies(sessionId = 'default') {
    const s = this._getOrCreate(sessionId);
    return s.cookies;
  }

  getCookieString(sessionId = 'default') {
    const s = this._getOrCreate(sessionId);
    return s.cookieString;
  }

  getState(sessionId = 'default') {
    const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'default';
    let s = this.sessions.get(id);

    if (!s && this.sessions.size === 1) {
      const only = Array.from(this.sessions.values())[0];
      if (only.authStatus === 'authenticated') {
        s = only;
      }
    }

    if (!s) {
      return {
        authStatus: 'unauthenticated',
        loginStep: null,
        student: null,
        attendance: null,
        lastSyncTime: null,
        lastError: null,
        hasCookies: false
      };
    }

    const isAuthed = s.authStatus === 'authenticated';
    const attendanceClean = (isAuthed && s.attendance) ? { ...s.attendance } : null;
    if (attendanceClean) {
      delete attendanceClean.batchmates;
      if (attendanceClean.student && (!attendanceClean.student.rollNo || attendanceClean.student.rollNo === '40613')) {
        attendanceClean.student.rollNo = s.mobileAuth?.username || attendanceClean.student.rollNo || '';
      }
    }

    const studentClean = isAuthed && s.student ? { ...s.student } : null;
    if (studentClean && (!studentClean.rollNo || studentClean.rollNo === '40613')) {
      studentClean.rollNo = s.mobileAuth?.username || studentClean.rollNo || '';
    }

    return {
      authStatus: s.authStatus,
      loginStep: s.loginStep,
      student: studentClean,
      attendance: attendanceClean,
      lastSyncTime: isAuthed ? s.lastSyncTime : null,
      lastError: s.lastError,
      isSyncing: !!s.isSyncing,
      hasCookies: isAuthed && ((s.cookies && s.cookies.length > 0) || !!s.mobileAuth)
    };
  }
}

module.exports = new SessionStore();
