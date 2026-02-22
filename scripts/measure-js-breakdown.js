#!/usr/bin/env node
/**
 * Detailed JS breakdown per page — shows exactly which JS files load for SSR vs RSC.
 */
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const PAGES = [
  { name: 'V1:SSR', path: '/blog/ssr' },
  { name: 'V3:RSC', path: '/blog/rsc' },
];

function fmt(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const pg of PAGES) {
    console.log(`\n=== ${pg.name} (${pg.path}) ===`);
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    const cdp = await page.createCDPSession();
    await cdp.send('Network.enable');

    const requests = new Map();
    cdp.on('Network.requestWillBeSent', p => requests.set(p.requestId, { url: p.request.url, type: p.type }));
    cdp.on('Network.responseReceived', p => {
      const r = requests.get(p.requestId);
      if (r) {
        r.status = p.response.status;
        r.contentLength = parseInt(p.response.headers['content-length'] || '0', 10);
        r.encoding = p.response.headers['content-encoding'] || 'none';
      }
    });
    cdp.on('Network.loadingFinished', p => {
      const r = requests.get(p.requestId);
      if (r) r.transferSize = p.encodedDataLength;
    });

    await page.goto(BASE + pg.path, { waitUntil: 'networkidle0', timeout: 60000 });

    let totalJs = 0, totalTransfer = 0;
    const jsFiles = [];
    for (const [, r] of requests) {
      if ((r.url || '').match(/\.js(\?|$)/) || r.type === 'Script') {
        const name = new URL(r.url).pathname;
        const size = r.transferSize || 0;
        jsFiles.push({ name, size, encoding: r.encoding });
        totalJs += size;
      }
      if ((r.url || '').includes('/blog/')) totalTransfer = r.transferSize || 0;
    }

    // Sort by size descending
    jsFiles.sort((a, b) => b.size - a.size);

    console.log('  JS files loaded (transfer size, compressed):');
    for (const f of jsFiles) {
      console.log(`    ${fmt(f.size).padStart(10)}  ${f.name}`);
    }
    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  Total JS: ${fmt(totalJs)}  |  HTML: ${fmt(totalTransfer)}`);

    // Also check for the big vendor chunk
    const html = await page.content();
    const scriptSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });
    console.log(`\n  Script tags in HTML: ${scriptSrcs.length}`);

    await page.close();
  }

  await browser.close();
}

main().catch(console.error);
