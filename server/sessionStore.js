const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./cryptoService');

/**
 * Multi-Tenant In-Memory Session Store
 * 
 * Strict Single-Student Privacy:
 * - Each client/device has its own isolated session mapped by sessionId.
 * - Visitors opening the website start in 'unauthenticated' status (Login Page).
 * - Zero cross-user data leakage.
 */
class SessionStore {
  constructor() {
    this.sessions = new Map();
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
        isSyncing: false
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
    }
    s.attendance = attendanceData;
    if (attendanceData && attendanceData.student) {
      s.student = attendanceData.student;
    }
    s.lastSyncTime = new Date().toISOString();
    s.authStatus = 'authenticated';
    s.lastError = null;
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
    s.lastError = errorMsg;
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
    }
  }

  clear(sessionId = 'default') {
    const id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : 'default';
    if (this.sessions.has(id)) {
      this.sessions.delete(id);
    }
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
    if (!this.sessions.has(id)) {
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

    const s = this.sessions.get(id);
    const isAuthed = s.authStatus === 'authenticated';
    const attendanceClean = (isAuthed && s.attendance) ? { ...s.attendance } : null;
    if (attendanceClean) {
      delete attendanceClean.batchmates;
    }

    return {
      authStatus: s.authStatus,
      loginStep: s.loginStep,
      student: isAuthed ? s.student : null,
      attendance: attendanceClean,
      lastSyncTime: isAuthed ? s.lastSyncTime : null,
      lastError: s.lastError,
      isSyncing: !!s.isSyncing,
      hasCookies: isAuthed && s.cookies && s.cookies.length > 0
    };
  }
}

module.exports = new SessionStore();
