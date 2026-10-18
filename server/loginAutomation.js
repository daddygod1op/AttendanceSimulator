let chromium = null;
try {
  const { chromium: extraChromium } = require('playwright-extra');
  const stealth = require('puppeteer-extra-plugin-stealth')();
  extraChromium.use(stealth);
  chromium = extraChromium;
} catch (e) {
  try {
    const pw = require('playwright');
    chromium = pw.chromium;
  } catch (e2) {}
}

const sessionStore = require('./sessionStore');
const scraper = require('./scraper');
const path = require('path');

// Multi-device active login sessions map keyed by sessionId
const activeSessions = new Map();

function cleanupActiveSession(sessionId = 'default') {
  if (activeSessions.has(sessionId)) {
    const s = activeSessions.get(sessionId);
    if (s.sessionTimeoutTimer) {
      clearTimeout(s.sessionTimeoutTimer);
    }
    if (s.browser) {
      s.browser.close().catch(() => {});
    }
    activeSessions.delete(sessionId);
  }
}

/**
 * Parses pipe-delimited portal error response:
 * e.g. "0|txtUsername-Username is invalid|1|"
 */
function parsePortalError(rawText) {
  if (!rawText) return 'Unknown error occurred while contacting portal.';
  const clean = rawText.trim();
  const parts = clean.split('|');
  if (parts.length >= 2 && parts[1]) {
    const errorPart = parts[1];
    const dashIdx = errorPart.indexOf('-');
    if (dashIdx !== -1) {
      return errorPart.slice(dashIdx + 1).trim();
    }
    return errorPart.trim();
  }
  return clean;
}

/**
 * Finds Turnstile frame, clicks checkbox if needed, and polls for token
 */
async function solveTurnstile(page) {
  console.log('[LoginAutomation] Checking for Cloudflare Turnstile token...');
  let token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  if (token && token.length > 50) {
    console.log(`[LoginAutomation] Turnstile already verified! Token length: ${token.length}`);
    return true;
  }

  // Find cfFrame
  let cfFrame = null;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(400);
    cfFrame = page.frames().find(f => f.url().includes('challenges.cloudflare.com') || f.url().includes('turnstile'));
    if (cfFrame) break;
  }

  if (cfFrame) {
    try {
      const cb = await cfFrame.$('input[type="checkbox"], #cf-stage, .ctp-checkbox-label, body');
      if (cb) {
        console.log('[LoginAutomation] Clicking Turnstile checkbox...');
        await cb.click({ force: true }).catch(() => {});
      }
    } catch (clickErr) {
      console.warn('[LoginAutomation] Turnstile click notice:', clickErr.message);
    }
  }

  // Poll for token: every 500ms for up to 14 seconds max
  console.log('[LoginAutomation] Polling for Turnstile token...');
  for (let s = 0; s < 28; s++) {
    await page.waitForTimeout(500);
    token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
    if (token && token.length > 50) {
      console.log(`[LoginAutomation] Turnstile token acquired in ${((s + 1) * 0.5).toFixed(1)}s! Length: ${token.length}`);
      return true;
    }
  }

  return false;
}

/**
 * Initiates direct portal login:
 * 1. Opens official portal in Chrome
 * 2. Enters username, password, session
 * 3. Solves Turnstile by clicking iframe checkbox once
 * 4. Submits login form
 * 5. Handles OTP screen or direct success
 */
