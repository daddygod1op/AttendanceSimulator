let chromium = null;
try {
  const pw = require('playwright');
  chromium = pw.chromium;
} catch (e) {
  // Playwright is optional in cloud environments (direct scraping and cookie login work without it)
}
const sessionStore = require('./sessionStore');
const scraper = require('./scraper');
const path = require('path');

let activeSession = null;
let sessionTimeoutTimer = null;

function cleanupActiveSession() {
  if (sessionTimeoutTimer) {
    clearTimeout(sessionTimeoutTimer);
    sessionTimeoutTimer = null;
  }
  if (activeSession && activeSession.browser) {
    activeSession.browser.close().catch(() => {});
  }
  activeSession = null;
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
 * Finds Turnstile frame, clicks checkbox once, and waits for token
 */
async function solveTurnstile(page) {
  console.log('[LoginAutomation] Locating Cloudflare Turnstile...');
  await page.waitForTimeout(2000);

  let clicked = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
    if (token && token.length > 50) {
      console.log(`[LoginAutomation] Turnstile already verified! Token length: ${token.length}`);
      return true;
    }

    const frames = page.frames();
    for (const f of frames) {
      if (f.url().includes('cloudflare') || f.url().includes('turnstile')) {
        const checkbox = await f.$('input[type="checkbox"], #cf-stage, .ctp-checkbox-label, body').catch(() => null);
        if (checkbox) {
          console.log(`[LoginAutomation] Found Turnstile checkbox on attempt ${attempt + 1}! Clicking once...`);
          await checkbox.click({ force: true }).catch(() => {});
          clicked = true;
          break;
        }
      }
    }

    if (clicked) break;
    await page.waitForTimeout(1000);
  }

  console.log('[LoginAutomation] Waiting for Cloudflare Turnstile token to appear...');
  await page.waitForFunction(() => {
    const el = document.querySelector('input[name="cf-turnstile-response"]');
    return el && el.value && el.value.length > 50;
  }, { timeout: 20000 }).catch(() => {});

  const finalToken = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  console.log('[LoginAutomation] Final Turnstile token length:', finalToken ? finalToken.length : 0);
  return Boolean(finalToken && finalToken.length > 50);
}

/**
 * Initiates direct portal login:
 * 1. Opens official portal in Chrome
 * 2. Enters username, password, session
 * 3. Solves Turnstile by clicking iframe checkbox once
 * 4. Submits login form
 * 5. Handles OTP screen or direct success
 */
