export const DEFAULTS = {
  iterations: 7,
  warmup: 2,
  timeout: 30_000,
  baseUrl: 'http://localhost:3000',
};

export const PAGES = {
  ssr: { path: '/blog/ssr', label: 'SSR (V1)', hasStreaming: false },
  client: { path: '/blog/client', label: 'Client (V2)', hasStreaming: false },
  rsc: { path: '/blog/rsc', label: 'RSC (V3)', hasStreaming: true },
};

export const SELECTORS = {
  likeButton: 'section button',
  relatedPostsHeading: 'h2',
  relatedPostsText: 'Related Posts',
};

export const THROTTLE = {
  cpu: 4,
  network: {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 150,
  },
};
