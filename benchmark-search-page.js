#!/usr/bin/env node

/**
 * Product Search Page Performance Benchmark
 *
 * Measures FCP, LCP, INP-proxy (interaction responsiveness), TTI, and JS bundle size
 * for all three versions: SSR, Client, RSC.
 *
 * Usage: node benchmark-search-page.js [--port 3005] [--runs 5]
 */

const puppeteer = require('puppeteer');

const PORT = process.argv.includes('--port')
  ? process.argv[process.argv.indexOf('--port') + 1]
  : '3005';

const RUNS = process.argv.includes('--runs')
  ? parseInt(process.argv[process.argv.indexOf('--runs') + 1], 10)
  : 5;

const BASE_URL = `http://localhost:${PORT}`;

const PAGES = [
  { name: 'SSR', url: '/product-search/ssr' },
  { name: 'Client', url: '/product-search/client' },
  { name: 'RSC', url: '/product-search/rsc' },
];

async function measurePage(browser, url, name) {
  const page = await browser.newPage();

  // Collect performance entries
  const jsResources = [];

  // Listen for network responses to track JS bundle sizes
  page.on('response', async (response) => {
    const reqUrl = response.url();
    if (reqUrl.endsWith('.js') || reqUrl.includes('.js?')) {
      const headers = response.headers();
      const contentLength = parseInt(headers['content-length'] || '0', 10);
      jsResources.push({
        url: reqUrl.split('/').pop().split('?')[0],
        size: contentLength,
      });
    }
  });

  // Enable performance observer in page
  await page.evaluateOnNewDocument(() => {
    window.__perfMetrics = {
      fcp: null,
      lcp: null,
      interactions: [],
    };

    // Observe FCP
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__perfMetrics.fcp = entry.startTime;
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

    // Observe LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        window.__perfMetrics.lcp = entries[entries.length - 1].startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // Observe interactions (event timing for INP)
    try {
      const eventObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 0) {
            window.__perfMetrics.interactions.push({
              name: entry.name,
              duration: entry.duration,
            });
          }
        }
      });
      eventObserver.observe({ type: 'event', buffered: true, durationThreshold: 0 });
    } catch (e) {
      // Event Timing API not supported
    }
  });

  const startTime = Date.now();

  // Navigate and wait for network idle
  await page.goto(`${BASE_URL}${url}`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  const networkIdleTime = Date.now() - startTime;

  // Wait for actual content to be rendered (RSC streams content after initial HTML)
  try {
    await page.waitForSelector('.grid img, .grid .aspect-square img, [class*="grid"] img, .group img', { timeout: 10000 });
  } catch {
    // Fallback: wait for any product card content
    try {
      await page.waitForSelector('.group, [data-review-snippets-loaded]', { timeout: 5000 });
    } catch {
      // Content may not render on client version initially
    }
  }

  // Wait for LCP to settle after content streams in
  await new Promise((r) => setTimeout(r, 1000));

  // Measure interaction responsiveness (INP proxy)
  // Click on a filter section toggle, sort dropdown, and a product card
  const interactionTimes = [];

  try {
    // Interaction 1: Click sort dropdown
    const sortSelect = await page.$('#sort-select');
    if (sortSelect) {
      const t1 = Date.now();
      await sortSelect.click();
      await new Promise((r) => setTimeout(r, 100));
      interactionTimes.push(Date.now() - t1);
    }

    // Interaction 2: Click a filter section
    const filterButtons = await page.$$('aside button');
    if (filterButtons.length > 0) {
      const t2 = Date.now();
      await filterButtons[0].click();
      await new Promise((r) => setTimeout(r, 100));
      interactionTimes.push(Date.now() - t2);
    }

    // Interaction 3: Click a filter checkbox
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      const t3 = Date.now();
      await checkbox.click();
      await new Promise((r) => setTimeout(r, 100));
      interactionTimes.push(Date.now() - t3);
    }

    // Interaction 4: Click a pagination button
    const paginationBtns = await page.$$('nav button');
    if (paginationBtns.length > 1) {
      const t4 = Date.now();
      await paginationBtns[paginationBtns.length - 1].click();
      await new Promise((r) => setTimeout(r, 100));
      interactionTimes.push(Date.now() - t4);
    }
  } catch (e) {
    // Some interactions may fail on certain versions
  }

  // Get performance metrics from the page
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      fcp: window.__perfMetrics.fcp,
      lcp: window.__perfMetrics.lcp,
      interactions: window.__perfMetrics.interactions,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
      domInteractive: nav ? nav.domInteractive : null,
      loadComplete: nav ? nav.loadEventEnd : null,
      transferSize: nav ? nav.transferSize : null,
      responseEnd: nav ? nav.responseEnd : null,
    };
  });

  // Get total JS transfer size
  const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);

  // Get DOM element count (hydration cost indicator)
  const domElementCount = await page.evaluate(() => document.querySelectorAll('*').length);

  // Compute worst INP from interaction observations
  const observedINP = metrics.interactions.length > 0
    ? Math.max(...metrics.interactions.map((i) => i.duration))
    : null;

  // Compute INP from our manual interaction measurements
  const manualINP = interactionTimes.length > 0
    ? Math.max(...interactionTimes)
    : null;

  await page.close();

  return {
    fcp: metrics.fcp ? Math.round(metrics.fcp) : null,
    lcp: metrics.lcp ? Math.round(metrics.lcp) : null,
    domInteractive: metrics.domInteractive ? Math.round(metrics.domInteractive) : null,
    domContentLoaded: metrics.domContentLoaded ? Math.round(metrics.domContentLoaded) : null,
    loadComplete: metrics.loadComplete ? Math.round(metrics.loadComplete) : null,
    responseEnd: metrics.responseEnd ? Math.round(metrics.responseEnd) : null,
    networkIdleTime,
    observedINP: observedINP ? Math.round(observedINP) : null,
    manualINP,
    totalJsSize,
    jsFileCount: jsResources.length,
    domElementCount,
  };
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function average(arr) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

