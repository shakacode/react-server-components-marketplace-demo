# Task 4: RSC Version

**Time**: 10-14 hours
**Dependencies**: Task 1 (webpack config complete), Task 2 (Components & API complete)
**Can Run Parallel With**: Task 3 (Traditional Version)

---

## Overview

Build the React Server Components (RSC) + streaming version. This demonstrates how RSC dramatically improves Web Vitals by fetching all data server-side before rendering.

**Key Principle**: Root component is an async function WITHOUT `"use client"` directive, which tells webpack:
- ✅ Put this in the RSC bundle (not server bundle)
- ✅ SSRed via RSC pipeline (server-side async rendering)
- ✅ Streamed to browser as Suspense boundaries resolve
- ✅ All data fetched server-side via getReactOnRailsAsyncProp
- ❌ No `"use client"` directive (uses RSC, not traditional SSR)

**Pattern**:
1. Root component is async function (no `"use client"`)
2. All nested async components await data before rendering
3. Data fetched server-side via getReactOnRailsAsyncProp
4. No useState or useEffect (React hooks forbidden in server components)
5. `stream_react_component` helper streams HTML as Suspense boundaries resolve
6. Browser receives complete HTML with no client-side fetch waterfall

**Expected Performance**: LCP ~200-250ms, CLS ~0.02

---

## Deliverables

### 1. Entry Point

Create `app/javascript/entries/search_rsc.tsx`:

```typescript
import React from 'react';
import SearchPageRSC from '../components/search/SearchPageRSC';

export default SearchPageRSC;
```

---

### 2. Root Server Component

Create `app/javascript/components/search/SearchPageRSC.tsx`:

```typescript
// No "use client" directive!
// This means: put in RSC bundle (server components), not server bundle (traditional SSR)

import React, { Suspense } from 'react';
import AsyncStatus from '../async/rsc/AsyncStatus';
import AsyncWaitTime from '../async/rsc/AsyncWaitTime';
import AsyncSpecials from '../async/rsc/AsyncSpecials';
import AsyncTrending from '../async/rsc/AsyncTrending';
import AsyncRating from '../async/rsc/AsyncRating';
import Spinner from '../shared/Spinner';

interface Props {
  restaurant_id: number;
}

// This is an async server component (RSC)
// No "use client" = goes in RSC bundle
async function SearchPageRSC({ restaurant_id }: Props) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Restaurant Details</h1>

      {/* Static content */}
      <RestaurantCardHeader restaurantId={restaurant_id} />

      {/* Dynamic content - all data fetched SERVER-SIDE */}
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

export default SearchPageRSC;
```

**Key difference from Task 3**:
- ❌ No "use client" directive
- ✅ Async function (server component pattern)
- ✅ Put in RSC bundle (not server bundle)

---

### 3. Async Server Components

Create `app/javascript/components/async/rsc/AsyncStatus.tsx`:

```typescript
import React from 'react';
import StatusBadge from '../../restaurant/StatusBadge';
import { getReactOnRailsAsyncProp } from 'react-on-rails-pro';

interface Props {
  restaurantId: number;
}

interface StatusData {
  status: 'open' | 'closed' | 'custom_hours';
  timestamp: number;
}

// Server component - async function, no hooks allowed
async function AsyncStatus({ restaurantId }: Props) {
  // Data is fetched on the SERVER using getReactOnRailsAsyncProp
  // getReactOnRailsAsyncProp is provided by react-on-rails-pro
  // It calls the Rails helper method you define
  const status = await getReactOnRailsAsyncProp<StatusData>(
    'status',
    { restaurantId }
  );

  // Component renders with data already resolved (no spinners)
  return <StatusBadge status={status.status} />;
}

export default AsyncStatus;
```

Create similar async server components:
- `AsyncWaitTime.tsx` - Awaits `getReactOnRailsAsyncProp('wait_time', ...)`
- `AsyncSpecials.tsx` - Awaits `getReactOnRailsAsyncProp('specials', ...)`
- `AsyncTrending.tsx` - Awaits `getReactOnRailsAsyncProp('trending', ...)`
- `AsyncRating.tsx` - Awaits `getReactOnRailsAsyncProp('rating', ...)`

---

### 4. Rails View

Create `app/views/restaurants/search_rsc.html.erb`:

```erb
<div id="search-page-rsc-app">
  <%= stream_react_component(
    "SearchPageRSC",
    { restaurant_id: @restaurant.id }
  ) %>
</div>

<script>
  // Collect Web Vitals (same as traditional version)
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
        page_type: 'rsc',
        timestamp: new Date().toISOString(),
      }),
    });
  }
</script>
```

---

### 5. Rails Async Prop Helpers

Create `app/javascript/helpers/async_props.rb` (in Rails app):

