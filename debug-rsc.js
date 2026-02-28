const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to RSC page...');
  await page.goto('http://localhost:3005/product-search/rsc', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  console.log('Waiting for content...');
  await new Promise(r => setTimeout(r, 3000));

  const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
  console.log('DOM elements:', domCount);

  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body text (first 500 chars):', bodyText);

  const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
  console.log('\nBody HTML (first 2000 chars):', bodyHTML);

  // Check for errors
  const errors = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[data-error], .error');
    return Array.from(errorElements).map(e => e.textContent);
  });
  if (errors.length > 0) console.log('Errors found:', errors);

  await page.screenshot({ path: '/tmp/rsc-page.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/rsc-page.png');

  await browser.close();
}

main().catch(console.error);
