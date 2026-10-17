const { chromium } = require('playwright');

async function testClickTurnstile() {
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
  await page.waitForTimeout(3000);

  // Find turnstile frame
  const turnstileFrame = page.frames().find(f => f.url().includes('turnstile'));
  if (turnstileFrame) {
    console.log('Found turnstile frame!');
    try {
      const checkbox = await turnstileFrame.$('input[type="checkbox"], #cf-stage, body');
      console.log('Found element in frame:', !!checkbox);
      if (checkbox) {
        await checkbox.click();
        console.log('Clicked in frame, waiting 4s...');
        await page.waitForTimeout(4000);
      }
    } catch (e) {
      console.log('Click error:', e.message);
    }
  }

  const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  console.log('Turnstile token length after click:', token.length, 'token:', token.slice(0, 30));

  await browser.close();
}

testClickTurnstile().catch(console.error);
