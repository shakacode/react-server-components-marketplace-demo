#!/usr/bin/env node
/**
 * Quick Web Vitals measurement — SSR vs RSC only.
 * Usage: node scripts/measure-quick.js [label]
 * Outputs JSON to /tmp/vitals-<label>.json
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const PAGES = [
  { name: 'V1:SSR', path: '/blog/ssr' },
  { name: 'V3:RSC', path: '/blog/rsc' },
];
const RUNS = 3;
const WARMUP = 1;
const label = process.argv[2] || 'test';

function fmt(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

async function measure(browser, url) {
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');

  const requests = new Map();
  cdp.on('Network.requestWillBeSent', p => requests.set(p.requestId, { url: p.request.url, type: p.type }));
  cdp.on('Network.loadingFinished', p => {
    const r = requests.get(p.requestId);
    if (r) r.size = p.encodedDataLength;
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  } catch (e) {
    await page.close();
    return null;
  }
  await new Promise(r => setTimeout(r, 300));

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint');
    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : null,
      fcp: fcp ? fcp.startTime : null,
      lcp: lcp.length > 0 ? lcp[lcp.length - 1].startTime : null,
      domInteractive: nav ? nav.domInteractive - nav.startTime : null,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      transferSize: nav ? nav.transferSize : null,
    };
  });

  const rsc = await page.evaluate(() => {
    let pushCount = 0, totalSize = 0;
    document.querySelectorAll('script').forEach(s => {
      const t = s.textContent || '';
      if (t.includes('REACT_ON_RAILS_RSC_PAYLOADS') && t.includes('.push(')) {
        pushCount++;
        totalSize += t.length;
      }
    });
    return { pushCount, totalSize };
  });

  // Find byte position of first visible content
  const firstVisibleByte = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const pos = html.indexOf('class="container mx-auto');
    return pos > -1 ? pos : null;
  });

  let totalJs = 0, jsCount = 0, htmlSize = 0;
  for (const [, r] of requests) {
    const s = r.size || 0;
    if ((r.url || '').match(/\.js(\?|$)/) || (r.type === 'Script')) { totalJs += s; jsCount++; }
    if ((r.url || '').includes('/blog/')) htmlSize = s;
  }

  await page.close();
  return { ...timing, totalJs, jsCount, htmlSize, rsc, firstVisibleByte };
}

function avg(results, key) {
  const vals = results.filter(r => r && r[key] != null).map(r => r[key]);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const output = {};

  for (const pg of PAGES) {
    const url = BASE + pg.path;
    // Warmup
    for (let i = 0; i < WARMUP; i++) await measure(browser, url);

    const results = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await measure(browser, url);
      results.push(r);
      if (r) process.stdout.write(`  ${pg.name} run ${i + 1}: TTFB=${r.ttfb?.toFixed(0)}ms FCP=${r.fcp?.toFixed(0)}ms LCP=${r.lcp?.toFixed(0)}ms JS=${fmt(r.totalJs)}\n`);
    }

    const last = results.filter(r => r).pop();
    output[pg.name] = {
      ttfb: avg(results, 'ttfb'),
      fcp: avg(results, 'fcp'),
      lcp: avg(results, 'lcp'),
      domInteractive: avg(results, 'domInteractive'),
      domContentLoaded: avg(results, 'domContentLoaded'),
      totalJs: last?.totalJs,
      jsCount: last?.jsCount,
      htmlSize: last?.htmlSize,
      rscPushCount: last?.rsc?.pushCount,
      rscPayloadSize: last?.rsc?.totalSize,
      firstVisibleByte: last?.firstVisibleByte,
    };
  }

  await browser.close();

  const outPath = `/tmp/vitals-${label}.json`;
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to ${outPath}`);

  // Print summary
  console.log(`\n  [${ label.toUpperCase() }]`);
  console.log('  ' + '-'.repeat(70));
  console.log(`  ${''.padEnd(12)} ${'TTFB'.padStart(8)} ${'FCP'.padStart(8)} ${'LCP'.padStart(8)} ${'JS'.padStart(10)} ${'HTML'.padStart(10)} ${'RSC scripts'.padStart(12)}`);
  for (const pg of PAGES) {
    const r = output[pg.name];
    if (!r) continue;
    console.log(`  ${pg.name.padEnd(12)} ${(r.ttfb?.toFixed(0) + 'ms').padStart(8)} ${(r.fcp?.toFixed(0) + 'ms').padStart(8)} ${(r.lcp?.toFixed(0) + 'ms').padStart(8)} ${fmt(r.totalJs).padStart(10)} ${fmt(r.htmlSize).padStart(10)} ${(r.rscPushCount || 0).toString().padStart(12)}`);
  }
}

main().catch(console.error);
