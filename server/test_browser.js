const { chromium } = require('playwright');

async function testLaunch() {
  console.log('Testing Playwright with stealth args...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false, // In real interactive login, user needs to see the login screen or solve captcha anyway!
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US'
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const res = await page.goto('https://cuiet.codebrigade.in/loginManager/load', { waitUntil: 'domcontentloaded' });
  console.log('Response status:', res.status());
  console.log('Page Title:', await page.title());
  
  // Check if form is present
  const formPresent = await page.$('#loginForm');
  console.log('loginForm present:', !!formPresent);
  
  await browser.close();
}

testLaunch().catch(console.error);