async function loginWithCredentials({ username, password, session = '20' }) {
  cleanupActiveSession();

  if (!chromium) {
    throw new Error('Official portal automation service is initializing. Please try signing in again in a moment.');
  }

  const isCloudLinux = process.env.NODE_ENV === 'production' || process.platform === 'linux';
  const headlessMode = isCloudLinux ? true : false;

  console.log(`[LoginAutomation] Starting login attempt for user: ${username} (headless: ${headlessMode})...`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: headlessMode,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  } catch (e) {
    console.warn('[LoginAutomation] Primary chromium launch failed:', e.message);

    // If browser executable is missing in cloud cache, auto-install immediately and retry
    if (e.message.includes("doesn't exist") || e.message.includes('playwright install')) {
      console.log('[LoginAutomation] Chromium binary missing in environment. Auto-installing Playwright Chromium now...');
      try {
        const { execSync } = require('child_process');
        const cliPath = path.join(__dirname, 'node_modules/playwright/cli.js');
        execSync(`node "${cliPath}" install chromium`, { stdio: 'inherit' });
        console.log('[LoginAutomation] Playwright Chromium installed successfully! Retrying browser launch...');
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
      } catch (installErr) {
        console.error('[LoginAutomation] On-the-fly browser install failed:', installErr.message);
      }
    }

    if (!browser) {
      try {
        browser = await chromium.launch({
          channel: 'chrome',
          headless: headlessMode,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
        });
      } catch (e2) {
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }
    }
  }

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-IN,en;q=0.9'
    });
    const page = await context.newPage();
    sessionStore.setLoginStep({ step: 1, totalSteps: 4, label: 'Opening Portal', detail: 'Connecting to official CUIET portal in Chrome...', percent: 20 });
    await page.goto('https://cuiet.codebrigade.in/loginManager/load', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.bringToFront();

    sessionStore.setLoginStep({ step: 2, totalSteps: 4, label: 'Entering Credentials', detail: 'Filling Roll Number & Password...', percent: 40 });
    await page.waitForSelector('#txtUsername', { timeout: 10000 });
    await page.fill('#txtUsername', username.trim());
    await page.fill('#txtPassword', password);

    if (session) {
      try {
        await page.selectOption('#txtSession', String(session));
      } catch (e) {
        console.warn('[LoginAutomation] Session select warning:', e.message);
      }
    }

    sessionStore.setLoginStep({ step: 3, totalSteps: 4, label: 'Bypassing Security', detail: 'Verifying Cloudflare Turnstile (~2-3s)...', percent: 65 });
    const solved = await solveTurnstile(page);
    console.log('[LoginAutomation] Turnstile verification status:', solved ? 'VERIFIED' : 'TIMED OUT');

    sessionStore.setLoginStep({ step: 4, totalSteps: 4, label: 'Submitting Form', detail: 'Submitting credentials to Chitkara servers...', percent: 85 });
    console.log('[LoginAutomation] Submitting login form...');

    // Wait for checkLogin AJAX response
    const checkLoginPromise = page.waitForResponse(
      res => res.url().includes('loginManager/checkLogin'),
      { timeout: 15000 }
    );

    await page.evaluate(() => {
      if (window.$ && window.$('#loginForm').length) {
        window.$('#loginForm').submit();
      } else {
        const form = document.querySelector('#loginForm');
        if (form) form.submit();
      }
    });

    const checkLoginRes = await checkLoginPromise;
    const responseBody = await checkLoginRes.text();
    console.log('[LoginAutomation] Portal checkLogin response body:', responseBody);

    // Case 1: OTP required by portal
    if (responseBody.includes('otpBit')) {
      console.log('[LoginAutomation] Portal requested OTP verification! Waiting for OTP screen...');
      sessionStore.setLoginStep({ step: 4, totalSteps: 4, label: 'OTP Dispatched', detail: 'OTP sent to your registered mobile / email. Awaiting your input...', percent: 100 });

      await page.waitForURL(url => url.href.includes('multiAuthentication'), { timeout: 15000 }).catch(() => {});
      await page.waitForSelector('#OTPText', { timeout: 10000 }).catch(() => {});

      // Keep session active for OTP submission
      activeSession = { browser, context: page.context(), page, username };
      sessionTimeoutTimer = setTimeout(() => {
        console.log('[LoginAutomation] OTP session timed out after 5 minutes.');
        cleanupActiveSession();
      }, 5 * 60 * 1000);

      return {
        requiresOtp: true,
        message: 'Chitkara University has dispatched an OTP to your registered mobile number / email address. Please enter it below to complete login.'
      };
    }

    // Case 2: Succeeded directly without OTP
    if (responseBody.includes('success')) {
      console.log('[LoginAutomation] Direct login succeeded without OTP requirement!');
      sessionStore.setLoginStep({ step: 4, totalSteps: 4, label: 'Syncing Attendance', detail: 'Direct login approved! Syncing full records...', percent: 95 });

      await page.waitForURL(url => url.href.includes('main') || url.href.includes('chalkpadpro'), { timeout: 15000 }).catch(() => {});

      const cookies = await page.context().cookies();
      await browser.close();

      return await handleSuccessfulAuthCookies(cookies);
    }

    // Case 3: Error returned by portal
    await browser.close();
    const errorMsg = parsePortalError(responseBody);
    console.warn('[LoginAutomation] Portal login rejected:', errorMsg);
    throw new Error(errorMsg);
  } catch (err) {
    if (browser && (!activeSession || activeSession.browser !== browser)) {
      await browser.close().catch(() => {});
    }
    sessionStore.setLoginStep(null);
    throw err;
  }
}

/**
 * Submits the OTP received on mobile/email to the active portal session
 */