```ruby
module AsyncProps
  def self.status(restaurant_id:)
    restaurant = Restaurant.find(restaurant_id)
    {
      status: restaurant.current_status,
      timestamp: Time.current.to_i,
    }
  end

  def self.wait_time(restaurant_id:)
    restaurant = Restaurant.find(restaurant_id)
    {
      wait_time: restaurant.current_wait_time,
      timestamp: Time.current.to_i,
    }
  end

  def self.specials(restaurant_id:)
    restaurant = Restaurant.find(restaurant_id)
    {
      promotions: restaurant.active_promotions,
      timestamp: Time.current.to_i,
    }
  end

  def self.trending(restaurant_id:)
    restaurant = Restaurant.find(restaurant_id)
    {
      items: restaurant.trending_items,
      timestamp: Time.current.to_i,
    }
  end

  def self.rating(restaurant_id:)
    restaurant = Restaurant.find(restaurant_id)
    {
      average_rating: restaurant.average_rating,
      review_count: restaurant.review_count,
      timestamp: Time.current.to_i,
    }
  end
end
```

---

### 6. Routes Configuration

Add to `config/routes.rb`:

```ruby
get '/search/rsc', to: 'restaurants#search_rsc'
```

---

### 7. Rails Controller

Add to `app/controllers/restaurants_controller.rb`:

```ruby
def search_rsc
  @restaurant = Restaurant.find(params[:id] || 1)
end
```

---

## Success Criteria

- [ ] `/search/rsc` page loads and renders
- [ ] All data fetched on SERVER (no client-side API calls)
- [ ] HTML streamed to browser as Suspense boundaries resolve
- [ ] Spinners visible only during server fetch (not on client)
- [ ] No hydration errors
- [ ] Web Vitals collected: LCP ~200-250ms, CLS ~0.02
- [ ] 59% faster LCP than traditional version (550ms → 225ms)
- [ ] 83% less layout shift than traditional (0.12 → 0.02)
- [ ] Console shows no errors or warnings

---

## Key Technical Details

### Async Server Components (RSC Constraint)

Server components **CANNOT**:
- Use `useState`, `useEffect`, `useCallback`, etc. (React hooks)
- Use `useContext` (Context API)
- Use browser APIs (localStorage, window, etc.)
- Be marked with "use client"

Server components **CAN**:
- Be declared as `async function`
- Await data fetching
- Access Rails helpers and models
- Render pure display components

### getReactOnRailsAsyncProp

This is provided by `react-on-rails-pro`. It:
1. Receives a key name (e.g., 'status')
2. Receives props (e.g., { restaurantId: 1 })
3. Calls the Rails async prop helper (AsyncProps.status)
4. Returns the resolved data

### Data Fetching Flow (RSC)

```
1. Request arrives at Rails server
2. SearchPageRSC component starts rendering
3. AsyncStatus component awaits getReactOnRailsAsyncProp('status', ...)
4. Rails fetches status (100-150ms for wait_time)
5. Data returned to component
6. Component renders <StatusBadge status={...} />
7. Browser receives streamed HTML with resolved data
8. No client-side fetch waterfall
9. Total LCP: ~200-250ms (all data fetched server-side)
```

### vs Traditional (Task 3)

```
Traditional:
1. Server renders SearchPage
2. Browser downloads JS bundles
3. React hydrates
4. SearchPageContent mounts
5. useEffect sends fetch() for status
6. Wait for 100-150ms
7. Spinners replaced with content
8. Total LCP: ~500-600ms
```

### Streaming Benefit

- **No waterfall**: All queries run in parallel on server (~150-200ms total)
- **Early hints**: Browser starts rendering before all data ready
- **No hydration mismatch**: Server data matches rendered HTML

---

## Troubleshooting

**Problem**: `getReactOnRailsAsyncProp is not defined`
- **Solution**: Ensure react-on-rails-pro is installed and configured

**Problem**: Server component hangs (slow response)
- **Solution**: Check query latency, especially wait_time query (should be 100-150ms)

**Problem**: Hydration mismatch error
- **Solution**: Ensure no hooks in async server components, no "use client" directive

**Problem**: Spinners never disappear on client
- **Solution**: This is expected for RSC - data is resolved server-side, spinners shown briefly during streaming

---

## Files Created/Modified

- ✅ `app/javascript/entries/search_rsc.tsx`
- ✅ `app/javascript/components/search/SearchPageRSC.tsx`
- ✅ `app/javascript/components/async/rsc/AsyncStatus.tsx`
- ✅ `app/javascript/components/async/rsc/AsyncWaitTime.tsx`
- ✅ `app/javascript/components/async/rsc/AsyncSpecials.tsx`
- ✅ `app/javascript/components/async/rsc/AsyncTrending.tsx`
- ✅ `app/javascript/components/async/rsc/AsyncRating.tsx`
- ✅ `app/views/restaurants/search_rsc.html.erb`
- ✅ `app/javascript/helpers/async_props.rb` (Rails helper)
- ✅ `app/controllers/restaurants_controller.rb` (update)

---

## Notes

- Both Task 3 & 4 use the SAME webpack config created in Task 1
- Only the component patterns and Rails helpers differ
- Performance difference comes from data fetching timing on server vs client
- This task demonstrates React 19 Server Components (future best practice)
