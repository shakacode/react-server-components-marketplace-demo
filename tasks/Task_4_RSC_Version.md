# Task 4: RSC Version (React Server Components)

**Time**: 10-14 hours
**Dependencies**: Task 2 (Components & API complete)
**Can Run Parallel With**: Task 3 (Traditional Version)

---

## Overview

Build the RSC + streaming version. Server Components fetch all data server-side before rendering, then stream complete HTML to browser. No client-side fetch waterfall, no spinners replaced (resolved on server).

**Key Pattern**:
1. Server receives request
2. Server fetches all data in parallel (~150-200ms)
3. Server renders async Server Components with data
4. Server streams HTML chunks to browser
5. Browser receives complete page with data
6. No spinners, no client-side fetch

**Expected Performance**: LCP ~200-250ms, CLS ~0.02 (59% faster, 83% better CLS)

---

## Deliverables

### 1. RSC Webpack Configuration

Create `config/webpack/webpack.rsc.js`:

```javascript
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactServerPlugin = require('@react-server/webpack-plugin');
const RscWebpackPlugin = require('@react-server-tools/webpack').default;

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    'search-rsc': './app/javascript/entries/search_rsc.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../../app/assets/webpack/rsc'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
    clean: true,
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
          // RSC loader transforms server components
          {
            loader: '@react-server/webpack-loader',
            options: {
              isServerComponent: (file) => {
                return !file.includes('.lazy.tsx') && file.includes('/rsc/');
              },
            },
          },
        ],
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
    // RSC webpack plugin generates three bundles:
    // 1. RSC payload (server only)
    // 2. Server bundle (for SSR)
    // 3. Client bundles (hydration)
    new RscWebpackPlugin({
      isServer: false,
    }),
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
      },
    },
  },
};
```

**Key Points**:
- Entry point: `app/javascript/entries/search_rsc.tsx`
- Output to: `app/assets/webpack/rsc/`
- RSC loader marks which components are server components
- RSC webpack plugin generates three bundles automatically
- CSS extraction same as traditional

---

### 2. React on Rails Configuration

Update `config/initializers/react_on_rails.rb`:

```ruby
ReactOnRails.configure do |config|
  # Standard config
  config.server_render_method = :shakapacker
  config.package_output_path = 'app/assets/webpack'

  # Enable RSC support
  config.rsc_enabled = true
  config.rsc_server_render_method = :rsc
  config.rsc_webpack_bundle = 'search-rsc'

  # Async prop support
  config.rsc_async_props_enabled = true
end
```

---

### 3. Entry Point

Create `app/javascript/entries/search_rsc.tsx`:

```typescript
import React from 'react';
import { RestaurantSearchRSC } from '../components/search/RestaurantSearchRSC';

// This is a Server Component (async)
export default async function RootRSC() {
  return <RestaurantSearchRSC />;
}
```

---

### 4. Server Components (Async Functions)

Create in `app/javascript/components/async/rsc/`:

**Key Difference from Traditional**:
- These are `async function` (not React components)
- They use `getReactOnRailsAsyncProp` (provided by react-on-rails)
- NO hooks, NO state, NO context
- Data passed as props to display components

#### AsyncStatus.tsx
```typescript
// This is a SERVER COMPONENT (async)
// No hooks, no state, no context allowed

async function AsyncStatus({ restaurantId }: Props) {
  // Fetch data on server using getReactOnRailsAsyncProp
  // react-on-rails provides this function
  const status = await getReactOnRailsAsyncProp('status', {
    restaurantId,
  });

  // Data is available before component renders
  // No spinners needed
  return <StatusBadge status={status} />;
}

export default AsyncStatus;
```

#### AsyncWaitTime.tsx
```typescript
async function AsyncWaitTime({ restaurantId }: Props) {
  const waitTime = await getReactOnRailsAsyncProp('waitTime', {
    restaurantId,
  });

  if (!waitTime) return null;

  return <WaitTimeBadge minutes={waitTime} />;
}

export default AsyncWaitTime;
```

#### AsyncSpecials.tsx
```typescript
async function AsyncSpecials({ restaurantId }: Props) {
  const promotions = await getReactOnRailsAsyncProp('specials', {
    restaurantId,
  });

  return <SpecialsList promotions={promotions} />;
}

export default AsyncSpecials;
```

