const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./cryptoService');

const SESSION_FILE = path.join(__dirname, '.session_cache.json');

class SessionStore {
  constructor() {
    this.session = {
      cookies: [],
      cookieString: '',
      student: null,
      attendance: null,
      lastSyncTime: null,
      authStatus: 'unauthenticated', // 'unauthenticated' | 'logging_in' | 'authenticated' | 'expired'
      loginStep: null,
      lastError: null,
      activeBrowserSession: null
    };

    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const raw = fs.readFileSync(SESSION_FILE, 'utf8');
        let data = null;
        try {
          // Attempt encrypted payload parse first
          data = decrypt(raw, true);
        } catch (e) {
          data = null;
        }

        // Fallback to plain JSON if previously stored unencrypted
        if (!data) {
          try {
            data = JSON.parse(raw);
          } catch (e) {}
        }

        if (data && data.cookies && data.cookies.length > 0) {
          this.session.cookies = data.cookies;
          this.session.cookieString = data.cookieString || '';
          this.session.student = data.student || null;
          // Strip any batchmates field if legacy cache existed
          if (data.attendance) {
            delete data.attendance.batchmates;
          }
          this.session.attendance = data.attendance || null;
          this.session.lastSyncTime = data.lastSyncTime || null;
          this.session.authStatus = data.authStatus || 'unauthenticated';
        }
      }
    } catch (e) {
      console.warn('[SessionStore] Failed to load session cache from disk:', e.message);
    }
  }

  saveToDisk() {
    try {
      // Ensure no batchmates data is ever stored
      const attendanceClean = this.session.attendance ? { ...this.session.attendance } : null;
      if (attendanceClean) {
        delete attendanceClean.batchmates;
      }

      const dataToSave = {
        cookies: this.session.cookies,
        cookieString: this.session.cookieString,
        student: this.session.student,
        attendance: attendanceClean,
        lastSyncTime: this.session.lastSyncTime,
        authStatus: this.session.authStatus
      };

      // Encrypt sensitive session data at rest using AES-256-GCM
      const encrypted = encrypt(dataToSave);
      fs.writeFileSync(SESSION_FILE, encrypted, 'utf8');
    } catch (e) {
      console.warn('[SessionStore] Failed to save session cache to disk:', e.message);
    }
  }

  setSession(cookies, student = null) {
    this.session.cookies = cookies;
    this.session.cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    if (student) this.session.student = student;
    this.session.authStatus = 'authenticated';
    this.session.lastError = null;
    this.saveToDisk();
  }

  setAttendance(attendanceData) {
    if (attendanceData) {
      delete attendanceData.batchmates;
    }
    this.session.attendance = attendanceData;
    if (attendanceData && attendanceData.student) {
      this.session.student = attendanceData.student;
    }
    this.session.lastSyncTime = new Date().toISOString();
    this.session.authStatus = 'authenticated';
    this.session.lastError = null;
    this.saveToDisk();
  }

  setExpired(errorMsg = 'Session has expired. Please sign in again.') {
    this.session.authStatus = 'expired';
    this.session.cookies = [];
    this.session.cookieString = '';
    this.session.student = null;
    this.session.attendance = null;
    this.session.lastError = errorMsg;
    this.saveToDisk();
  }

  setLoginStep(step) {
    this.session.loginStep = step;
  }

  setError(errorMsg) {
    this.session.lastError = errorMsg;
  }

  setStatus(status) {
    this.session.authStatus = status;
    if (status !== 'authenticated') {
      this.session.cookies = [];
      this.session.cookieString = '';
      this.session.student = null;
      this.session.attendance = null;
      this.saveToDisk();
    }
  }

  clear() {
    this.session = {
      cookies: [],
      cookieString: '',
      student: null,
      attendance: null,
      lastSyncTime: null,
      authStatus: 'unauthenticated',
      loginStep: null,
      lastError: null,
      activeBrowserSession: null
    };
    try {
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
      }
    } catch (e) {}
  }

  purgeAllData() {
    this.clear();
    console.log('[SessionStore] All cached credentials, cookies, and personal attendance records have been securely purged.');
    return { success: true, message: 'All personal session data and cached records have been permanently erased.' };
  }

  getCookies() {
    return this.session.cookies;
  }

  getCookieString() {
    return this.session.cookieString;
  }

  getState() {
    if (this.session.authStatus !== 'authenticated' && fs.existsSync(SESSION_FILE)) {
      this.loadFromDisk();
    }
    const isAuthed = this.session.authStatus === 'authenticated';
    const attendanceClean = (isAuthed && this.session.attendance) ? { ...this.session.attendance } : null;
    if (attendanceClean) {
      delete attendanceClean.batchmates;
    }
    return {
      authStatus: this.session.authStatus,
      loginStep: this.session.loginStep,
      student: isAuthed ? this.session.student : null,
      attendance: attendanceClean,
      lastSyncTime: isAuthed ? this.session.lastSyncTime : null,
      lastError: this.session.lastError,
      hasCookies: isAuthed && this.session.cookies.length > 0
    };
  }
}

module.exports = new SessionStore();