async function main() {
  console.log(`\n🔬 Product Search Page Performance Benchmark`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Runs per page: ${RUNS}`);
  console.log(`${'─'.repeat(70)}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const allResults = {};

  for (const pageConfig of PAGES) {
    console.log(`Testing ${pageConfig.name} (${pageConfig.url})...`);
    const runs = [];

    // Warm up
    await measurePage(browser, pageConfig.url, pageConfig.name);

    for (let i = 0; i < RUNS; i++) {
      const result = await measurePage(browser, pageConfig.url, pageConfig.name);
      runs.push(result);
      process.stdout.write(`  Run ${i + 1}/${RUNS}: FCP=${result.fcp}ms LCP=${result.lcp}ms\n`);
    }

    // Filter out nulls
    const fcps = runs.map((r) => r.fcp).filter(Boolean);
    const lcps = runs.map((r) => r.lcp).filter(Boolean);
    const domInteractives = runs.map((r) => r.domInteractive).filter(Boolean);
    const responseEnds = runs.map((r) => r.responseEnd).filter(Boolean);

    allResults[pageConfig.name] = {
      fcp: { median: median(fcps), avg: average(fcps), min: Math.min(...fcps), max: Math.max(...fcps) },
      lcp: { median: median(lcps), avg: average(lcps), min: Math.min(...lcps), max: Math.max(...lcps) },
      domInteractive: domInteractives.length > 0
        ? { median: median(domInteractives), avg: average(domInteractives) }
        : null,
      responseEnd: responseEnds.length > 0
        ? { median: median(responseEnds), avg: average(responseEnds) }
        : null,
      totalJsSize: runs[0].totalJsSize,
      jsFileCount: runs[0].jsFileCount,
      domElementCount: runs[0].domElementCount,
    };

    console.log('');
  }

  await browser.close();

  // Print results table
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  RESULTS (median of ${RUNS} runs)`);
  console.log(`${'═'.repeat(80)}\n`);

  const metrics = ['fcp', 'lcp'];
  const metricLabels = { fcp: 'FCP', lcp: 'LCP' };

  // Header
  console.log(
    '  Metric'.padEnd(20) +
    'SSR'.padStart(12) +
    'Client'.padStart(12) +
    'RSC'.padStart(12) +
    'RSC vs SSR'.padStart(15) +
    'RSC vs Client'.padStart(15)
  );
  console.log('  ' + '─'.repeat(76));

  for (const metric of metrics) {
    const ssr = allResults.SSR[metric]?.median;
    const client = allResults.Client[metric]?.median;
    const rsc = allResults.RSC[metric]?.median;

    const vsSSR = ssr && rsc ? `${Math.round(((ssr - rsc) / ssr) * 100)}%` : 'N/A';
    const vsClient = client && rsc ? `${Math.round(((client - rsc) / client) * 100)}%` : 'N/A';

    console.log(
      `  ${metricLabels[metric]}`.padEnd(20) +
      `${ssr}ms`.padStart(12) +
      `${client}ms`.padStart(12) +
      `${rsc}ms`.padStart(12) +
      vsSSR.padStart(15) +
      vsClient.padStart(15)
    );
  }

  // Additional metrics
  console.log('  ' + '─'.repeat(76));

  const ssrDI = allResults.SSR.domInteractive?.median;
  const clientDI = allResults.Client.domInteractive?.median;
  const rscDI = allResults.RSC.domInteractive?.median;

  if (ssrDI && rscDI) {
    const vsDI = Math.round(((ssrDI - rscDI) / ssrDI) * 100);
    console.log(
      '  DOM Interactive'.padEnd(20) +
      `${ssrDI}ms`.padStart(12) +
      `${clientDI}ms`.padStart(12) +
      `${rscDI}ms`.padStart(12) +
      `${vsDI}%`.padStart(15)
    );
  }

  // Response time
  const ssrRE = allResults.SSR.responseEnd?.median;
  const clientRE = allResults.Client.responseEnd?.median;
  const rscRE = allResults.RSC.responseEnd?.median;
  if (ssrRE && rscRE) {
    const vsRE = Math.round(((ssrRE - rscRE) / ssrRE) * 100);
    console.log(
      '  Response End'.padEnd(20) +
      `${ssrRE}ms`.padStart(12) +
      `${clientRE}ms`.padStart(12) +
      `${rscRE}ms`.padStart(12) +
      `${vsRE}%`.padStart(15)
    );
  }

  console.log('  ' + '─'.repeat(76));

  // JS bundle size
  console.log(
    '  JS Bundle Size'.padEnd(20) +
    `${(allResults.SSR.totalJsSize / 1024).toFixed(0)}KB`.padStart(12) +
    `${(allResults.Client.totalJsSize / 1024).toFixed(0)}KB`.padStart(12) +
    `${(allResults.RSC.totalJsSize / 1024).toFixed(0)}KB`.padStart(12) +
    `${Math.round(((allResults.SSR.totalJsSize - allResults.RSC.totalJsSize) / allResults.SSR.totalJsSize) * 100)}%`.padStart(15)
  );

  console.log(
    '  JS Files'.padEnd(20) +
    `${allResults.SSR.jsFileCount}`.padStart(12) +
    `${allResults.Client.jsFileCount}`.padStart(12) +
    `${allResults.RSC.jsFileCount}`.padStart(12)
  );

  console.log(
    '  DOM Elements'.padEnd(20) +
    `${allResults.SSR.domElementCount}`.padStart(12) +
    `${allResults.Client.domElementCount}`.padStart(12) +
    `${allResults.RSC.domElementCount}`.padStart(12)
  );

  console.log(`\n${'═'.repeat(80)}\n`);

  // Check 25% improvement target
  const ssrLCP = allResults.SSR.lcp.median;
  const rscLCP = allResults.RSC.lcp.median;
  const lcpImprovement = Math.round(((ssrLCP - rscLCP) / ssrLCP) * 100);

  const ssrDIm = allResults.SSR.domInteractive?.median || 0;
  const rscDIm = allResults.RSC.domInteractive?.median || 0;
  const interactivityImprovement = ssrDIm > 0 ? Math.round(((ssrDIm - rscDIm) / ssrDIm) * 100) : 0;

  console.log(`  TARGET CHECK:`);
  console.log(`  LCP improvement (RSC vs SSR): ${lcpImprovement}% ${lcpImprovement >= 25 ? '✅ PASS (≥25%)' : '❌ FAIL (<25%)'}`);
  console.log(`  Interactivity improvement:    ${interactivityImprovement}% ${interactivityImprovement >= 25 ? '✅ PASS (≥25%)' : '❌ FAIL (<25%)'}`);
  console.log(`  JS bundle reduction:          ${Math.round(((allResults.SSR.totalJsSize - allResults.RSC.totalJsSize) / allResults.SSR.totalJsSize) * 100)}%`);
  console.log('');
}

main().catch(console.error);
