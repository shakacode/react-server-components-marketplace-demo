# Task 3: Traditional Version

**Time**: 10-14 hours
**Dependencies**: Task 1 (webpack config complete), Task 2 (Components & API complete)
**Can Run Parallel With**: Task 4 (RSC Version)

---

## Overview

Build the traditional React SSR with client-side data fetching version.

**Key Principle**: Use `"use client"` at the root level. This makes ALL components in the tree become **client components** that go into the **client bundle** (not the RSC bundle).

- ✅ Root component: `"use client"` directive at the top
- ✅ All components underneath: become client components (can use hooks, state, effects)
- ✅ Components go into the client bundle, NOT the RSC bundle
- ✅ Static parts: SSRed on server
- ✅ Lazy-loaded components: **NOT SSRed** - only their Suspense fallbacks (spinners) render on server
- ✅ Data fetches: client-side via useEffect/fetch (after hydration)

**Pattern**:
1. Root component has `"use client"` directive
2. All imported components become client components (client bundle)
3. Use lazy() to code-split async components
4. Lazy-loaded components are NOT SSRed - only their fallbacks render on server
5. After hydration, lazy components load and useEffect fires API requests
6. Spinners replaced with content when data arrives
7. **Result**: 500-600ms LCP with client-side fetch waterfall

**Expected Performance**: LCP ~500-600ms, CLS ~0.10-0.15

---

## Deliverables

### 1. Entry Point

Create `app/javascript/entries/search.tsx`:

```typescript
import React from 'react';
import SearchPage from '../components/search/SearchPage';

export default SearchPage;
```

---

### 2. Root Component (with "use client")

Create `app/javascript/components/search/SearchPage.tsx`:

```typescript
"use client";  // ← Makes this and ALL imported components into client components (client bundle)

import React, { Suspense, lazy } from 'react';
import RestaurantCardHeader from '../restaurant/RestaurantCardHeader';
import Spinner from '../shared/Spinner';

// Lazy-loaded components - these are NOT SSRed, only their fallbacks are
const AsyncStatus = lazy(() => import('../async/traditional/AsyncStatus'));
const AsyncWaitTime = lazy(() => import('../async/traditional/AsyncWaitTime'));
const AsyncSpecials = lazy(() => import('../async/traditional/AsyncSpecials'));
const AsyncTrending = lazy(() => import('../async/traditional/AsyncTrending'));
const AsyncRating = lazy(() => import('../async/traditional/AsyncRating'));

interface Props {
  restaurant_id: number;
}

export default function SearchPage({ restaurant_id }: Props) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Restaurant Details</h1>

      {/* Static content - SSRed on server */}
      <RestaurantCardHeader restaurantId={restaurant_id} />

      {/* Lazy-loaded content - NOT SSRed, only spinners render on server */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Suspense fallback={<Spinner label="Checking status..." />}>
            <AsyncStatus restaurantId={restaurant_id} />
          </Suspense>

          <Suspense fallback={<Spinner label="Getting wait time..." />}>
            <AsyncWaitTime restaurantId={restaurant_id} />
          </Suspense>

          <Suspense fallback={<Spinner label="Loading specials..." />}>
            <AsyncSpecials restaurantId={restaurant_id} />
          </Suspense>

          <Suspense fallback={<Spinner label="Finding trending items..." />}>
            <AsyncTrending restaurantId={restaurant_id} />
          </Suspense>

          <Suspense fallback={<Spinner label="Fetching ratings..." />}>
            <AsyncRating restaurantId={restaurant_id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

**Key**: `"use client"` at root level makes all components become client components (go into client bundle, NOT RSC bundle). Static parts are SSRed, but lazy-loaded components are NOT SSRed - only their Suspense fallbacks (spinners) render on the server.

---

### 3. Lazy-Loaded Async Components (Code-Split)

Create individual async components in separate files. The `lazy()` imports in SearchPage.tsx (from section 2) code-split each component into its own chunk.

Create `app/javascript/components/async/traditional/AsyncStatus.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import StatusBadge from '../../restaurant/StatusBadge';

interface StatusData {
  status: 'open' | 'closed' | 'custom_hours';
  timestamp: number;
}

interface Props {
  restaurantId: number;
}

export default function AsyncStatus({ restaurantId }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // Data fetches on CLIENT-SIDE
    fetch(`/api/restaurants/${restaurantId}/status`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: StatusData) => {
        setStatus(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Failed to load status');
        }
      });

    return () => controller.abort();
  }, [restaurantId]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!status) return null;

  return <StatusBadge status={status.status} />;
}
```

Create similar async components:
- `AsyncWaitTime.tsx` - Fetches `/api/restaurants/:id/wait_time` (100-150ms)
- `AsyncSpecials.tsx` - Fetches `/api/restaurants/:id/specials`
- `AsyncTrending.tsx` - Fetches `/api/restaurants/:id/trending`
- `AsyncRating.tsx` - Fetches `/api/restaurants/:id/rating`

**Key**: Each async component is in its own file and imported via `lazy()` → separate chunk in webpack bundle.
**Important**: Lazy-loaded components are NOT SSRed - only their Suspense fallbacks (spinners) render on server. After hydration, the lazy chunks load and fetch data client-side.

---

### 4. Rails View

Create `app/views/restaurants/search.html.erb`:

```erb
<div id="search-page-app">
  <%= react_component(
    "SearchPage",
    { restaurant_id: @restaurant.id },
    { prerender: true }
  ) %>
