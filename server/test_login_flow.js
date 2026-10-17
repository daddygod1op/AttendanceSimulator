const { chromium } = require('playwright');

async function testChromeLogin() {
  console.log('Testing launch with real Chrome...');
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
  } catch (e) {
    console.log('Chrome launch failed, trying default chromium:', e.message);
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');
  console.log('Opened page:', await page.title());
  
  await page.waitForTimeout(4000);
  
  const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  console.log('Turnstile token result:', token ? `Success! Token length = ${token.length}` : 'Empty token');

  await browser.close();
}

testChromeLogin().catch(console.error);
