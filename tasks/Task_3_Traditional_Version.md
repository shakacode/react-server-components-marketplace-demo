# Task 3: Traditional Version

**Time**: 10-14 hours
**Dependencies**: Task 2 (Components & API complete)
**Can Run Parallel With**: Task 4 (RSC Version)

---

## Overview

Build the traditional SSR + lazy-loading version. This demonstrates the current best practice: SSR static parts, lazy-load dynamic parts, client-side data fetching.

**Key Pattern**:
1. Server renders static content (restaurant name, image)
2. Browser downloads JS bundles (code-split lazy chunks)
3. React hydrates
4. Lazy components mount
5. useEffect sends API requests
6. Spinners replaced with content

**Expected Performance**: LCP ~500-600ms, CLS ~0.10-0.15

---

## Deliverables

### 1. Webpack Configuration

Create `config/webpack/webpack.config.js`:

```javascript
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    search: './app/javascript/entries/search.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../../app/assets/webpack/traditional'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
    clean: true,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@components': path.resolve(__dirname, '../../app/javascript/components'),
      '@utils': path.resolve(__dirname, '../../app/javascript/utils'),
      '@types': path.resolve(__dirname, '../../app/javascript/types'),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isProduction ? '[name].[contenthash].css' : '[name].css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  optimization: {
    minimize: isProduction,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

**Key Points**:
- Entry point: `app/javascript/entries/search.tsx`
- Output to: `app/assets/webpack/traditional/`
- Code-splitting enabled (automatic for `lazy()` components)
- CSS extraction with MiniCssExtractPlugin
- Source maps for debugging

---

### 2. Entry Point

Create `app/javascript/entries/search.tsx`:

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RestaurantSearch } from '../components/search/RestaurantSearch';

// Mount React component
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<RestaurantSearch />);
}
```

---

### 3. Lazy-Loaded Async Components

**Key Pattern**: Each dynamic part has a wrapper (with Suspense) and a lazy component (in separate chunk).

Create in `app/javascript/components/async/traditional/`:

#### AsyncStatus.tsx (Wrapper with Suspense)
```typescript
import { lazy, Suspense } from 'react';
import { Spinner } from '@components/ui/Spinner';

const AsyncStatusLazy = lazy(() => import('./AsyncStatus.lazy'));

interface Props {
  restaurantId: number;
}

export function AsyncStatus({ restaurantId }: Props) {
  return (
    <Suspense fallback={<Spinner label="Checking status..." />}>
      <AsyncStatusLazy restaurantId={restaurantId} />
    </Suspense>
  );
}
```

#### AsyncStatus.lazy.tsx (Lazy Component - Separate Chunk)
```typescript
import { useEffect, useState } from 'react';
import { StatusBadge } from '@components/restaurant/StatusBadge';
import type { StatusData } from '@types';

interface Props {
  restaurantId: number;
}

interface StatusResponse {
  status: StatusData;
  timestamp: string;
}

function AsyncStatusComponent({ restaurantId }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/restaurants/${restaurantId}/status`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: StatusResponse = await response.json();
        setStatus(data.status);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    return () => controller.abort();
  }, [restaurantId]);

  if (error) {
    return <div className="text-sm text-red-600">Error: {error}</div>;
  }

  if (!status) return null;

  return <StatusBadge status={status} />;
}

export default AsyncStatusComponent;
```

**Create 5 async component pairs** (wrapper + lazy):
1. `AsyncStatus` / `AsyncStatus.lazy` - Check if open
2. `AsyncWaitTime` / `AsyncWaitTime.lazy` - Current wait time
3. `AsyncSpecials` / `AsyncSpecials.lazy` - Active promotions
4. `AsyncTrending` / `AsyncTrending.lazy` - Popular items
5. `AsyncRating` / `AsyncRating.lazy` - Average rating

All follow same pattern: useState + useEffect + fetch().

---

### 4. Container Component

Create `app/javascript/components/search/RestaurantSearch.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { SearchHeader } from './SearchHeader';
import { RestaurantGrid } from './RestaurantGrid';
import { RestaurantCard } from './RestaurantCard';
import type { Restaurant } from '@types';

export function RestaurantSearch() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // For initial load, we'd fetch from /restaurants endpoint
        // For demo, we're SSRing this data directly in view
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <SearchHeader />
      {/* Restaurants passed from SSR, dynamic data lazy-loaded per card */}
    </div>
  );
}
```

Create `app/javascript/components/search/RestaurantCard.tsx`:

```typescript
import { RestaurantCardHeader } from '@components/restaurant/RestaurantCardHeader';
import { RestaurantCardFooter } from '@components/restaurant/RestaurantCardFooter';
import { AsyncStatus } from '@components/async/traditional/AsyncStatus';
import { AsyncWaitTime } from '@components/async/traditional/AsyncWaitTime';
import { AsyncSpecials } from '@components/async/traditional/AsyncSpecials';
import { AsyncTrending } from '@components/async/traditional/AsyncTrending';
import { AsyncRating } from '@components/async/traditional/AsyncRating';
import type { Restaurant } from '@types';