</div>

<script>
  // Collect Web Vitals
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

  getCLS(metric => sendMetric(metric));
  getFID(metric => sendMetric(metric));
  getFCP(metric => sendMetric(metric));
  getLCP(metric => sendMetric(metric));
  getTTFB(metric => sendMetric(metric));

  function sendMetric(metric) {
    fetch('/api/performance_metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        page_type: 'traditional',
        timestamp: new Date().toISOString(),
      }),
    });
  }
</script>
```

---

### 5. Routes Configuration

Add to `config/routes.rb`:

```ruby
get '/search', to: 'restaurants#search'
get '/api/restaurants/:id/status', to: 'api/restaurants#status'
get '/api/restaurants/:id/wait_time', to: 'api/restaurants#wait_time'
get '/api/restaurants/:id/specials', to: 'api/restaurants#specials'
get '/api/restaurants/:id/trending', to: 'api/restaurants#trending'
get '/api/restaurants/:id/rating', to: 'api/restaurants#rating'
```

---

### 6. Rails Controller

Create `app/controllers/restaurants_controller.rb`:

```ruby
class RestaurantsController < ApplicationController
  def search
    @restaurant = Restaurant.find(params[:id] || 1)
  end
end
```

---

## Success Criteria

- [ ] `/search` page loads and renders
- [ ] Static content visible immediately (SSRed)
- [ ] Spinners visible initially (placeholders)
- [ ] All 5 async components load (separate API calls)
- [ ] Spinners replaced with content when data arrives
- [ ] Web Vitals collected: LCP ~500-600ms, CLS ~0.10-0.15
- [ ] Network waterfall shows sequential API calls (fetch waterfall)
- [ ] Console shows no errors

---

## Key Technical Details

### What "use client" Does

`"use client"` marks the boundary where components become **client components**:
- ✅ The component AND all components it imports become client components
- ✅ Client components go into the **client bundle** (NOT the RSC bundle)
- ✅ Static parts of client components CAN be SSRed
- ❌ Lazy-loaded components (via `lazy()`) are NOT SSRed - only their fallbacks render
- ✅ Client components can use hooks (useState, useEffect, etc.), state, and context
- ❌ Component is NOT in RSC bundle (excluded from server components)

**Result**: Traditional React pattern with client-side interactivity.

### Why This Feels Slow

```
Timeline:
0-50ms:   SSRed HTML received (spinners visible because lazy components NOT SSRed)
50-100ms: JS bundles download (main bundle + lazy chunks)
100-150ms: React hydrates
150-200ms: Lazy components load and mount, useEffect fires
200-350ms: API requests in flight (~100-150ms wait_time query)
350-500ms: Responses received, spinners replaced with content
500-600ms: All content visible (LCP)
```

Lazy-loaded components fetch data client-side → waterfall effect.

### Suspense + fallback Pattern

```typescript
<Suspense fallback={<Spinner />}>
  <AsyncStatus restaurantId={restaurantId} />
</Suspense>
```

- **On server**: Only the Spinner fallback is rendered (lazy component NOT SSRed)
- **After hydration**: Lazy chunk loads, component mounts, useEffect fetches data
- **When data arrives**: Spinner replaced with actual content (causes CLS)

---

## Troubleshooting

**Problem**: Content doesn't load (infinite spinner)
- **Solution**: Check `/api/restaurants/:id/*` endpoints return valid JSON

**Problem**: Content flashes then disappears
- **Solution**: Ensure API response includes correct data structure

**Problem**: "use client" not working as expected
- **Solution**: Verify it's at the very top of the file (before imports)

---

## Files Created/Modified

- ✅ `app/javascript/entries/search.tsx` (webpack entry point)
- ✅ `app/javascript/components/search/SearchPage.tsx` (WITH "use client" at root)
- ✅ `app/javascript/components/async/traditional/AsyncStatus.tsx` (lazy-loaded, separate chunk)
- ✅ `app/javascript/components/async/traditional/AsyncWaitTime.tsx` (lazy-loaded, separate chunk)
- ✅ `app/javascript/components/async/traditional/AsyncSpecials.tsx` (lazy-loaded, separate chunk)
- ✅ `app/javascript/components/async/traditional/AsyncTrending.tsx` (lazy-loaded, separate chunk)
- ✅ `app/javascript/components/async/traditional/AsyncRating.tsx` (lazy-loaded, separate chunk)
- ✅ `app/views/restaurants/search.html.erb` (Rails view)
- ✅ `app/controllers/restaurants_controller.rb` (Rails controller, `search` action)

---

## Notes

- Both Task 3 & 4 use the SAME webpack config created in Task 1
- **Pattern**: Put `"use client"` at root level → all components become client components
  - Components go into the **client bundle** (NOT RSC bundle)
  - Static parts SSRed, but lazy-loaded components are **NOT SSRed**
  - Only Suspense fallbacks (spinners) render on server for lazy components
  - Client-side fetch waterfall causes ~500-600ms LCP
- Async components are imported via `lazy()` for code-splitting
- Each async component has `useState` + `useEffect` for client-side data fetching
- Performance difference (vs RSC) comes from:
  1. Lazy components NOT SSRed (spinners shown initially)
  2. Client-side fetch waterfall (sequential API requests after hydration)
- This task demonstrates traditional React SSR with lazy-loading (current standard)