async function verifyOtp(otp) {
  if (!activeSession || !activeSession.page) {
    throw new Error('No active login session found or OTP session expired. Please sign in with your credentials again.');
  }

  const { browser, context, page } = activeSession;
  console.log(`[LoginAutomation] Submitting OTP: ${otp}...`);
  sessionStore.setLoginStep({ step: 1, totalSteps: 4, label: 'Submitting OTP', detail: 'Submitting 4-digit OTP to portal...', percent: 25 });

  try {
    await page.waitForSelector('#OTPText', { timeout: 5000 });
    await page.evaluate(() => {
      const el = document.getElementById('OTPText');
      if (el) el.removeAttribute('readonly');
    });

    sessionStore.setLoginStep({ step: 2, totalSteps: 4, label: 'Verifying Code', detail: 'Validating OTP with Chitkara authentication server...', percent: 50 });
    await page.fill('#OTPText', String(otp).trim());

    const otpResponsePromise = page.waitForResponse(
      res => res.url().includes('multiAuthentication/checkOtp') || res.url().includes('checkOtp'),
      { timeout: 15000 }
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
        cleanupActiveSession();
        throw new Error('Your OTP has expired. Please sign in again to generate a new one.');
      }
      if (otpResText.includes('attempt')) {
        cleanupActiveSession();
        throw new Error('Incorrect OTP entered 3 times. Please sign in again.');
      }
      if (otpResText.search('10') !== -1) {
        const errorMsg = parsePortalError(otpResText);
        throw new Error(errorMsg || 'Invalid OTP. Please check the code received on your phone/email.');
      }
    }

    sessionStore.setLoginStep({ step: 3, totalSteps: 4, label: 'Syncing Attendance', detail: 'OTP approved! Fetching attendance register & timetable...', percent: 75 });
    await page.waitForURL(url => url.href.includes('main') || url.href.includes('chalkpadpro'), { timeout: 15000 }).catch(() => {});

    sessionStore.setLoginStep({ step: 4, totalSteps: 4, label: 'Finalizing Dashboard', detail: 'Syncing profile photo, circulars, marks & classmates...', percent: 95 });
    const cookies = await context.cookies();
    cleanupActiveSession();

    return await handleSuccessfulAuthCookies(cookies);
  } catch (err) {
    sessionStore.setLoginStep(null);
    throw err;
  }
}

/**
 * Triggers resend OTP on the active page
 */
async function resendOtp() {
  if (!activeSession || !activeSession.page) {
    throw new Error('No active login session. Please sign in again.');
  }

  const { page } = activeSession;
  console.log('[LoginAutomation] Triggering Resend OTP on portal...');

  try {
    await page.evaluate(() => {
      if (typeof window.reSendOtpFoo === 'function') {
        window.reSendOtpFoo();
      } else {
        const resendLink = document.getElementById('reSendOtp');
        if (resendLink) resendLink.click();
      }
    });

    return { success: true, message: 'A new OTP has been requested.' };
  } catch (e) {
    throw new Error('Failed to request OTP resend: ' + e.message);
  }
}

/**
 * Launches an interactive desktop Chrome window for user to log in visually,
 * and automatically captures the session the instant authentication succeeds.
 */
async function launchInteractivePortal({ username = '', password = '', session = '20' } = {}) {
  cleanupActiveSession();

  if (!chromium) {
    throw new Error('Interactive browser helper is not available in cloud hosting environment. Please connect using your session cookie (ci_session) or official export file.');
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
  sessionStore.setLoginStep('Official portal opened in desktop browser. Please log in...');
  await page.goto('https://cuiet.codebrigade.in/loginManager/load', { waitUntil: 'load', timeout: 30000 });
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

  // Attempt automatic Turnstile solve once
  solveTurnstile(page).catch(() => {});

  // Wait for user to complete login (URL changes to main or chalkpadpro)
  return new Promise((resolve, reject) => {
    let resolved = false;

    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame() && !resolved) {
        const url = page.url();
        if (url.includes('main') || url.includes('chalkpadpro') || url.includes('studentDetails')) {
          resolved = true;
          sessionStore.setLoginStep('Authentication detected! Syncing attendance & timetable...');
          try {
            await page.waitForTimeout(2000);
            const cookies = await page.context().cookies();
            await browser.close();
            const result = await handleSuccessfulAuthCookies(cookies);
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
async function handleSuccessfulAuthCookies(cookies) {
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  console.log('[LoginAutomation] Extracted cookies count:', cookies.length);

  sessionStore.setSession(cookies);
  sessionStore.setLoginStep('Retrieving full date-wise attendance register & timetable...');

  const attendanceData = await scraper.scrapeWithCookiesDirect(cookieString);
  sessionStore.setLoginStep(null);

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