async function loginWithCredentials({ username, password, session = '20', sessionId = 'default' }) {
  cleanupActiveSession(sessionId);

  if (!chromium) {
    throw new Error('Official portal automation service is initializing. Please try signing in again in a moment.');
  }

  const isCloudLinux = process.env.NODE_ENV === 'production' || process.platform === 'linux';
  const headlessMode = isCloudLinux ? true : false;

  console.log(`[LoginAutomation] Starting login attempt for user: ${username} (sessionId: ${sessionId}, headless: ${headlessMode})...`);

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: headlessMode,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  } catch (e) {
    console.log('[LoginAutomation] Chrome channel launch fallback to default chromium:', e.message);
    browser = await chromium.launch({
      headless: headlessMode,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US'
    });

    const page = await context.newPage();

    // Abort heavy image/media assets to make portal load 5x faster
    await page.route('**/*.{png,jpg,jpeg,gif,webp,ico,woff,woff2,ttf,mp4}', route => {
      if (route.request().url().includes('cloudflare') || route.request().url().includes('turnstile')) {
        return route.continue();
      }
      return route.abort();
    });

    sessionStore.setLoginStep(sessionId, { step: 1, totalSteps: 4, label: 'Opening Portal', detail: 'Connecting to official CUIET portal...', percent: 25 });
    await page.goto('https://cuiet.codebrigade.in/loginManager/load', { waitUntil: 'domcontentloaded', timeout: 15000 });

    sessionStore.setLoginStep(sessionId, { step: 2, totalSteps: 4, label: 'Entering Credentials', detail: 'Filling Roll Number & Password...', percent: 50 });
    await page.waitForSelector('#txtUsername', { timeout: 6000 });
    await page.fill('#txtUsername', username.trim());
    await page.fill('#txtPassword', password);

    if (session) {
      try {
        await page.selectOption('#txtSession', String(session));
      } catch (e) {
        console.warn('[LoginAutomation] Session select warning:', e.message);
      }
    }

    sessionStore.setLoginStep(sessionId, { step: 3, totalSteps: 4, label: 'Security Verification', detail: 'Validating security checkpoint...', percent: 75 });
    const solved = await solveTurnstile(page);
    console.log('[LoginAutomation] Turnstile verification status:', solved ? 'VERIFIED' : 'PENDING');

    const tokenAfter = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
    if (!tokenAfter || tokenAfter.length < 50) {
      console.warn('[LoginAutomation] Turnstile token not obtained. Aborting submission to avoid captcha failure.');
      await browser.close();
      throw new Error('Chitkara security verification took too long to complete. Please tap Log In again.');
    }

    sessionStore.setLoginStep(sessionId, { step: 4, totalSteps: 4, label: 'Submitting Form', detail: 'Submitting credentials to Chitkara servers...', percent: 85 });
    console.log('[LoginAutomation] Submitting login form with verified token (length: ' + tokenAfter.length + ')...');

    // Wait for checkLogin AJAX response
    const checkLoginPromise = page.waitForResponse(
      res => res.url().includes('loginManager/checkLogin'),
      { timeout: 8000 }
    ).catch(() => null);

    await page.evaluate(() => {
      if (window.$ && window.$('#loginForm').length) {
        window.$('#loginForm').submit();
      } else {
        const form = document.querySelector('#loginForm');
        if (form) form.submit();
      }
    });

    const checkLoginRes = await checkLoginPromise;
    if (!checkLoginRes) {
      await browser.close();
      throw new Error('Chitkara login server did not respond in time. Please try again in a few moments.');
    }

    const responseBody = await checkLoginRes.text();
    console.log('[LoginAutomation] Portal checkLogin response body:', responseBody);

    // Case 1: OTP required by portal
    if (responseBody.includes('otpBit')) {
      console.log('[LoginAutomation] Portal requested OTP verification! Waiting for OTP screen...');
      sessionStore.setLoginStep(sessionId, { step: 4, totalSteps: 4, label: 'OTP Dispatched', detail: 'OTP sent to your registered mobile / email. Awaiting your input...', percent: 100 });

      await page.waitForURL(url => url.href.includes('multiAuthentication'), { timeout: 8000 }).catch(() => {});
      await page.waitForSelector('#OTPText', { timeout: 6000 }).catch(() => {});

      // Keep session active for OTP submission for up to 5 minutes
      const sessionTimeoutTimer = setTimeout(() => {
        console.log(`[LoginAutomation] OTP session timed out after 5 minutes (session: ${sessionId}).`);
        cleanupActiveSession(sessionId);
      }, 5 * 60 * 1000);

      activeSessions.set(sessionId, { browser, context: page.context(), page, username, sessionTimeoutTimer });

      return {
        requiresOtp: true,
        message: 'Chitkara University has dispatched an OTP to your registered mobile number / email address. Please enter it below to complete login.'
      };
    }

    // Case 2: Succeeded directly without OTP
    if (responseBody.includes('success')) {
      console.log('[LoginAutomation] Direct login succeeded without OTP requirement!');
      sessionStore.setLoginStep(sessionId, { step: 4, totalSteps: 4, label: 'Syncing Attendance', detail: 'Direct login approved! Syncing full records...', percent: 95 });

      await page.waitForURL(url => url.href.includes('main') || url.href.includes('chalkpadpro'), { timeout: 10000 }).catch(() => {});

      const cookies = await page.context().cookies();
      await browser.close();

      return await handleSuccessfulAuthCookies(cookies, sessionId);
    }

    // Case 3: Error returned by portal
    await browser.close();
    const errorMsg = parsePortalError(responseBody);
    console.warn('[LoginAutomation] Portal login rejected:', errorMsg);
    throw new Error(errorMsg || 'Chitkara login rejected. Please check your Roll Number and Password.');
  } catch (err) {
    if (browser && (!activeSessions.has(sessionId) || activeSessions.get(sessionId).browser !== browser)) {
      await browser.close().catch(() => {});
    }
    sessionStore.setLoginStep(sessionId, null);
    throw err;
  }
}

