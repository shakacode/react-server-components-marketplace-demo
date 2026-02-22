#!/usr/bin/env node

/**
 * Web Vitals Comparison Script
 *
 * Measures real browser performance metrics across all blog page versions
 * using Puppeteer + Chrome DevTools Protocol (CDP).
 *
 * Metrics measured:
 *   - TTFB (Time to First Byte)
 *   - FCP (First Contentful Paint)
 *   - LCP (Largest Contentful Paint)
 *   - DOM Content Loaded
 *   - Full Load Time
 *   - Total JS transferred (bytes)
 *   - Total CSS transferred (bytes)
 *   - HTML document size (bytes)
 *   - Number of JS requests
 *   - RSC payload script tags count
 *   - Total transfer size
 */

const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const PAGES = [
  { name: 'V1: SSR',        path: '/blog/ssr',        description: 'Full SSR — all JS shipped to client' },
  { name: 'V2: Client',     path: '/blog/client',     description: 'Client Async — libraries in async chunk' },
  { name: 'V3: RSC Stream', path: '/blog/rsc',        description: 'RSC Streaming — libs server-side + streaming' },
  { name: 'V4: RSC Simple', path: '/blog/rsc-simple',  description: 'RSC Simple — libs server-side, all data upfront' },
];

// Number of runs per page for averaging
const RUNS = 3;
// Warm-up run (not counted) to prime caches
const WARMUP_RUNS = 1;

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatMs(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
  return ms.toFixed(0) + ' ms';
}

async function measurePage(browser, url, runIndex) {
  const page = await browser.newPage();

  // Track network resources
  const resources = { js: [], css: [], other: [], html: null };
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');

  const networkRequests = new Map();

  cdp.on('Network.requestWillBeSent', (params) => {
    networkRequests.set(params.requestId, {
      url: params.request.url,
      type: params.type,
      startTime: params.timestamp,
    });
  });

  cdp.on('Network.responseReceived', (params) => {
    const req = networkRequests.get(params.requestId);
    if (req) {
      req.status = params.response.status;
      req.mimeType = params.response.mimeType;
      req.encodedDataLength = params.response.encodedDataLength;
      req.headers = params.response.headers;
    }
  });

  cdp.on('Network.loadingFinished', (params) => {
    const req = networkRequests.get(params.requestId);
    if (req) {
      req.encodedDataLength = params.encodedDataLength;
      req.endTime = params.timestamp;
    }
  });

  // Navigate and wait for full load
  const startTime = Date.now();

  let response;
  try {
    response = await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
  } catch (e) {
    console.error(`  Error loading ${url}: ${e.message}`);
    await page.close();
    return null;
  }

  const loadTime = Date.now() - startTime;

  // Wait a bit for any late LCP observations
  await new Promise(r => setTimeout(r, 500));

  // Get performance timing via Navigation Timing API
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');

    return {
      ttfb: nav ? nav.responseStart - nav.requestStart : null,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      loadEvent: nav ? nav.loadEventEnd - nav.startTime : null,
      fcp: fcp ? fcp.startTime : null,
      responseStart: nav ? nav.responseStart - nav.startTime : null,
      responseEnd: nav ? nav.responseEnd - nav.startTime : null,
      domInteractive: nav ? nav.domInteractive - nav.startTime : null,
      transferSize: nav ? nav.transferSize : null,
      decodedBodySize: nav ? nav.decodedBodySize : null,
    };
  });

  // Get LCP via PerformanceObserver (inject before navigation won't work, so use CDP)
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      // LCP entries may already exist
      const entries = performance.getEntriesByType('largest-contentful-paint');
      if (entries.length > 0) {
        resolve(entries[entries.length - 1].startTime);
        return;
      }
      // If not, observe briefly
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          resolve(entries[entries.length - 1].startTime);
        }
        observer.disconnect();
      });
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 2000);
      } catch(e) {
        resolve(null);
      }
    });
  });

  // Count RSC payload script tags
  const rscPayloadInfo = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script');
    let rscInitCount = 0;
    let rscPushCount = 0;
    let rscTotalSize = 0;

    scripts.forEach(s => {
      const text = s.textContent || '';
      if (text.includes('REACT_ON_RAILS_RSC_PAYLOADS')) {
        if (text.includes('.push(')) {
          rscPushCount++;
          rscTotalSize += text.length;
        } else {
          rscInitCount++;
          rscTotalSize += text.length;
        }
      }
    });

    return { rscInitCount, rscPushCount, rscTotalSize };
  });

  // Analyze network resources
  let totalJsBytes = 0;
  let totalCssBytes = 0;
  let jsRequestCount = 0;
  let cssRequestCount = 0;
  let htmlBytes = 0;
  let totalTransferBytes = 0;

  for (const [id, req] of networkRequests) {
    const size = req.encodedDataLength || 0;
    totalTransferBytes += size;

    const url = req.url || '';
    const mime = req.mimeType || '';

    if (mime.includes('javascript') || url.endsWith('.js') || url.includes('.js?')) {
      totalJsBytes += size;
      jsRequestCount++;
      resources.js.push({ url: url.split('/').pop()?.split('?')[0], size });
    } else if (mime.includes('css') || url.endsWith('.css') || url.includes('.css?')) {
      totalCssBytes += size;
      cssRequestCount++;
      resources.css.push({ url: url.split('/').pop()?.split('?')[0], size });
    } else if (mime.includes('html')) {
      htmlBytes = size;
    }
  }

  // Get total DOM element count (rendering complexity indicator)
  const domInfo = await page.evaluate(() => ({
    elementCount: document.querySelectorAll('*').length,
    scriptTagCount: document.querySelectorAll('script').length,
  }));

  await page.close();

  return {
    timing,
    lcp,
    loadTime,
    totalJsBytes,
    totalCssBytes,
    jsRequestCount,
    cssRequestCount,
    htmlBytes,
    totalTransferBytes,
    rscPayloadInfo,
    domInfo,
    resources,
  };
}