interface Props {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        {/* Static content (SSRed) */}
        <RestaurantCardHeader restaurant={restaurant} />

        {/* Dynamic content (lazy-loaded) */}
        <div className="space-y-3 my-4">
          <AsyncStatus restaurantId={restaurant.id} />
          <AsyncWaitTime restaurantId={restaurant.id} />
          <AsyncSpecials restaurantId={restaurant.id} />
          <AsyncTrending restaurantId={restaurant.id} />
          <AsyncRating restaurantId={restaurant.id} />
        </div>

        {/* Static footer */}
        <RestaurantCardFooter restaurant={restaurant} />
      </div>
    </div>
  );
}
```

---

### 5. View Template

Create `app/views/restaurants/search.html.erb`:

```erb
<div id="root" data-controller="search">
  <div class="p-8 max-w-7xl mx-auto">
    <h1 class="text-4xl font-bold mb-2">Find Restaurants</h1>
    <p class="text-gray-600">Discover local restaurants and real-time wait times</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <% @restaurants.each do |restaurant| %>
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <!-- Static content (SSRed) -->
            <%= react_component('RestaurantCardHeader', {
              restaurant: restaurant.as_json
            }, prerender: :sync) %>

            <!-- Dynamic content (lazy-loaded on client) -->
            <div class="space-y-3 my-4">
              <%= react_component('AsyncStatus', {
                restaurantId: restaurant.id
              }) %>
              <%= react_component('AsyncWaitTime', {
                restaurantId: restaurant.id
              }) %>
              <%= react_component('AsyncSpecials', {
                restaurantId: restaurant.id
              }) %>
              <%= react_component('AsyncTrending', {
                restaurantId: restaurant.id
              }) %>
              <%= react_component('AsyncRating', {
                restaurantId: restaurant.id
              }) %>
            </div>

            <!-- Static footer -->
            <%= react_component('RestaurantCardFooter', {
              restaurant: restaurant.as_json
            }, prerender: :sync) %>
          </div>
        </div>
      <% end %>
    </div>
  </div>
</div>
```

---

### 6. Controller Action

Create/Update `app/controllers/restaurants_controller.rb`:

```ruby
class RestaurantsController < ApplicationController
  def search
    # Load restaurants for server rendering
    @restaurants = Restaurant.order(average_rating: :desc).limit(20)

    # SSR the page with static content
    # Dynamic content will lazy-load on client
  end

  def search_rsc
    # RSC version - same data
    @restaurants = Restaurant.order(average_rating: :desc).limit(20)
  end
end
```

---

### 7. Performance Monitoring

Create `app/javascript/utils/performance/traditional-vitals.ts`:

```typescript
export function initializePerformanceMonitoring() {
  // Collect Web Vitals
  let lcp = 0;
  let cls = 0;
  let inp = 0;

  // LCP - Largest Contentful Paint
  const paintObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    lcp = lastEntry.startTime;
  });
  paintObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // CLS - Cumulative Layout Shift
  const layoutShiftObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    }
  });
  layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

  // INP - Interaction to Next Paint
  const interactionObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      inp = Math.max(inp, (entry as any).duration);
    }
  });
  interactionObserver.observe({ entryTypes: ['interaction'] });

  // Send metrics when page unloads
  window.addEventListener('beforeunload', () => {
    sendMetrics({
      version: 'traditional',
      lcp,
      cls,
      inp,
      timestamp: new Date().toISOString(),
    });
  });
}

