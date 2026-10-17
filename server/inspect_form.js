const { chromium } = require('playwright');

async function inspectLoginForm() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.goto('https://cuiet.codebrigade.in/loginManager/load');
  await page.waitForLoadState('networkidle');
  console.log('Page URL:', page.url());
  console.log('Title:', await page.title());

  await page.waitForSelector('#txtUsername', { timeout: 10000 }).catch(e => console.log('Username timeout:', e.message));

  const sessions = await page.$$eval('#txtSession option', options => 
    options.map(o => ({ value: o.value, text: o.textContent.trim(), selected: o.selected }))
  ).catch(() => []);
  console.log('Available Sessions:', sessions);

  const institutes = await page.$$eval('#txtInstitute option', options => 
    options.map(o => ({ value: o.value, text: o.textContent.trim(), selected: o.selected }))
  ).catch(() => []);
  console.log('Available Institutes:', institutes);

  const inputs = await page.$$eval('input, select, button', els =>
    els.map(el => ({ id: el.id, name: el.name, type: el.type, value: el.value }))
  );
  console.log('Inputs found:', inputs);

  await browser.close();
}

inspectLoginForm().catch(console.error);
