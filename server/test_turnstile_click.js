const { chromium } = require('playwright');

async function testTurnstileCheckbox() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');

  console.log('Waiting 3s for turnstile to load...');
  await page.waitForTimeout(3000);

  const frames = page.frames();
  console.log('Frames count:', frames.length);
  for (const f of frames) {
    console.log('Frame URL:', f.url());
    if (f.url().includes('cloudflare') || f.url().includes('turnstile')) {
      const content = await f.content().catch(e => e.message);
      console.log('Turnstile Frame HTML preview:', content.slice(0, 500));
      
      const checkbox = await f.$('input[type="checkbox"], #cf-stage, .ctp-checkbox-label, body');
      console.log('Found checkbox element:', !!checkbox);
      if (checkbox) {
        console.log('Clicking checkbox...');
        await checkbox.click({ force: true }).catch(e => console.log('Click failed:', e.message));
      }
    }
  }

  await page.waitForTimeout(5000);
  const token = await page.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  console.log('Turnstile token after click:', token.length, token ? token.slice(0, 30) : 'none');

  await browser.close();
}

testTurnstileCheckbox().catch(console.error);