async function sendMetrics(metrics: any) {
  try {
    await fetch('/api/performance_metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    });
  } catch (err) {
    console.error('Failed to send metrics:', err);
  }
}
```

Include in entry point:
```typescript
import { initializePerformanceMonitoring } from '../utils/performance/traditional-vitals';

// In entries/search.tsx
if (typeof window !== 'undefined') {
  initializePerformanceMonitoring();
}
```

---

## File Structure

```
app/javascript/
├─ entries/
│  └─ search.tsx
├─ components/
│  ├─ restaurant/          (Task 2 - shared)
│  ├─ search/
│  │  ├─ SearchHeader.tsx
│  │  ├─ RestaurantGrid.tsx
│  │  ├─ RestaurantSearch.tsx
│  │  └─ RestaurantCard.tsx
│  ├─ async/
│  │  └─ traditional/      (THIS TASK)
│  │     ├─ AsyncStatus.tsx
│  │     ├─ AsyncStatus.lazy.tsx
│  │     ├─ AsyncWaitTime.tsx
│  │     ├─ AsyncWaitTime.lazy.tsx
│  │     ├─ AsyncSpecials.tsx
│  │     ├─ AsyncSpecials.lazy.tsx
│  │     ├─ AsyncTrending.tsx
│  │     ├─ AsyncTrending.lazy.tsx
│  │     ├─ AsyncRating.tsx
│  │     └─ AsyncRating.lazy.tsx
│  └─ ui/
│     └─ Spinner.tsx
└─ utils/
   └─ performance/
      └─ traditional-vitals.ts

config/webpack/
├─ webpack.config.js
├─ webpack.development.js
└─ webpack.production.js

app/views/restaurants/
├─ search.html.erb          (THIS TASK)
└─ search_rsc.html.erb      (Task 4)

app/controllers/
└─ restaurants_controller.rb (THIS TASK)
```

---

## Success Criteria

### Must Have ✅

- [ ] Webpack config builds without errors
- [ ] `npm run build` creates separate chunks for lazy components
- [ ] `/search` route works and displays restaurants
- [ ] Static content SSRs immediately
- [ ] Spinners display while lazy components load
- [ ] Lazy components load separately (verify in DevTools Network)
- [ ] All 5 async components render correctly with data
- [ ] No hydration mismatches

### Performance ⚡

- [ ] LCP: ~500-600ms (Static content visible after ~50ms, dynamic content after ~400-500ms)
- [ ] CLS: ~0.10-0.15 (Spinners replaced by content)
- [ ] INP: ~80-100ms (Fetch + render latency)
- [ ] Static JS bundle: ~35-40 KB (main chunk)
- [ ] Lazy chunks: ~5-10 KB each
- [ ] API requests visible in Network tab
- [ ] All 5 requests in parallel (not waterfall)

### Code Quality

- [ ] TypeScript compilation succeeds
- [ ] No console errors or warnings
- [ ] Components responsive (mobile, tablet, desktop)
- [ ] Accessibility score >90

---

## Key Implementation Notes

### lazy() vs Regular Import

```typescript
// ❌ WRONG - No code-splitting
import AsyncStatus from './AsyncStatus.lazy';

// ✅ CORRECT - Creates separate chunk
const AsyncStatusLazy = lazy(() => import('./AsyncStatus.lazy'));
```

### Suspense Boundary Pattern

```typescript
// ✅ CORRECT - Spinner shows while lazy component loads
<Suspense fallback={<Spinner />}>
  <AsyncStatusLazy restaurantId={restaurantId} />
</Suspense>
```

### Abort Controller Cleanup

```typescript
// ✅ CORRECT - Cleanup prevents memory leaks
useEffect(() => {
  const controller = new AbortController();
  fetch(..., { signal: controller.signal });
  return () => controller.abort();
}, [restaurantId]);
```

---

## Timeline (Expected)

This shows when each piece loads for user:

1. **0-50ms**: Browser receives HTML with SSRed static content
2. **50-100ms**: Static content renders, user sees restaurants
3. **100-150ms**: JavaScript bundles download and parse
4. **150-200ms**: React hydrates, lazy components mount
5. **200-350ms**: Lazy components send API requests (5 in parallel)
6. **350-500ms**: Database queries run (~100-150ms for wait_time)
7. **500-600ms**: Spinners replaced with content
8. **Total LCP**: ~500-600ms

---

## Testing

```typescript
// Test lazy component works
describe('AsyncStatus lazy component', () => {
  it('fetches and displays status', async () => {
    const { getByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncStatusLazy restaurantId={1} />
      </Suspense>
    );

    expect(getByText('Loading...')).toBeInTheDocument();
    expect(await getByText(/open|closed/i)).toBeInTheDocument();
  });
});

// Test performance
describe('Traditional version performance', () => {
  it('has LCP around 500-600ms', async () => {
    const start = performance.now();
    await render(<RestaurantSearch />);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThan(500);
    expect(elapsed).toBeLessThan(700);
  });
});
```

---

## Handoff Criteria

Complete when:

- [ ] `/search` loads restaurants with dynamic content
- [ ] Lazy components load separately (visible in Network tab)
- [ ] LCP ~500-600ms, CLS ~0.10-0.15
- [ ] All spinners display and replace correctly
- [ ] TypeScript types everywhere
- [ ] No console errors

**Next**: Task 4 (RSC Version) - Can run in parallel with this task

---

## Troubleshooting

**Q: Lazy components not code-splitting**
A: Verify `lazy(() => import(...))` syntax. Check webpack.config.js splitChunks config.

**Q: Hydration mismatch**
A: Ensure server-rendered HTML matches client React tree. Check SSR prerender flags.

**Q: Spinners stay forever**
A: Check Network tab - are API requests being sent? Check for fetch errors in console.

**Q: LCP >700ms**
A: Too slow. Check if main bundle is too large. Verify code-splitting working.

---

## Resources

- Code-splitting: https://webpack.js.org/guides/code-splitting/
- React Suspense: https://react.dev/reference/react/Suspense
- Web Vitals: https://web.dev/vitals/
- Server-Side Rendering: https://guides.rubyonrails.org/asset_pipeline.html
