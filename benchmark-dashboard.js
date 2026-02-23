#!/usr/bin/env node

/**
 * Dashboard Benchmarking Script
 *
 * Measures FCP, LCP, TTMC, TTI (hydration), TBT, and simulated INP
 * for each dashboard version (SSR, Client, RSC).
 *
 * Key metrics:
 * - TTMC: Time to Meaningful Content (when actual data appears, not skeletons)
 * - TTI:  Time to Interactive (when interactive components are hydrated and respond to clicks)
 * - INP:  Interaction to Next Paint (measured by simulating clicks on sort/filter buttons)
 * - TBT:  Total Blocking Time (sum of long task durations > 50ms)
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

  // Collect performance entries, TTMC, and INP
  await page.evaluateOnNewDocument(() => {
    window.__perfEntries = [];
    window.__lcpEntries = [];
    window.__ttmcTimestamps = {};
    window.__inpEntries = [];
    window.__longTasks = [];
    window.__ttiTimestamp = 0; // When first data-hydrated="true" appears

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

    // Observe long tasks for TBT
    try {
      const ltObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__longTasks.push({ duration: entry.duration, startTime: entry.startTime });
        }
      });
      ltObs.observe({ type: 'longtask', buffered: true });
    } catch (e) {}

    // Observe event timing for INP measurement
    try {
      const inpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 0) {
            window.__inpEntries.push({
              duration: entry.duration,
              processingStart: entry.processingStart,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });
      inpObs.observe({ type: 'event', buffered: true, durationThreshold: 0 });
    } catch (e) {}

    // Track meaningful content appearance
    const checks = {
      kpi: () => {
        const cards = document.querySelectorAll('.text-2xl, .text-3xl');
        for (const card of cards) {
          if (card.textContent && card.textContent.includes('$')) return true;
        }
        return false;
      },
      chart: () => {
        const paths = document.querySelectorAll('svg path[d]');
        for (const p of paths) {
          if ((p.getAttribute('d') || '').length > 50) return true;
        }
        return false;
      },
      table: () => {
        const rows = document.querySelectorAll('table tbody tr');
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

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
    }

    const checkAll = () => {
      const now = performance.now();
      for (const [name, check] of Object.entries(checks)) {
        if (!window.__ttmcTimestamps[name] && check()) {
          window.__ttmcTimestamps[name] = Math.round(now);
        }
      }
    };
    window.addEventListener('load', checkAll);
    const interval = setInterval(() => {
      checkAll();
      // Also check for hydration (TTI)
      if (!window.__ttiTimestamp) {
        const hydrated = document.querySelector('[data-hydrated="true"]');
        if (hydrated) window.__ttiTimestamp = Math.round(performance.now());
      }
      if (Object.keys(window.__ttmcTimestamps).length >= 3 || performance.now() > 30000) {
        clearInterval(interval);
      }
    }, 50);

    // Track TTI via MutationObserver — watches for data-hydrated attribute being set
    const ttiObs = new MutationObserver((mutations) => {
      if (window.__ttiTimestamp) return;
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-hydrated') {
          const val = mutation.target.getAttribute('data-hydrated');
          if (val === 'true') {
            window.__ttiTimestamp = Math.round(performance.now());
            ttiObs.disconnect();
            return;
          }
        }
        // Also check subtree for new nodes with data-hydrated
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.querySelector) {
              const h = node.querySelector('[data-hydrated="true"]') || (node.getAttribute && node.getAttribute('data-hydrated') === 'true' ? node : null);
              if (h) {
                window.__ttiTimestamp = Math.round(performance.now());
                ttiObs.disconnect();
                return;
              }
            }
          }
        }
      }
    });
    const startTtiObserver = () => {
      ttiObs.observe(document.body || document.documentElement, {
        attributes: true,
        attributeFilter: ['data-hydrated'],
        childList: true,
        subtree: true,
      });
    };
    if (document.body) startTtiObserver();
    else document.addEventListener('DOMContentLoaded', startTtiObserver);
  });

  const startTime = Date.now();

  // Navigate and wait for network idle
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

  // Wait for meaningful content (up to 15s)
  try {
    await page.waitForFunction(() => {
      return window.__ttmcTimestamps && Object.keys(window.__ttmcTimestamps).length >= 2;
    }, { timeout: 15000 });
  } catch (e) {}

  // Wait for hydration to complete
  await new Promise(r => setTimeout(r, 500));

  // TTI is captured by the MutationObserver in evaluateOnNewDocument
  // No additional measurement needed here

  // === Simulated INP ===
  // Click interactive elements and measure response time
  const inpResults = [];

  // Try clicking a sort header
  try {
    await page.click('[data-sort-header]');
    await new Promise(r => setTimeout(r, 100));
    inpResults.push('sort');
  } catch (e) {}

  // Try clicking a filter button
  try {
    await page.click('[data-filter-btn="time"]');
    await new Promise(r => setTimeout(r, 100));
    inpResults.push('filter');
  } catch (e) {}

  // Try clicking a category button
  try {
    await page.click('[data-category-btn]');
    await new Promise(r => setTimeout(r, 100));
    inpResults.push('category');
  } catch (e) {}

  // Wait for INP entries to be recorded
  await new Promise(r => setTimeout(r, 300));

  const wallTime = Date.now() - startTime;

  // Collect all metrics
  const result = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = window.__perfEntries || [];
    const lcpEntries = window.__lcpEntries || [];
    const ttmc = window.__ttmcTimestamps || {};
    const inpEntries = window.__inpEntries || [];
    const longTasks = window.__longTasks || [];

    const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1].startTime
      : 0;
    const lcpElement = lcpEntries.length > 0
      ? lcpEntries[lcpEntries.length - 1].element
      : 'N/A';

    // TTMC
    const ttmcValues = Object.values(ttmc);
    const ttmcAll = ttmcValues.length > 0 ? Math.max(...ttmcValues) : 0;
    const ttmcFirst = ttmcValues.length > 0 ? Math.min(...ttmcValues) : 0;

    // TBT: sum of (duration - 50ms) for all long tasks
    const tbt = longTasks.reduce((sum, task) => {
      const blocking = task.duration - 50;
      return sum + (blocking > 0 ? blocking : 0);
    }, 0);

    // INP: worst interaction duration from event timing
    const inpDurations = inpEntries
      .filter(e => e.name === 'pointerup' || e.name === 'click' || e.name === 'keyup')
      .map(e => e.duration);
    const worstInp = inpDurations.length > 0 ? Math.max(...inpDurations) : 0;
    const avgInp = inpDurations.length > 0
      ? Math.round(inpDurations.reduce((s, d) => s + d, 0) / inpDurations.length)
      : 0;

    // TTI: time when first interactive element became hydrated (data-hydrated="true")
    // Captured by MutationObserver during page load
    const hydratedEl = document.querySelector('[data-hydrated="true"]');
    let estimatedTTI = window.__ttiTimestamp || 0;

    const dcl = nav?.domContentLoadedEventEnd || 0;
    const load = nav?.loadEventEnd || 0;
    const ttfb = nav?.responseStart || 0;

    const scriptCount = document.querySelectorAll('script[src]').length;
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const jsDecodedSize = jsResources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0);

    return {
      ttfb: Math.round(ttfb),
      fcp: Math.round(fcp),
      lcp: Math.round(lcp),
      lcpElement,
      ttmcFirst: Math.round(ttmcFirst),
      ttmcAll: Math.round(ttmcAll),
      tti: estimatedTTI,
      tbt: Math.round(tbt),
      worstInp: Math.round(worstInp),
      avgInp,
      inpCount: inpDurations.length,
      dcl: Math.round(dcl),
      load: Math.round(load),
      scriptCount,
      jsDecodedKB: Math.round(jsDecodedSize / 1024),
      isHydrated: !!hydratedEl,
    };
  });

  result.wallTime = wallTime;
  result.interactionsClicked = inpResults.length;
  await page.close();
  return result;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMs(ms) {
  if (ms === 0) return '—';
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

    for (let i = 0; i < WARMUP; i++) {
      process.stdout.write(`  Warmup ${i + 1}/${WARMUP}...`);
      try {
        await measurePage(browser, url, `${name}-warmup-${i}`);
        console.log(' done');
      } catch (e) {
        console.log(` error: ${e.message}`);
      }
    }

    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`  Run ${i + 1}/${RUNS}...`);
      try {
        const m = await measurePage(browser, url, `${name}-run-${i}`);
        runs.push(m);
        console.log(` FCP=${formatMs(m.fcp)} TTMC=${formatMs(m.ttmcAll)} TTI=${formatMs(m.tti)} TBT=${formatMs(m.tbt)} INP=${formatMs(m.worstInp)} JS=${m.jsDecodedKB}KB`);
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
        tti: median(runs.map(r => r.tti)),
        tbt: median(runs.map(r => r.tbt)),
        worstInp: median(runs.map(r => r.worstInp)),
        avgInp: median(runs.map(r => r.avgInp)),
        dcl: median(runs.map(r => r.dcl)),
        load: median(runs.map(r => r.load)),
        jsDecodedKB: median(runs.map(r => r.jsDecodedKB)),
        scriptCount: runs[0].scriptCount,
        lcpElement: runs[0].lcpElement,
        wallTime: median(runs.map(r => r.wallTime)),
        isHydrated: runs.every(r => r.isHydrated),
        runs: runs.length,
      };
    }
  }

  await browser.close();

  // Print summary table
  console.log('\n\n═════════════════════════════════════════════════════════════════════════');
  console.log('                            RESULTS SUMMARY');
  console.log('═════════════════════════════════════════════════════════════════════════\n');

  const metrics = ['ttfb', 'fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tti', 'tbt', 'worstInp', 'avgInp', 'jsDecodedKB', 'scriptCount'];
  const labels = {
    ttfb: 'TTFB',
    fcp: 'FCP',
    lcp: 'LCP',
    ttmcFirst: 'TTMC (1st)',
    ttmcAll: 'TTMC (All)',
    tti: 'TTI',
    tbt: 'TBT',
    worstInp: 'INP (worst)',
    avgInp: 'INP (avg)',
    jsDecodedKB: 'JS Size',
    scriptCount: 'Scripts',
  };

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

  console.log('\n  TTMC = Time to Meaningful Content | TTI = Time to Interactive (hydration complete)');
  console.log('  INP = Interaction to Next Paint (simulated clicks on sort/filter/category buttons)');
  console.log('  TBT = Total Blocking Time (long tasks > 50ms)');

  // Improvement calculations
  if (results['SSR'] && results['RSC']) {
    console.log('\n--- RSC vs SSR Improvement ---');
    for (const metric of ['fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tti', 'tbt', 'worstInp']) {
      const ssr = results['SSR'][metric];
      const rsc = results['RSC'][metric];
      if (ssr > 0) {
        const improvement = ((ssr - rsc) / ssr * 100).toFixed(1);
        console.log(`  ${labels[metric]}: ${formatMs(ssr)} -> ${formatMs(rsc)} (${improvement}% ${rsc < ssr ? 'faster' : 'slower'})`);
      }
    }
    console.log(`  JS Size: ${results['SSR'].jsDecodedKB}KB -> ${results['RSC'].jsDecodedKB}KB`);
  }

  if (results['Client'] && results['RSC']) {
    console.log('\n--- RSC vs Client Improvement ---');
    for (const metric of ['fcp', 'lcp', 'ttmcFirst', 'ttmcAll', 'tti', 'tbt', 'worstInp']) {
      const client = results['Client'][metric];
      const rsc = results['RSC'][metric];
      if (client > 0) {
        const improvement = ((client - rsc) / client * 100).toFixed(1);
        console.log(`  ${labels[metric]}: ${formatMs(client)} -> ${formatMs(rsc)} (${improvement}% ${rsc < client ? 'faster' : 'slower'})`);
      }
    }
    console.log(`  JS Size: ${results['Client'].jsDecodedKB}KB -> ${results['RSC'].jsDecodedKB}KB`);
  }

  console.log('\n═════════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
