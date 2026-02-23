#!/usr/bin/env node

/**
 * Dashboard Benchmarking Script
 *
 * Measures FCP, LCP, TTMC (Time to Meaningful Content), TBT, and TTI
 * for each dashboard version (SSR, Client, RSC).
 *
 * TTMC is a custom metric that measures when actual dashboard data appears
 * in the DOM (not just skeleton/loading states). This gives a fair comparison
 * because Client-side rendering shows skeletons immediately (fast FCP) but
 * actual data arrives later after API calls.
 */

const puppeteer = require('puppeteer');

const BASE = process.env.BASE_URL || 'http://localhost:3002';
const RUNS = parseInt(process.env.RUNS || '5', 10);
const WARMUP = parseInt(process.env.WARMUP || '2', 10);

const PAGES = [
  { name: 'SSR', path: '/analytics/ssr' },
  { name: 'Client', path: '/analytics/client' },
  { name: 'RSC', path: '/analytics/rsc' },
];

async function measurePage(browser, url, label) {
  const page = await browser.newPage();

  // Disable cache to simulate first visit
  await page.setCacheEnabled(false);

  // Collect performance entries AND meaningful content timing
  await page.evaluateOnNewDocument(() => {
    window.__perfEntries = [];
    window.__lcpEntries = [];
    window.__ttmcTimestamps = {};

    // Observe paint entries (FCP)
    const paintObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfEntries.push({ name: entry.name, startTime: entry.startTime });
      }
    });
    paintObs.observe({ type: 'paint', buffered: true });

    // Observe LCP
    const lcpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__lcpEntries.push({
          startTime: entry.startTime,
          size: entry.size,
          element: entry.element?.tagName,
        });
      }
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

    // Track when meaningful content appears using MutationObserver
    // "Meaningful" = actual data rendered, not skeletons
    const startTime = performance.now();
    const checks = {
      // KPI cards: look for actual dollar amounts (not skeleton pulse)
      kpi: () => {
        const cards = document.querySelectorAll('.text-2xl, .text-3xl');
        for (const card of cards) {
          if (card.textContent && card.textContent.includes('$')) return true;
        }
        return false;
      },
      // Revenue chart: SVG path with actual data points
      chart: () => {
        const paths = document.querySelectorAll('svg path[d]');
        for (const p of paths) {
          const d = p.getAttribute('d') || '';
          // Real chart paths have many points (long d attribute)
          if (d.length > 50) return true;
        }
        return false;
      },
      // Recent orders table: actual data rows
      table: () => {
        const rows = document.querySelectorAll('table tbody tr, [class*="order"]');
        // Need actual content, not skeleton rows
        for (const row of rows) {
          if (row.textContent && row.textContent.includes('#')) return true;
        }
        return false;
      },
    };

    const observer = new MutationObserver(() => {
      const now = performance.now();
      for (const [name, check] of Object.entries(checks)) {
        if (!window.__ttmcTimestamps[name] && check()) {
          window.__ttmcTimestamps[name] = Math.round(now);
        }
      }
    });

    // Start observing once DOM is ready
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
    }

    // Also check immediately after initial render and periodically
    const checkAll = () => {
      const now = performance.now();
      for (const [name, check] of Object.entries(checks)) {
        if (!window.__ttmcTimestamps[name] && check()) {
          window.__ttmcTimestamps[name] = Math.round(now);
        }
      }
    };

    // Run check on load and periodically for the first 30s
    window.addEventListener('load', checkAll);
    const interval = setInterval(() => {
      checkAll();
      // Stop after all found or 30s
      if (Object.keys(window.__ttmcTimestamps).length >= 3 || performance.now() > 30000) {
        clearInterval(interval);
      }
    }, 50);
  });

  const startTime = Date.now();

  // Navigate and wait for network idle
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

  // Wait for meaningful content to appear (up to 15s)
  try {
    await page.waitForFunction(() => {
      return window.__ttmcTimestamps && Object.keys(window.__ttmcTimestamps).length >= 2;
    }, { timeout: 15000 });
  } catch (e) {
    // Timeout — some content never appeared
  }

  // Wait a bit more for any deferred rendering
  await new Promise(r => setTimeout(r, 500));

  const wallTime = Date.now() - startTime;

  // Collect all metrics
  const result = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = window.__perfEntries || [];
    const lcpEntries = window.__lcpEntries || [];
    const ttmc = window.__ttmcTimestamps || {};

    const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1].startTime
      : 0;
    const lcpElement = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1].element
      : 'N/A';
    const lcpSize = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1].size
      : 0;

    // TTMC: time until meaningful content is visible
    // Use the max of individual content checks (all sections loaded)
    const ttmcValues = Object.values(ttmc);
    const ttmcAll = ttmcValues.length > 0 ? Math.max(...ttmcValues) : 0;
    const ttmcFirst = ttmcValues.length > 0 ? Math.min(...ttmcValues) : 0;

    // Total Blocking Time (approximation using Long Tasks)
    const longTasks = performance.getEntriesByType('longtask') || [];
    const tbt = longTasks.reduce((sum, task) => {
      const blocking = task.duration - 50;
      return sum + (blocking > 0 ? blocking : 0);
    }, 0);

    // DOM content loaded
    const dcl = nav?.domContentLoadedEventEnd || 0;
    const load = nav?.loadEventEnd || 0;
    const ttfb = nav?.responseStart || 0;

    // Count script elements (JS bundle count)
    const scriptCount = document.querySelectorAll('script[src]').length;

    // Total transferred size (estimate from resource timing)
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const jsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    // Also compute decodedBodySize for uncompressed comparison
    const jsDecodedSize = jsResources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0);

    return {
      ttfb: Math.round(ttfb),
      fcp: Math.round(fcp),
      lcp: Math.round(lcp),
      lcpElement,
      lcpSize,
      ttmcFirst: Math.round(ttmcFirst),
      ttmcAll: Math.round(ttmcAll),
      ttmcDetail: ttmc,
      dcl: Math.round(dcl),
      load: Math.round(load),
      tbt: Math.round(tbt),
      scriptCount,
      jsTransferKB: Math.round(jsSize / 1024),
      jsDecodedKB: Math.round(jsDecodedSize / 1024),
    };
  });

  result.wallTime = wallTime;
  await page.close();
  return result;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMs(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

async function main() {
  console.log(`\n📊 Dashboard Performance Benchmark`);
  console.log(`   Base URL: ${BASE}`);
  console.log(`   Runs: ${RUNS} (+ ${WARMUP} warmup)\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = {};

  for (const { name, path } of PAGES) {
    const url = `${BASE}${path}`;
    console.log(`\n--- ${name} (${path}) ---`);

    // Warmup
    for (let i = 0; i < WARMUP; i++) {
      process.stdout.write(`  Warmup ${i + 1}/${WARMUP}...`);
      try {
        await measurePage(browser, url, `${name}-warmup-${i}`);
        console.log(' done');
      } catch (e) {
        console.log(` error: ${e.message}`);
      }
    }

    // Benchmark runs
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`  Run ${i + 1}/${RUNS}...`);
      try {
        const m = await measurePage(browser, url, `${name}-run-${i}`);
        runs.push(m);
        console.log(` FCP=${formatMs(m.fcp)} LCP=${formatMs(m.lcp)} TTMC=${formatMs(m.ttmcAll)} TBT=${formatMs(m.tbt)} JS=${m.jsDecodedKB}KB`);
      } catch (e) {
        console.log(` error: ${e.message}`);
      }
    }

    if (runs.length > 0) {
      results[name] = {
        ttfb: median(runs.map(r => r.ttfb)),
        fcp: median(runs.map(r => r.fcp)),
        lcp: median(runs.map(r => r.lcp)),
        ttmcFirst: median(runs.map(r => r.ttmcFirst)),
        ttmcAll: median(runs.map(r => r.ttmcAll)),
        dcl: median(runs.map(r => r.dcl)),
        load: median(runs.map(r => r.load)),
        tbt: median(runs.map(r => r.tbt)),
        jsTransferKB: median(runs.map(r => r.jsTransferKB)),
        jsDecodedKB: median(runs.map(r => r.jsDecodedKB)),
        scriptCount: runs[0].scriptCount,
        lcpElement: runs[0].lcpElement,
        wallTime: median(runs.map(r => r.wallTime)),
        runs: runs.length,
      };
    }
  }

  await browser.close();

  // Print summary table
  console.log('\n\n═══════════════════════════════════════════════════════════════════');
  console.log('                         RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const metrics = ['ttfb', 'fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tbt', 'dcl', 'load', 'jsDecodedKB', 'scriptCount'];
  const labels = {
    ttfb: 'TTFB',
    fcp: 'FCP',
    lcp: 'LCP',
    ttmcFirst: 'TTMC (1st)',
    ttmcAll: 'TTMC (All)',
    tbt: 'TBT',
    dcl: 'DCL',
    load: 'Load',
    jsDecodedKB: 'JS Size',
    scriptCount: 'Scripts',
  };

  // Header
  const colWidth = 14;
  console.log('Metric'.padEnd(14) + Object.keys(results).map(n => n.padStart(colWidth)).join(''));
  console.log('-'.repeat(14 + Object.keys(results).length * colWidth));

  for (const metric of metrics) {
    let row;
    if (metric === 'jsDecodedKB') {
      row = Object.values(results).map(r => `${r[metric]}KB`.padStart(colWidth));
    } else if (metric === 'scriptCount') {
      row = Object.values(results).map(r => `${r[metric]}`.padStart(colWidth));
    } else {
      row = Object.values(results).map(r => formatMs(r[metric]).padStart(colWidth));
    }
    console.log(labels[metric].padEnd(14) + row.join(''));
  }

  console.log('\n  TTMC = Time to Meaningful Content (when actual data appears, not skeletons)');
  console.log('  TTMC (1st) = first data section visible | TTMC (All) = all sections visible');

  // Improvement calculations
  if (results['SSR'] && results['RSC']) {
    console.log('\n--- RSC vs SSR Improvement ---');
    for (const metric of ['fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tbt']) {
      const ssr = results['SSR'][metric];
      const rsc = results['RSC'][metric];
      if (ssr > 0) {
        const improvement = ((ssr - rsc) / ssr * 100).toFixed(1);
        console.log(`  ${labels[metric]}: ${formatMs(ssr)} -> ${formatMs(rsc)} (${improvement}% ${rsc < ssr ? 'faster' : 'slower'})`);
      }
    }
    console.log(`  JS Size: ${results['SSR'].jsDecodedKB}KB -> ${results['RSC'].jsDecodedKB}KB`);
    console.log(`  Scripts: ${results['SSR'].scriptCount} -> ${results['RSC'].scriptCount}`);
  }

  if (results['Client'] && results['RSC']) {
    console.log('\n--- RSC vs Client Improvement ---');
    for (const metric of ['fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tbt']) {
      const client = results['Client'][metric];
      const rsc = results['RSC'][metric];
      if (client > 0) {
        const improvement = ((client - rsc) / client * 100).toFixed(1);
        console.log(`  ${labels[metric]}: ${formatMs(client)} -> ${formatMs(rsc)} (${improvement}% ${rsc < client ? 'faster' : 'slower'})`);
      }
    }
    console.log(`  JS Size: ${results['Client'].jsDecodedKB}KB -> ${results['RSC'].jsDecodedKB}KB`);
    console.log(`  Scripts: ${results['Client'].scriptCount} -> ${results['RSC'].scriptCount}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