#### AsyncTrending.tsx
```typescript
async function AsyncTrending({ restaurantId }: Props) {
  const items = await getReactOnRailsAsyncProp('trending', {
    restaurantId,
  });

  if (!items || items.length === 0) return null;

  return <TrendingItems items={items} />;
}

export default AsyncTrending;
```

#### AsyncRating.tsx
```typescript
async function AsyncRating({ restaurantId }: Props) {
  const rating = await getReactOnRailsAsyncProp('rating', {
    restaurantId,
  });

  return <RatingBadge rating={rating.average} count={rating.count} />;
}

export default AsyncRating;
```

---

### 5. Container Component

Create `app/javascript/components/search/RestaurantSearchRSC.tsx`:

```typescript
import { Suspense } from 'react';
import { SearchHeader } from './SearchHeader';
import { RestaurantGrid } from './RestaurantGrid';
import { RestaurantCardRSC } from './RestaurantCardRSC';
import type { Restaurant } from '@types';

// This is a SERVER COMPONENT
async function RestaurantSearchRSC() {
  // Fetch restaurants on server
  // In real app, would query database or API
  const restaurantResponse = await fetch(
    'http://localhost:3000/api/restaurants?limit=20',
    { cache: 'no-store' }
  );
  const restaurants: Restaurant[] = await restaurantResponse.json();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <SearchHeader />
      <RestaurantGrid restaurants={restaurants}>
        {(restaurant) => (
          <RestaurantCardRSC key={restaurant.id} restaurant={restaurant} />
        )}
      </RestaurantGrid>
    </div>
  );
}

export default RestaurantSearchRSC;
```

Create `app/javascript/components/search/RestaurantCardRSC.tsx`:

```typescript
import { Suspense } from 'react';
import { RestaurantCardHeader } from '@components/restaurant/RestaurantCardHeader';
import { RestaurantCardFooter } from '@components/restaurant/RestaurantCardFooter';
import { AsyncStatus } from '@components/async/rsc/AsyncStatus';
import { AsyncWaitTime } from '@components/async/rsc/AsyncWaitTime';
import { AsyncSpecials } from '@components/async/rsc/AsyncSpecials';
import { AsyncTrending } from '@components/async/rsc/AsyncTrending';
import { AsyncRating } from '@components/async/rsc/AsyncRating';
import { Spinner } from '@components/ui/Spinner';
import type { Restaurant } from '@types';

interface Props {
  restaurant: Restaurant;
}

// SERVER COMPONENT
async function RestaurantCardRSC({ restaurant }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        {/* Static content */}
        <RestaurantCardHeader restaurant={restaurant} />

        {/* Async server components with Suspense */}
        <div className="space-y-3 my-4">
          <Suspense fallback={<Spinner />}>
            <AsyncStatus restaurantId={restaurant.id} />
          </Suspense>

          <Suspense fallback={<Spinner />}>
            <AsyncWaitTime restaurantId={restaurant.id} />
          </Suspense>

          <Suspense fallback={<Spinner />}>
            <AsyncSpecials restaurantId={restaurant.id} />
          </Suspense>

          <Suspense fallback={<Spinner />}>
            <AsyncTrending restaurantId={restaurant.id} />
          </Suspense>

          <Suspense fallback={<Spinner />}>
            <AsyncRating restaurantId={restaurant.id} />
          </Suspense>
        </div>

        {/* Static footer */}
        <RestaurantCardFooter restaurant={restaurant} />
      </div>
    </div>
  );
}

export default RestaurantCardRSC;
```

---

### 6. View Template

Create `app/views/restaurants/search_rsc.html.erb`:

```erb
<div id="root">
  <!-- RSC renders this on server -->
  <!-- Server fetches all data in parallel -->
  <!-- HTML streamed to browser as Suspense boundaries resolve -->

  <!-- The react_on_rails helper handles RSC rendering -->
  <%= rsc_component('RestaurantSearchRSC', {}, streaming: true) %>
</div>

<style>
  /* Server-side streaming styles */
  * {
    scroll-behavior: smooth;
  }
</style>
```

---

### 7. Controller Action

Create/Update `app/controllers/restaurants_controller.rb`:

