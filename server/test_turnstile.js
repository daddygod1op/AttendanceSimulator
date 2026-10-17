const { chromium } = require('playwright');

async function testHeadlessTurnstile() {
  console.log('Testing headless Turnstile on login page...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  await page.goto('https://cuiet.codebrigade.in/loginManager/load');
  console.log('Page loaded, waiting 5 seconds for Turnstile...');
  await page.waitForTimeout(5000);

  // Check if cf-turnstile-response input has a token
  const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => 'no input');
  console.log('Turnstile token length:', token.length, 'value:', token.slice(0, 30));

  // Check iframe
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  for (const f of frames) {
    if (f.url().includes('cloudflare') || f.url().includes('turnstile')) {
      console.log('Turnstile frame URL:', f.url().slice(0, 80));
    }
  }

  await browser.close();
}

testHeadlessTurnstile().catch(console.error);
