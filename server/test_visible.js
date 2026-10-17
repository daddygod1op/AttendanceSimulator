const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

async function testVisibleWindow() {
  const userDataDir = path.join(os.tmpdir(), 'chitkara_browser_profile');
  console.log('Using userDataDir:', userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');
  await page.bringToFront();
  console.log('Navigated! Current URL:', page.url());
  console.log('Waiting 5 seconds to test visibility...');
  await new Promise(r => setTimeout(r, 5000));
  await context.close();
  console.log('Closed context.');
}

testVisibleWindow().catch(console.error);