```ruby
class RestaurantsController < ApplicationController
  def search_rsc
    # Load restaurants for RSC rendering
    @restaurants = Restaurant.order(average_rating: :desc).limit(20)

    # RSC handles fetching async props automatically
    # react_on_rails will call getReactOnRailsAsyncProp handlers
  end
end
```

---

### 8. Async Props Handler

Create `app/javascript/utils/rsc-async-props.ts`:

```typescript
// Register async prop handlers
// These are called when components use getReactOnRailsAsyncProp

export const asyncPropHandlers = {
  // Traditional version handlers
  traditional: {
    // Handled by client-side useEffect - not needed here
  },

  // RSC version handlers
  rsc: {
    status: async (options: { restaurantId: number }) => {
      const response = await fetch(
        `/api/restaurants/${options.restaurantId}/status`
      );
      return response.json();
    },

    waitTime: async (options: { restaurantId: number }) => {
      const response = await fetch(
        `/api/restaurants/${options.restaurantId}/wait_time`
      );
      const data = await response.json();
      return data.wait_time;
    },

    specials: async (options: { restaurantId: number }) => {
      const response = await fetch(
        `/api/restaurants/${options.restaurantId}/specials`
      );
      const data = await response.json();
      return data.promotions;
    },

    trending: async (options: { restaurantId: number }) => {
      const response = await fetch(
        `/api/restaurants/${options.restaurantId}/trending`
      );
      const data = await response.json();
      return data.items;
    },

    rating: async (options: { restaurantId: number }) => {
      const response = await fetch(
        `/api/restaurants/${options.restaurantId}/rating`
      );
      return response.json();
    },
  },
};
```

---

### 9. Performance Monitoring

Create `app/javascript/utils/performance/rsc-vitals.ts`:

```typescript
export function initializeRSCPerformanceMonitoring() {
  // Same Web Vitals collection as traditional
  // But timing should be much better

  let lcp = 0;
  let cls = 0;
  let inp = 0;

  // LCP collector
  const paintObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    lcp = lastEntry.startTime;
  });
  paintObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // CLS collector
  const layoutShiftObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    }
  });
  layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

  // INP collector
  const interactionObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      inp = Math.max(inp, (entry as any).duration);
    }
  });
  interactionObserver.observe({ entryTypes: ['interaction'] });

  window.addEventListener('beforeunload', () => {
    sendMetrics({
      version: 'rsc',
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

Include in view or entry point:
```typescript
if (typeof window !== 'undefined') {
  initializeRSCPerformanceMonitoring();
}
```

---

## File Structure

```
app/javascript/
├─ entries/
│  └─ search_rsc.tsx
├─ components/
│  ├─ restaurant/          (Task 2 - shared)
│  ├─ search/
│  │  ├─ SearchHeader.tsx
│  │  ├─ RestaurantGrid.tsx
│  │  ├─ RestaurantSearchRSC.tsx
│  │  └─ RestaurantCardRSC.tsx
│  ├─ async/
│  │  └─ rsc/              (THIS TASK)
│  │     ├─ AsyncStatus.tsx
│  │     ├─ AsyncWaitTime.tsx
│  │     ├─ AsyncSpecials.tsx
│  │     ├─ AsyncTrending.tsx
│  │     └─ AsyncRating.tsx
│  └─ ui/
│     └─ Spinner.tsx
└─ utils/
   └─ performance/
      └─ rsc-vitals.ts

config/webpack/
├─ webpack.rsc.js
├─ webpack.rsc.development.js
└─ webpack.rsc.production.js

config/initializers/
└─ react_on_rails.rb (with RSC enabled)

