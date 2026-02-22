#!/usr/bin/env node
/**
 * Production Web Vitals measurement — SSR vs RSC.
 * 5 warmup + 10 measurement runs for stable results.
 * Usage: node scripts/measure-production.js
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const PAGES = [
  { name: 'V1:SSR', path: '/blog/ssr' },
  { name: 'V3:RSC', path: '/blog/rsc' },
];
const RUNS = 10;
const WARMUP = 5;

function fmt(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB';
}

async function measure(browser, url) {
  const page = await browser.newPage();
  // Disable cache to simulate real first visit
  await page.setCacheEnabled(false);

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

    // CSS loading time
    const cssEntries = performance.getEntriesByType('resource').filter(r => r.name.includes('.css'));
    const cssDuration = cssEntries.length > 0 ? Math.max(...cssEntries.map(r => r.responseEnd - r.startTime)) : 0;

    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : null,
      fcp: fcp ? fcp.startTime : null,
      lcp: lcp.length > 0 ? lcp[lcp.length - 1].startTime : null,
      domInteractive: nav ? nav.domInteractive - nav.startTime : null,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      transferSize: nav ? nav.transferSize : null,
      cssDuration,
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

function median(results, key) {
  const vals = results.filter(r => r && r[key] != null).map(r => r[key]).sort((a, b) => a - b);
  if (!vals.length) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

function p95(results, key) {
  const vals = results.filter(r => r && r[key] != null).map(r => r[key]).sort((a, b) => a - b);
  if (!vals.length) return null;
  return vals[Math.floor(vals.length * 0.95)];
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const output = {};

  for (const pg of PAGES) {
    const url = BASE + pg.path;
    console.log(`\n--- ${pg.name} ---`);

    // Warmup
    console.log(`  Warming up (${WARMUP} runs)...`);
    for (let i = 0; i < WARMUP; i++) {
      const r = await measure(browser, url);
      if (r) process.stdout.write(`    warmup ${i + 1}: TTFB=${r.ttfb?.toFixed(0)}ms FCP=${r.fcp?.toFixed(0)}ms CSS=${r.cssDuration?.toFixed(0)}ms\n`);
    }

    // Measurement runs
    console.log(`  Measuring (${RUNS} runs)...`);
    const results = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await measure(browser, url);
      results.push(r);
      if (r) {
        const ttfbToFcp = r.fcp && r.ttfb ? r.fcp - r.ttfb : null;
        process.stdout.write(`    run ${(i + 1).toString().padStart(2)}: TTFB=${r.ttfb?.toFixed(0).padStart(4)}ms  FCP=${r.fcp?.toFixed(0).padStart(4)}ms  TTFB→FCP=${ttfbToFcp?.toFixed(0).padStart(4)}ms  CSS=${r.cssDuration?.toFixed(0).padStart(3)}ms  JS=${fmt(r.totalJs).padStart(8)}\n`);
      }
    }

    const last = results.filter(r => r).pop();
    output[pg.name] = {
      ttfb_avg: avg(results, 'ttfb'),
      ttfb_median: median(results, 'ttfb'),
      fcp_avg: avg(results, 'fcp'),
      fcp_median: median(results, 'fcp'),
      fcp_p95: p95(results, 'fcp'),
      ttfb_to_fcp_avg: avg(results, 'fcp') && avg(results, 'ttfb') ? avg(results, 'fcp') - avg(results, 'ttfb') : null,
      domInteractive_avg: avg(results, 'domInteractive'),
      domContentLoaded_avg: avg(results, 'domContentLoaded'),
      css_avg: avg(results, 'cssDuration'),
      totalJs: last?.totalJs,
      jsCount: last?.jsCount,
      htmlSize: last?.htmlSize,
      rscPushCount: last?.rsc?.pushCount,
      rscPayloadSize: last?.rsc?.totalSize,
      firstVisibleByte: last?.firstVisibleByte,
    };
  }

  await browser.close();

  const outPath = '/tmp/vitals-production.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to ${outPath}`);

  // Summary table
  console.log('\n  ╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('  ║                    PRODUCTION MODE COMPARISON                          ║');
  console.log('  ╠══════════════════════════════════════════════════════════════════════════╣');
  console.log(`  ║  ${''.padEnd(8)} ${'TTFB'.padStart(8)} ${'FCP'.padStart(8)} ${'TTFB→FCP'.padStart(10)} ${'CSS'.padStart(6)} ${'JS'.padStart(10)} ${'HTML'.padStart(10)} ║`);
  console.log('  ╟──────────────────────────────────────────────────────────────────────────╢');
  for (const pg of PAGES) {
    const r = output[pg.name];
    if (!r) continue;
    const ttfbToFcp = r.ttfb_to_fcp_avg;
    console.log(`  ║  ${pg.name.padEnd(8)} ${(r.ttfb_median?.toFixed(0) + 'ms').padStart(8)} ${(r.fcp_median?.toFixed(0) + 'ms').padStart(8)} ${(ttfbToFcp?.toFixed(0) + 'ms').padStart(10)} ${(r.css_avg?.toFixed(0) + 'ms').padStart(6)} ${fmt(r.totalJs).padStart(10)} ${fmt(r.htmlSize).padStart(10)} ║`);
  }
  console.log('  ╚══════════════════════════════════════════════════════════════════════════╝');

  // Delta
  const ssr = output['V1:SSR'], rsc = output['V3:RSC'];
  if (ssr && rsc) {
    const fcpDelta = rsc.fcp_median - ssr.fcp_median;
    const ttfbDelta = rsc.ttfb_median - ssr.ttfb_median;
    const ttfbToFcpDelta = rsc.ttfb_to_fcp_avg - ssr.ttfb_to_fcp_avg;
    console.log(`\n  RSC vs SSR deltas:`);
    console.log(`    TTFB:      ${ttfbDelta > 0 ? '+' : ''}${ttfbDelta.toFixed(0)}ms ${ttfbDelta > 0 ? '(RSC slower)' : '(RSC faster)'}`);
    console.log(`    FCP:       ${fcpDelta > 0 ? '+' : ''}${fcpDelta.toFixed(0)}ms ${fcpDelta > 0 ? '(RSC slower)' : '(RSC faster)'}`);
    console.log(`    TTFB→FCP:  ${ttfbToFcpDelta > 0 ? '+' : ''}${ttfbToFcpDelta.toFixed(0)}ms ${ttfbToFcpDelta > 0 ? '(RSC slower)' : '(RSC faster)'}`);
    console.log(`    JS size:   SSR=${fmt(ssr.totalJs)}, RSC=${fmt(rsc.totalJs)} (Δ=${fmt(ssr.totalJs - rsc.totalJs)} less for RSC)`);
  }
}

main().catch(console.error);
