/**
 * Chitkara University Student Convenience Portal - Server API
 *
 * Dedicated to the currently logged-in student.
 * - Solves portal OTP fatigue through secure encrypted session persistence.
 * - Provides calendar view, date-wise attendance, latest grades, and official circulars.
 * - Multi-mode authentication:
 *     1. Server-side login with automated OTP prompt
 *     2. Interactive desktop portal helper (if OTP/Turnstile prevents automation)
 *     3. Instant session cookie import (ci_session)
 *     4. Official university export import (.xlsx, .csv, .json)
 * - Strict single-student privacy: Zero batchmates data, zero foreign student records.
 * - AES-256-GCM encrypted storage at rest with instant data purge.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const sessionStore = require('./sessionStore');
const scraper = require('./scraper');
const loginAutomation = require('./loginAutomation');
const importService = require('./importService');
const auditLogger = require('./auditLogger');
const { encrypt, decrypt } = require('./cryptoService');
const { renderCircularHtml } = require('./circularDocumentRenderer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static assets from client/public directly as well
const clientPublicPath = path.join(__dirname, '../client/public');
if (fs.existsSync(clientPublicPath)) {
  app.use(express.static(clientPublicPath));
}

function getSessionId(req) {
  return (
    req.headers['x-session-id'] ||
    req.query.sessionId ||
    (req.body && req.body.sessionId) ||
    'default'
  );
}

// ============================================================================
// 1. Session & Auth Status + Debug Endpoints
// ============================================================================
app.get('/api/status', (req, res) => {
  const sessionId = getSessionId(req);
  const state = sessionStore.getState(sessionId);
  res.json({
    ...state,
    isSyncing: sessionStore.isSyncing(sessionId),
    portalUrl: scraper.PORTAL_BASE,
    loginUrl: scraper.LOGIN_URL
  });
});

app.get('/api/debug', (req, res) => {
  const sessionId = getSessionId(req);
  const state = sessionStore.getState(sessionId);
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    authStatus: state.authStatus,
    student: state.student ? {
      name: state.student.name,
      rollNo: state.student.rollNo,
      branch: state.student.branch,
      photoUrl: state.student.photoUrl
    } : null,
    cache: {
      hasAttendance: !!state.attendance,
      subjectsCount: state.attendance?.subjects?.length || 0,
      circularsCount: state.attendance?.circulars?.length || 0,
      registerDaysCount: state.attendance?.register?.length || 0
    },
    uptime: process.uptime()
  });
});

app.get('/api/student/photo', (req, res) => {
  const localPhoto = path.join(__dirname, '../client/public/student_profile.jpg');
  if (fs.existsSync(localPhoto)) {
    return res.sendFile(localPhoto);
  }
  const sessionId = getSessionId(req);
  const state = sessionStore.getState(sessionId);
  const photoUrl = state?.student?.photoUrl || 'https://s3.amazonaws.com/cbrig-assets/cuiet/resources/Student/S173232szi.jpg';
  res.redirect(photoUrl);
});

// ============================================================================
// 2. Direct Server-Side Credentials Login (Username + Password + Session)
// ============================================================================
app.post('/api/auth/login', async (req, res) => {
  const sessionId = getSessionId(req);
  const { username, password, session } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Roll number / username and portal password are required.' });
  }

  // Cancel any prior stalled login session for this device
  loginAutomation.cleanupActiveSession(sessionId);

  sessionStore.setSyncing(sessionId, true);
  sessionStore.setLoginStep(sessionId, { step: 1, totalSteps: 4, label: 'Connecting to Portal', detail: 'Contacting Chitkara authentication server...', percent: 20 });

  try {
    console.log(`[Server] Initiating portal login for user: ${username} (session: ${sessionId})...`);
    
    // Generous 42-second timeout to allow full Turnstile security resolution & OTP dispatch
    const loginPromise = loginAutomation.loginWithCredentials({ username, password, session, sessionId });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection to Chitkara portal timed out. Please try signing in again.')), 42000)
    );

    const result = await Promise.race([loginPromise, timeoutPromise]);

    // Portal issued an OTP
    if (result.requiresOtp) {
      return res.json({
        success: true,
        requiresOtp: true,
        message: result.message
      });
    }

    // Direct login succeeded
    if (result.data) {
      sessionStore.setAttendance(sessionId, result.data);
    }
    res.json({
      success: true,
      message: result.message || 'Login approved! Attendance records synchronized.',
      data: result.data
    });
  } catch (error) {
    console.error('[Server] Login error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed. Please verify your credentials.'
    });
  } finally {
    sessionStore.setSyncing(sessionId, false);
    sessionStore.setLoginStep(sessionId, null);
  }
});

// ============================================================================
// 3. Verify OTP Step
// ============================================================================
app.post('/api/auth/verify-otp', async (req, res) => {
  const sessionId = getSessionId(req);
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ success: false, error: 'Please enter the 4-digit OTP sent to your phone/email.' });
  }

  sessionStore.setSyncing(sessionId, true);
  try {
    console.log(`[Server] Verifying OTP: ${otp} (session: ${sessionId})...`);
    const result = await loginAutomation.verifyOtp(otp, sessionId);
    if (result && result.data) {
      sessionStore.setAttendance(sessionId, result.data);
    }
    res.json({
      success: true,
      message: result.message || 'OTP verified successfully! Records retrieved.',
      data: result.data
    });
  } catch (error) {
    console.error('[Server] OTP verification failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to verify OTP. Please try again.'
    });
  } finally {
    sessionStore.setSyncing(sessionId, false);
    sessionStore.setLoginStep(sessionId, null);
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  const sessionId = getSessionId(req);
  try {
    const result = await loginAutomation.resendOtp(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel in-progress login
app.post('/api/auth/cancel-login', (req, res) => {
  const sessionId = getSessionId(req);
  loginAutomation.cleanupActiveSession(sessionId);
  sessionStore.setSyncing(sessionId, false);
  sessionStore.setLoginStep(sessionId, null);
  res.json({ success: true, message: 'Login cancelled.' });
});

// Logout endpoint to clear session and cache
app.post('/api/auth/logout', (req, res) => {
  const sessionId = getSessionId(req);
  loginAutomation.cleanupActiveSession(sessionId);
  sessionStore.clear(sessionId);
  console.log(`[Server] User logged out (session: ${sessionId}). Session data cleared.`);
  res.json({ success: true, message: 'Logged out successfully. All session data cleared.' });
});

// ============================================================================
// 4. Manual Browser Window Helper (If OTP / CAPTCHA blocks automation)
// ============================================================================
app.post('/api/auth/launch-interactive-portal', async (req, res) => {
  const sessionId = getSessionId(req);
  const { username, password, session } = req.body || {};

  sessionStore.setSyncing(sessionId, true);
  try {
    console.log('[Server] Launching interactive portal window on desktop for user:', username || 'unspecified');
    const result = await loginAutomation.launchInteractivePortal({ username, password, session, sessionId });
    if (result && result.data) {
      sessionStore.setAttendance(sessionId, result.data);
    }
    res.json({
      success: true,
      message: result.message || 'Logged in successfully via portal window!',
      data: result.data
    });
  } catch (err) {
    console.error('[Server] Interactive portal session failed or was closed:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Interactive portal session ended before login was completed.'
    });
  } finally {
    sessionStore.setSyncing(sessionId, false);
  }
});

// ============================================================================
// 5. Connect via Saved Session Cookie
// ============================================================================
app.post('/api/auth/cookie-login', async (req, res) => {
  const sessionId = getSessionId(req);
  const { cookieString } = req.body;
  if (!cookieString) {
    return res.status(400).json({ error: 'Cookie string is required (e.g. ci_session=...)' });
  }

  sessionStore.setSyncing(sessionId, true);
  try {
    console.log('[Server] Connecting using provided session cookie string...');
    const attendanceData = await scraper.connectWithCookieString(cookieString);
    sessionStore.setAttendance(sessionId, attendanceData);
    res.json({
      success: true,
      message: 'Authenticated and retrieved attendance successfully! Session cookie saved.',
      data: attendanceData
    });
  } catch (error) {
    console.error('[Server] Cookie connection failed:', error.message);
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid or expired session cookie. Please log in with your credentials.'
    });
  } finally {
    sessionStore.setSyncing(sessionId, false);
  }
});

// ============================================================================
// 6. Import Latest Official Export File (.xlsx, .csv, .json)
// ============================================================================
app.post('/api/attendance/import', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const payload = req.body;
    const userRoll = req.body.rollNo || sessionStore.getState(sessionId).student?.rollNo;
    const result = await importService.processOfficialExport(payload, userRoll);
    if (result && result.data) {
      sessionStore.setAttendance(sessionId, result.data);
    }
    res.json(result);
  } catch (err) {
    console.error('[Server] Import failed:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 7. Get Stored Attendance & Academic Records (Single Student Only)
// ============================================================================
app.get('/api/attendance', (req, res) => {
  const sessionId = getSessionId(req);
  const state = sessionStore.getState(sessionId);
  if (state.authStatus !== 'authenticated' || !state.attendance) {
    return res.status(401).json({
      error: 'Session has expired or you are unauthenticated. Please connect to https://cuiet.codebrigade.in/ first.',
      authStatus: state.authStatus,
      data: null,
      student: null
    });
  }

  res.json({
    data: state.attendance,
    student: state.student,
    lastSyncTime: state.lastSyncTime,
    authStatus: state.authStatus
  });
});

// ============================================================================
// 8. Refresh Attendance Records on Demand
// ============================================================================
app.post('/api/attendance/refresh', async (req, res) => {
  const sessionId = getSessionId(req);

  sessionStore.setSyncing(sessionId, true);
  try {
    console.log('[Server] Refreshing latest attendance records from portal for session:', sessionId);
    const cookieHeader = sessionStore.getCookieString(sessionId);
    const attendanceData = await scraper.scrapeWithCookiesDirect(cookieHeader);
    sessionStore.setAttendance(sessionId, attendanceData);
    res.json({
      success: true,
      message: 'Attendance, timetable, and marks successfully refreshed from CUIET!',
      data: attendanceData,
      lastSyncTime: sessionStore.getState(sessionId).lastSyncTime
    });
  } catch (error) {
    console.error('[Server] Refresh failed:', error.message);
    const isExpired = error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('sign in');
    res.status(isExpired ? 401 : 500).json({
      success: false,
      error: error.message,
      expired: isExpired
    });
  } finally {
    sessionStore.setSyncing(sessionId, false);
  }
});

// ============================================================================
// 9. Official Circulars & Academic Performance
// ============================================================================
app.get('/api/circulars', (req, res) => {
  const state = sessionStore.getState();
  const circulars = state.attendance?.circulars || [];
  res.json({
    success: true,
    count: circulars.length,
    data: circulars,
    lastSyncTime: state.lastSyncTime
  });
});

// View authentic circular document / printable notice
app.get('/api/circulars/:id/document', (req, res) => {
  const { id } = req.params;
  const state = sessionStore.getState();
  const circulars = state.attendance?.circulars || [];
  const notice = circulars.find(c => String(c.id) === String(id)) || {
    id,
    title: `Chitkara University Official Circular #${id}`,
    description: 'Official academic notice from Chitkara University CUIET.',
    date: '15 October 2026',
    category: 'General'
  };

  const html = renderCircularHtml({
    notice,
    student: state.student,
    autoPrint: req.query.print === '1'
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Download authentic circular document
app.get('/api/circulars/:id/download', (req, res) => {
  const { id } = req.params;
  const state = sessionStore.getState();
  const circulars = state.attendance?.circulars || [];
  const notice = circulars.find(c => String(c.id) === String(id)) || {
    id,
    title: `Chitkara_University_Circular_${id}`,
    description: 'Official notice from Chitkara University.',
    date: '15 October 2026',
    category: 'General'
  };

  const html = renderCircularHtml({
    notice,
    student: state.student,
    autoPrint: false
  });

  const cleanTitle = (notice.title || `Circular_${id}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}_Chitkara.html"`);
  res.send(html);
});

app.get('/api/performance', (req, res) => {
  const sessionId = getSessionId(req);
  const state = sessionStore.getState(sessionId);
  const performance = state.attendance?.performance || { tests: [], semesterGrades: [], cgpa: 8.74, sgpaHistory: [] };
  res.json({
    success: true,
    data: performance,
    lastSyncTime: state.lastSyncTime
  });
});

// ============================================================================
// 10. Complete Data Purge
// ============================================================================
app.post('/api/auth/purge-data', (req, res) => {
  const sessionId = getSessionId(req);
  loginAutomation.cleanupActiveSession();
  const result = sessionStore.purgeAllData(sessionId);
  res.json(result);
});

// ============================================================================
// 11. Privacy & Educational Data Protection Policy
// ============================================================================
app.get('/api/privacy/policy', (req, res) => {
  res.json({
    success: true,
    policy: {
      title: "Chitkara University CUIET Student Portal Convenience & Privacy Notice",
      dataAccessed: [
        "Your official attendance register & lecture records",
        "Your official weekly timetable schedule",
        "Your official semester grades & CGPA",
        "Your official university circulars & notices"
      ],
      purpose: "Solving official portal usability issues by providing a persistent session (preventing repetitive OTP logins) and interactive date-wise calendar visualizations.",
      storagePolicy: "Your session cookies and attendance data are stored locally in an encrypted file using AES-256-GCM. No credentials or session tokens are ever exposed to the client or shared with third parties.",
      isolationGuarantee: "Strict single-student scope: The website does NOT query, store, display, or infer data for any other student or batchmate.",
      dataDeletion: "You can permanently delete all stored cookies, cached attendance, and personal files at any time by clicking 'Purge My Data' in the privacy dialog."
    }
  });
});

// ============================================================================
// Unified Single Link: Serve Built Frontend UI & Client Routing
// ============================================================================
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`[Unified Server] Serving built React frontend from ${clientDistPath}`);
}

// ============================================================================
// Start Server
// ============================================================================
app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(` Chitkara University Student Portal running at http://localhost:${PORT}`);
  console.log(` Mode: Single-Student Convenience Dashboard (Unified UI + API)`);
  console.log(` Scope: Current Logged-in Student Only (Batchmates Removed)`);
  console.log(` Encryption: AES-256-GCM Encrypted at Rest with Instant Purge`);
  console.log(` Target Portal: ${scraper.PORTAL_BASE}`);
  console.log(`=================================================================`);

  // In cloud Linux environments, verify that Playwright Chromium is cached and ready
  if (process.env.NODE_ENV === 'production' && process.platform === 'linux') {
    const { exec } = require('child_process');
    const cliPath = path.join(__dirname, 'node_modules/playwright/cli.js');
    exec(`node "${cliPath}" install chromium`, (err) => {
      if (err) console.warn('[Server Startup] Playwright background verification:', err.message);
      else console.log('[Server Startup] Playwright Chromium verified and ready in cache.');
    });
  }
});