function averageResults(results) {
  const valid = results.filter(r => r !== null);
  if (valid.length === 0) return null;

  const avg = (fn) => {
    const vals = valid.map(fn).filter(v => v !== null && v !== undefined && !isNaN(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // For byte counts, take the last run (most stable after caching)
  const last = valid[valid.length - 1];

  return {
    ttfb: avg(r => r.timing.ttfb),
    responseStart: avg(r => r.timing.responseStart),
    fcp: avg(r => r.timing.fcp),
    lcp: avg(r => r.lcp),
    domContentLoaded: avg(r => r.timing.domContentLoaded),
    domInteractive: avg(r => r.timing.domInteractive),
    loadEvent: avg(r => r.timing.loadEvent),
    loadTime: avg(r => r.loadTime),
    totalJsBytes: last.totalJsBytes,
    totalCssBytes: last.totalCssBytes,
    jsRequestCount: last.jsRequestCount,
    htmlBytes: last.htmlBytes,
    totalTransferBytes: last.totalTransferBytes,
    rscPayloadInfo: last.rscPayloadInfo,
    domInfo: last.domInfo,
    resources: last.resources,
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Web Vitals Comparison — Blog Page Versions         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Runs per page: ${RUNS} (+ ${WARMUP_RUNS} warmup)\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
    ],
  });

  const allResults = {};

  for (const pageConfig of PAGES) {
    const url = BASE + pageConfig.path;
    console.log(`━━━ Measuring: ${pageConfig.name} (${url}) ━━━`);
    console.log(`    ${pageConfig.description}`);

    // Warmup
    for (let w = 0; w < WARMUP_RUNS; w++) {
      process.stdout.write(`    Warmup ${w + 1}/${WARMUP_RUNS}...`);
      await measurePage(browser, url, -1);
      console.log(' done');
    }

    // Actual runs
    const results = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`    Run ${i + 1}/${RUNS}...`);
      const result = await measurePage(browser, url, i);
      results.push(result);
      if (result) {
        console.log(` TTFB=${formatMs(result.timing.ttfb)}, FCP=${formatMs(result.timing.fcp)}, LCP=${formatMs(result.lcp)}, JS=${formatBytes(result.totalJsBytes)}`);
      } else {
        console.log(' FAILED');
      }
    }

    allResults[pageConfig.name] = averageResults(results);
    console.log('');
  }

  await browser.close();

  // ═══════════════════════════════════════════
  // Print comparison tables
  // ═══════════════════════════════════════════

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           PERFORMANCE TIMING (averaged)                             ║');
  console.log('╠══════════════════╦══════════╦══════════╦══════════╦══════════╦══════════╦════════════╣');
  console.log('║ Version          ║   TTFB   ║   FCP    ║   LCP    ║ DOM Int. ║ DCL      ║ Full Load  ║');
  console.log('╠══════════════════╬══════════╬══════════╬══════════╬══════════╬══════════╬════════════╣');

  for (const pageConfig of PAGES) {
    const r = allResults[pageConfig.name];
    if (!r) {
      console.log(`║ ${pageConfig.name.padEnd(16)} ║ ${'FAILED'.padStart(8)} ║ ${''.padStart(8)} ║ ${''.padStart(8)} ║ ${''.padStart(8)} ║ ${''.padStart(8)} ║ ${''.padStart(10)} ║`);
      continue;
    }
    console.log(
      `║ ${pageConfig.name.padEnd(16)} ║ ${formatMs(r.ttfb).padStart(8)} ║ ${formatMs(r.fcp).padStart(8)} ║ ${formatMs(r.lcp).padStart(8)} ║ ${formatMs(r.domInteractive).padStart(8)} ║ ${formatMs(r.domContentLoaded).padStart(8)} ║ ${formatMs(r.loadTime).padStart(10)} ║`
    );
  }
  console.log('╚══════════════════╩══════════╩══════════╩══════════╩══════════╩══════════╩════════════╝');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              TRANSFER SIZE BREAKDOWN                                        ║');
  console.log('╠══════════════════╦════════════╦════════════╦════════════╦════════════╦══════════╦════════════╣');
  console.log('║ Version          ║  Total JS  ║ JS Reqs    ║  HTML Doc  ║  Total CSS ║ RSC Tags ║ Total Xfer ║');
  console.log('╠══════════════════╬════════════╬════════════╬════════════╬════════════╬══════════╬════════════╣');

  for (const pageConfig of PAGES) {
    const r = allResults[pageConfig.name];
    if (!r) continue;
    const rscTags = r.rscPayloadInfo.rscInitCount + r.rscPayloadInfo.rscPushCount;
    console.log(
      `║ ${pageConfig.name.padEnd(16)} ║ ${formatBytes(r.totalJsBytes).padStart(10)} ║ ${String(r.jsRequestCount).padStart(10)} ║ ${formatBytes(r.htmlBytes).padStart(10)} ║ ${formatBytes(r.totalCssBytes).padStart(10)} ║ ${String(rscTags).padStart(8)} ║ ${formatBytes(r.totalTransferBytes).padStart(10)} ║`
    );
  }
  console.log('╚══════════════════╩════════════╩════════════╩════════════╩════════════╩══════════╩════════════╝');

  // ═══════════════════════════════════════════
  // JS Bundle details per version
  // ═══════════════════════════════════════════
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    JS BUNDLES PER VERSION                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  for (const pageConfig of PAGES) {
    const r = allResults[pageConfig.name];
    if (!r) continue;
    console.log(`\n  ── ${pageConfig.name} ──`);
    const sorted = r.resources.js.sort((a, b) => b.size - a.size);
    for (const js of sorted) {
      if (js.size > 0) {
        console.log(`    ${formatBytes(js.size).padStart(10)}  ${js.url}`);
      }
    }
    console.log(`    ${'─'.repeat(40)}`);
    console.log(`    ${formatBytes(r.totalJsBytes).padStart(10)}  TOTAL`);
  }

  // ═══════════════════════════════════════════
  // RSC Payload analysis
  // ═══════════════════════════════════════════
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    RSC PAYLOAD ANALYSIS                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  for (const pageConfig of PAGES) {
    const r = allResults[pageConfig.name];
    if (!r) continue;
    const rsc = r.rscPayloadInfo;
    if (rsc.rscInitCount === 0 && rsc.rscPushCount === 0) {
      console.log(`\n  ── ${pageConfig.name}: No RSC payloads (traditional rendering) ──`);
    } else {
      console.log(`\n  ── ${pageConfig.name} ──`);
      console.log(`    Init scripts:  ${rsc.rscInitCount}`);
      console.log(`    Push scripts:  ${rsc.rscPushCount}`);
      console.log(`    Payload size:  ${formatBytes(rsc.rscTotalSize)} (in inline <script> tags)`);
    }
  }

  // ═══════════════════════════════════════════
  // Summary / Key Takeaways
  // ═══════════════════════════════════════════
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      KEY COMPARISONS                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const ssrResult = allResults['V1: SSR'];
  const clientResult = allResults['V2: Client'];
  const rscResult = allResults['V3: RSC Stream'];
  const rscSimpleResult = allResults['V4: RSC Simple'];

  if (ssrResult && rscResult) {
    const jsSaved = ssrResult.totalJsBytes - rscResult.totalJsBytes;
    const jsSavedPct = ((jsSaved / ssrResult.totalJsBytes) * 100).toFixed(1);
    console.log(`  JS Bundle Reduction (SSR → RSC Stream):`);
    console.log(`    SSR:        ${formatBytes(ssrResult.totalJsBytes)}`);
    console.log(`    RSC Stream: ${formatBytes(rscResult.totalJsBytes)}`);
    console.log(`    Saved:      ${formatBytes(jsSaved)} (${jsSavedPct}%)\n`);
  }

  if (clientResult && rscResult) {
    const jsSaved = clientResult.totalJsBytes - rscResult.totalJsBytes;
    const jsSavedPct = clientResult.totalJsBytes > 0 ? ((jsSaved / clientResult.totalJsBytes) * 100).toFixed(1) : 'N/A';
    console.log(`  JS Bundle Reduction (Client → RSC Stream):`);
    console.log(`    Client:     ${formatBytes(clientResult.totalJsBytes)}`);
    console.log(`    RSC Stream: ${formatBytes(rscResult.totalJsBytes)}`);
    console.log(`    Saved:      ${formatBytes(jsSaved)} (${jsSavedPct}%)\n`);
  }

  if (ssrResult && rscResult) {
    console.log(`  FCP Comparison:`);
    for (const pageConfig of PAGES) {
      const r = allResults[pageConfig.name];
      if (r) console.log(`    ${pageConfig.name.padEnd(16)} ${formatMs(r.fcp)}`);
    }
    console.log('');

    console.log(`  LCP Comparison:`);
    for (const pageConfig of PAGES) {
      const r = allResults[pageConfig.name];
      if (r) console.log(`    ${pageConfig.name.padEnd(16)} ${formatMs(r.lcp)}`);
    }
  }

  console.log('\n  Done!\n');
}

main().catch(console.error);
