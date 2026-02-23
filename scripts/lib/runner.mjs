import { SELECTORS, DEFAULTS, THROTTLE } from './constants.mjs';
import { getCollectorScript } from './collectors.mjs';

/**
 * Measure a single page load.
 * @param {import('puppeteer').Browser} browser
 * @param {{ path: string, label: string, hasStreaming: boolean }} pageConfig
 * @param {{ baseUrl: string, timeout: number, throttle: boolean, verbose: boolean }} options
 * @returns {Promise<object>} Raw metrics for one run
 */
export async function measurePage(browser, pageConfig, options) {
  const { baseUrl, timeout, throttle, verbose } = options;
  const url = `${baseUrl}${pageConfig.path}`;

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const cdp = await page.createCDPSession();

  // Disable cache so each run is a cold load
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.enable');

  // Apply throttling if requested
  if (throttle) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE.cpu });
    await cdp.send('Network.emulateNetworkConditions', THROTTLE.network);
  }

  // Track JS resources via CDP
  const jsResources = new Map();

  cdp.on('Network.responseReceived', (params) => {
    const { response, requestId } = params;
    if (
      response.mimeType &&
      (response.mimeType.includes('javascript') || response.mimeType.includes('ecmascript'))
    ) {
      jsResources.set(requestId, {
        url: response.url,
        transferSize: response.encodedDataLength || 0,
        decodedBodySize: 0,
      });
    }
  });

  cdp.on('Network.loadingFinished', (params) => {
    const { requestId, encodedDataLength } = params;
    if (jsResources.has(requestId)) {
      const entry = jsResources.get(requestId);
      entry.transferSize = encodedDataLength || entry.transferSize;
    }
  });

  cdp.on('Network.dataReceived', (params) => {
    const { requestId, dataLength } = params;
    if (jsResources.has(requestId)) {
      jsResources.get(requestId).decodedBodySize += dataLength;
    }
  });

  // Inject performance collectors before navigation
  await page.evaluateOnNewDocument(getCollectorScript(pageConfig.selectors));

  if (verbose) {
    console.log(`  Navigating to ${url}`);
  }

  // Navigate — use 'networkidle2' to handle RSC streaming pages
  // that keep connections open during chunked transfer
  await page.goto(url, { waitUntil: 'networkidle2', timeout });

  // Wait for hydration to complete (poll with timeout)
  await page.waitForFunction(
    () => window.__vitals && window.__vitals.hydrationDuration !== null,
    { timeout },
  ).catch(() => {
    if (verbose) console.log('  Hydration detection timed out');
  });

  // For RSC pages, wait for streaming content to resolve
  if (pageConfig.hasStreaming) {
    await page.waitForFunction(
      () => window.__vitals && window.__vitals.streamingDuration !== null,
      { timeout: 10_000 },
    ).catch(() => {
      if (verbose) console.log('  Streaming detection timed out');
    });
  }

  // Small pause to let event observers settle
  await sleep(200);

  // Click button for INP measurement
  const btnSelector = pageConfig.selectors?.likeButton || SELECTORS.likeButton;
  const likeBtn = await page.$(btnSelector);
  if (likeBtn) {
    await likeBtn.click();
    await sleep(300); // let event timing observer capture
  } else if (verbose) {
    console.log('  Like button not found');
  }

  // Harvest metrics from the page
  const vitals = await page.evaluate(() => {
    const v = window.__vitals;
    return {
      fcp: v.fcp,
      lcp: v.lcp,
      cls: v.cls,
      ttfb: v.ttfb,
      tbt: v.tbt,
      inp: v.inp,
      hydrationDuration: v.hydrationDuration,
      streamingDuration: v.streamingDuration,
    };
  });

  // Compute JS sizes from CDP data
  const resources = Array.from(jsResources.values());
  const jsTransferSize = resources.reduce((sum, r) => sum + r.transferSize, 0);
  const jsDecodedSize = resources.reduce((sum, r) => sum + r.decodedBodySize, 0);

  await context.close();

  return {
    ...vitals,
    jsTransferSize,
    jsDecodedSize,
    jsResources: resources.map((r) => ({
      url: r.url,
      transferSize: r.transferSize,
      decodedBodySize: r.decodedBodySize,
    })),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