/**
 * Submits the OTP received on mobile/email to the active portal session
 */
async function verifyOtp(otp, sessionId = 'default') {
  if (!activeSessions.has(sessionId) || !activeSessions.get(sessionId).page) {
    throw new Error('No active login session found or OTP session expired. Please sign in with your credentials again.');
  }

  const { browser, context, page } = activeSessions.get(sessionId);
  console.log(`[LoginAutomation] Submitting OTP: ${otp} (sessionId: ${sessionId})...`);
  sessionStore.setLoginStep(sessionId, { step: 1, totalSteps: 4, label: 'Submitting OTP', detail: 'Submitting 4-digit OTP to portal...', percent: 30 });

  try {
    await page.waitForSelector('#OTPText', { timeout: 4000 });
    await page.evaluate(() => {
      const el = document.getElementById('OTPText');
      if (el) el.removeAttribute('readonly');
    });

    sessionStore.setLoginStep(sessionId, { step: 2, totalSteps: 4, label: 'Verifying Code', detail: 'Validating OTP with Chitkara authentication server...', percent: 60 });
    await page.fill('#OTPText', String(otp).trim());

    const otpResponsePromise = page.waitForResponse(
      res => res.url().includes('multiAuthentication/checkOtp') || res.url().includes('checkOtp'),
      { timeout: 10000 }
    ).catch(() => null);

    await page.evaluate(() => {
      const closeBtn = document.getElementById('close');
      if (closeBtn) {
        closeBtn.click();
      } else if (window.$ && window.$('#myForm2').length) {
        window.$('#myForm2').submit();
      }
    });

    const otpRes = await otpResponsePromise;
    if (otpRes) {
      const otpResText = await otpRes.text();
      console.log('[LoginAutomation] Portal OTP response body:', otpResText);

      if (otpResText.includes('expiredOtp')) {
        cleanupActiveSession(sessionId);
        throw new Error('Your OTP has expired. Please sign in again to generate a new one.');
      }
      if (otpResText.includes('attempt')) {
        cleanupActiveSession(sessionId);
        throw new Error('Incorrect OTP entered 3 times. Please sign in again.');
      }
      if (otpResText.search('10') !== -1) {
        const errorMsg = parsePortalError(otpResText);
        throw new Error(errorMsg || 'Invalid OTP. Please check the code received on your phone/email.');
      }
    }

    sessionStore.setLoginStep(sessionId, { step: 3, totalSteps: 4, label: 'Syncing Attendance', detail: 'OTP approved! Fetching attendance register & timetable...', percent: 80 });
    await page.waitForURL(url => url.href.includes('main') || url.href.includes('chalkpadpro'), { timeout: 10000 }).catch(() => {});

    sessionStore.setLoginStep(sessionId, { step: 4, totalSteps: 4, label: 'Finalizing Dashboard', detail: 'Syncing profile photo, circulars & timetable...', percent: 95 });
    const cookies = await context.cookies();
    cleanupActiveSession(sessionId);

    return await handleSuccessfulAuthCookies(cookies, sessionId);
  } catch (err) {
    sessionStore.setLoginStep(sessionId, null);
    throw err;
  }
}

