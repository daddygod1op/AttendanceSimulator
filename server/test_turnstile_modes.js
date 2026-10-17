const { chromium } = require('playwright');

async function testHeadlessNew() {
  console.log('Testing launch with channel: chrome, headless: false vs headless: new...');
  
  // Test 1: with headless: false and offscreen or minimized
  const browser1 = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-position=0,0',
      '--window-size=800,600'
    ]
  });
  const page1 = await browser1.newPage();
  await page1.goto('https://cuiet.codebrigade.in/loginManager/load');
  await page1.waitForTimeout(4000);
  const token1 = await page1.$eval('input[name="cf-turnstile-response"]', el => el.value).catch(() => '');
  console.log('Headed Token length:', token1.length);
  await browser1.close();
}

testHeadlessNew().catch(console.error);
