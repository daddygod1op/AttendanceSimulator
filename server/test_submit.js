const { chromium } = require('playwright');

async function testSubmitCredentials() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--window-size=900,700']
  });
  const page = await browser.newPage();
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');

  await page.fill('#txtUsername', 'test_user_123');
  await page.fill('#txtPassword', 'test_pass_123');
  await page.selectOption('#txtSession', '20'); // JulDec2026

  console.log('Waiting for Turnstile token...');
  await page.waitForFunction(() => {
    const el = document.querySelector('input[name="cf-turnstile-response"]');
    return el && el.value && el.value.length > 50;
  }, { timeout: 15000 });
  console.log('Turnstile ready!');

  // Listen to response of checkLogin
  const responsePromise = page.waitForResponse(r => r.url().includes('loginManager/checkLogin'), { timeout: 10000 });

  console.log('Submitting form...');
  await page.evaluate(() => {
    window.$('#loginForm').submit();
  });
  
  const res = await responsePromise;
  console.log('checkLogin response status:', res.status());
  const text = await res.text();
  console.log('checkLogin response body:', text);

  await page.waitForTimeout(2000);
  console.log('Current URL after submit:', page.url());

  await browser.close();
}

testSubmitCredentials().catch(console.error);