/**
 * Triggers resend OTP on the active page
 */
async function resendOtp(sessionId = 'default') {
  if (!activeSessions.has(sessionId) || !activeSessions.get(sessionId).page) {
    throw new Error('No active login session. Please sign in again.');
  }

  const { page } = activeSessions.get(sessionId);
  console.log(`[LoginAutomation] Triggering Resend OTP on portal (sessionId: ${sessionId})...`);

  try {
    await page.evaluate(() => {
      if (typeof window.reSendOtpFoo === 'function') {
        window.reSendOtpFoo();
      } else {
        const resendLink = document.getElementById('reSendOtp');
        if (resendLink) resendLink.click();
      }
    });

    return { success: true, message: 'A new OTP has been requested from Chitkara.' };
  } catch (e) {
    throw new Error('Failed to request OTP resend: ' + e.message);
  }
}

/**
 * Launches an interactive desktop Chrome window for user to log in visually,
 * and automatically captures the session the instant authentication succeeds.
 */
async function launchInteractivePortal({ username = '', password = '', session = '20', sessionId = 'default' } = {}) {
  cleanupActiveSession(sessionId);

  if (!chromium) {
    throw new Error('Interactive browser helper is not available in cloud hosting environment.');
  }

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--start-maximized']
    });
  } catch (e) {
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
    });
  }

  const page = await browser.newPage();
  sessionStore.setLoginStep(sessionId, 'Official portal opened in desktop browser. Please log in...');
  await page.goto('https://cuiet.codebrigade.in/loginManager/load', { waitUntil: 'load', timeout: 20000 });
  await page.bringToFront();

  // Pre-fill fields if user already entered them in the app
  if (username) {
    await page.fill('#txtUsername', username).catch(() => {});
  }
  if (password) {
    await page.fill('#txtPassword', password).catch(() => {});
  }
  if (session) {
    await page.selectOption('#txtSession', String(session)).catch(() => {});
  }

  // Attempt automatic Turnstile solve
  solveTurnstile(page, page.context()).catch(() => {});

  // Wait for user to complete login (URL changes to main or chalkpadpro)
  return new Promise((resolve, reject) => {
    let resolved = false;

    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame() && !resolved) {
        const url = page.url();
        if (url.includes('main') || url.includes('chalkpadpro') || url.includes('studentDetails')) {
          resolved = true;
          sessionStore.setLoginStep(sessionId, 'Authentication detected! Syncing attendance & timetable...');
          try {
            await page.waitForTimeout(2000);
            const cookies = await page.context().cookies();
            await browser.close();
            const result = await handleSuccessfulAuthCookies(cookies, sessionId);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }
      }
    });

    browser.on('disconnected', () => {
      if (!resolved) {
        reject(new Error('Browser window was closed before login completed.'));
      }
    });
  });
}

/**
 * Stores authenticated cookies and triggers full attendance scrape
 */
async function handleSuccessfulAuthCookies(cookies, sessionId = 'default') {
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  console.log(`[LoginAutomation] Extracted cookies count: ${cookies.length} (session: ${sessionId})`);

  sessionStore.setSession(sessionId, cookies);
  sessionStore.setLoginStep(sessionId, 'Retrieving full date-wise attendance register & timetable...');

  const attendanceData = await scraper.scrapeWithCookiesDirect(cookieString);
  sessionStore.setLoginStep(sessionId, null);

  return {
    success: true,
    message: 'Successfully authenticated and synced attendance data!',
    data: attendanceData
  };
}

module.exports = {
  loginWithCredentials,
  verifyOtp,
  resendOtp,
  launchInteractivePortal,
  cleanupActiveSession
};