app/views/restaurants/
├─ search.html.erb          (Task 3)
└─ search_rsc.html.erb      (THIS TASK)
```

---

## Success Criteria

### Must Have ✅

- [ ] Webpack RSC config builds without errors
- [ ] `npm run build:rsc` creates three bundles (RSC payload, server, client)
- [ ] `/search/rsc` route works and displays restaurants
- [ ] All async components fetch data on server
- [ ] HTML streams to browser with data
- [ ] No spinners visible (spinners resolve on server)
- [ ] All 5 async components render with data
- [ ] No client-side fetch() calls (verify in Network tab)
- [ ] Streaming visible in browser DevTools

### Performance ⚡

- [ ] **LCP: ~200-250ms** (59% faster than Traditional)
- [ ] **CLS: ~0.02** (83% better than Traditional)
- [ ] INP: ~50-60ms (data already loaded)
- [ ] Client JS bundle: ~25-30 KB (smaller than traditional)
- [ ] No Network waterfall (all server requests parallel)
- [ ] No layout shifts (spinners resolved server-side)
- [ ] Streaming chunks visible in Network timeline

### Code Quality

- [ ] TypeScript compilation succeeds
- [ ] No console errors or warnings
- [ ] Server components have no hooks/state/context
- [ ] All async props properly typed
- [ ] Components responsive (mobile, tablet, desktop)
- [ ] Accessibility score >90

---

## Key Implementation Notes

### Server Component Pattern

```typescript
// ✅ CORRECT - Async server component
async function AsyncStatus({ restaurantId }: Props) {
  const status = await getReactOnRailsAsyncProp('status', { restaurantId });
  return <StatusBadge status={status} />;
}
```

```typescript
// ❌ WRONG - Can't use hooks in server component
async function AsyncStatus({ restaurantId }: Props) {
  const [status, setStatus] = useState(null); // ERROR!
  return <div>{status}</div>;
}
```

### getReactOnRailsAsyncProp Usage

```typescript
// ✅ CORRECT - Provided by react-on-rails
const data = await getReactOnRailsAsyncProp('key', { options });
```

```typescript
// ❌ WRONG - Don't fetch manually in async component
const response = await fetch('/api/...');
const data = await response.json();
```

### Suspense Boundaries

```typescript
// ✅ CORRECT - Suspense for streaming
<Suspense fallback={<Spinner />}>
  <AsyncStatus restaurantId={id} />
</Suspense>
```

Spinners shown while server fetches. Once data ready, spinners replaced **without CLS** because they're streamed with the data.

---

## Performance Timeline (Expected)

1. **0-50ms**: Browser sends request
2. **50-200ms**: Server fetches all data in parallel (status, wait_time, specials, etc.)
3. **200-250ms**: Server renders all components with data
4. **250-300ms**: Browser receives and renders HTML
5. **Total LCP**: ~200-250ms (vs 500-600ms traditional)

No spinners visible because all data resolved on server before streaming.

---

## Testing

```typescript
// Test async server component works
describe('AsyncStatus RSC', () => {
  it('renders status from server', async () => {
    const component = await AsyncStatus({ restaurantId: 1 });
    expect(component).toContain('open');
  });
});

// Test performance
describe('RSC version performance', () => {
  it('has LCP around 200-250ms', async () => {
    const start = performance.now();
    // Navigate to /search/rsc
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThan(200);
    expect(elapsed).toBeLessThan(300);
  });

  it('has CLS around 0.02', async () => {
    // Measure CLS - should be minimal
    expect(cls).toBeLessThan(0.05);
  });
});
```

---

## Handoff Criteria

Complete when:

- [ ] `/search/rsc` loads with all data server-side
- [ ] LCP ~200-250ms, CLS ~0.02 (59% faster, 83% better)
- [ ] No spinners visible
- [ ] No client-side fetch requests (all server-side)
- [ ] Streaming visible in DevTools Network tab
- [ ] TypeScript types everywhere
- [ ] No console errors

**Next**: Task 5 (Dashboard & Docs) - After both Task 3 & 4 complete

---

## Troubleshooting

**Q: getReactOnRailsAsyncProp not found**
A: Ensure react-on-rails config has RSC enabled. Check react_on_rails.rb initializer.

**Q: Server components still using hooks**
A: Remove all useState, useEffect, useContext. These are client-side only.

**Q: LCP still 500ms**
A: Check that all data fetched on server (not client). Verify streaming in Network tab.

**Q: CLS >0.05**
A: Spinners shouldn't cause CLS in RSC (they're resolved server-side). Check for dynamic content shifts.

**Q: Streaming not working**
A: Verify react-on-rails streaming enabled. Check server logs for errors.

---

## Resources

- React Server Components: https://react.dev/reference/rsc/server-components
- react-on-rails RSC Docs: https://github.com/shakacode/react_on_rails/blob/master/docs/rsc.md
- Streaming HTML: https://web.dev/rendering-on-the-web/#server-rendering
- Suspense: https://react.dev/reference/react/Suspense
- Web Vitals: https://web.dev/vitals/
