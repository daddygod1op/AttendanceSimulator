const { chromium } = require('playwright');

async function testFullAutoLogin() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--window-size=1000,800']
  });

  const page = await browser.newPage();
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');

  await page.fill('#txtUsername', '2510993347');
  await page.fill('#txtPassword', 'DummyPassword123');
  await page.selectOption('#txtSession', '20');

  console.log('Finding Turnstile frame and clicking checkbox...');
  await page.waitForTimeout(2000);

  let clicked = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const frames = page.frames();
    for (const f of frames) {
      if (f.url().includes('cloudflare') || f.url().includes('turnstile')) {
        const checkbox = await f.$('input[type="checkbox"], #cf-stage, .ctp-checkbox-label, body');
        if (checkbox) {
          console.log(`Found Turnstile checkbox on attempt ${attempt}! Clicking...`);
          await checkbox.click({ force: true }).catch(() => {});
          clicked = true;
          break;
        }
      }
    }
    if (clicked) break;
    await page.waitForTimeout(1000);
  }

  console.log('Waiting for Turnstile token to appear in DOM...');
  await page.waitForFunction(() => {
    const el = document.querySelector('input[name="cf-turnstile-response"]');
    return el && el.value && el.value.length > 50;
  }, { timeout: 15000 });

  const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value);
  console.log('SUCCESS! Token obtained, length:', token.length);

  // Now submit form and read response
  const checkLoginPromise = page.waitForResponse(
    res => res.url().includes('loginManager/checkLogin'),
    { timeout: 10000 }
  );

  console.log('Submitting form...');
  await page.evaluate(() => {
    window.$('#loginForm').submit();
  });

  const checkLoginRes = await checkLoginPromise;
  const responseBody = await checkLoginRes.text();
  console.log('Portal response status:', checkLoginRes.status());
  console.log('Portal response body:\n', responseBody);

  await browser.close();
}

testFullAutoLogin().catch(console.error);
