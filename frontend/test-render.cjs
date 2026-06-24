const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  console.log('Navigating to http://localhost:4173/login ...');
  try {
    await page.goto('http://localhost:4173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Login Page loaded.');
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    
    console.log('Typing credentials...');
    await page.type('input[name="email"]', 'admin@quirk.app');
    await page.type('input[name="password"]', 'AdminPass123!');
      
    // Submit the form
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      console.log('Clicking submit...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        submitBtn.click()
      ]);
      console.log('Navigation after login complete. URL:', page.url());
      
      // wait for dashboard to load
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'dashboard-screenshot.png' });
      console.log('Screenshot saved to dashboard-screenshot.png');
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }

  await browser.close();
})();
