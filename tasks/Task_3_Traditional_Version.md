# Task 3: Traditional Version

**Time**: 10-14 hours
**Dependencies**: Task 1 (webpack config complete), Task 2 (Components & API complete)
**Can Run Parallel With**: Task 4 (RSC Version)

---

## Overview

Build the traditional SSR + client-side fetching version. This demonstrates current best practice: SSR the page, then client components handle data fetching.

**Key Principle**: Use "use client" boundary to force components to be client-side, similar to how `lazy()` works but using React 19's native approach.

**Pattern**:
1. Parent component (SearchPage) SSRed by `react_component` helper
2. Child component (SearchPageContent) marked with "use client" directive
3. Child component contains async components with useState + useEffect
4. Data fetched client-side via fetch API
5. Spinners show while loading, replaced when data arrives

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

### 2. Parent Component (SSRed)

Create `app/javascript/components/search/SearchPage.tsx`:

```typescript
import React from 'react';
import SearchPageContent from './SearchPageContent';

interface Props {
  restaurant_id: number;
}

export default function SearchPage({ restaurant_id }: Props) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Restaurant Details</h1>
      <SearchPageContent restaurantId={restaurant_id} />
    </div>
  );
}
```

This component will be SSRed by the Rails `react_component` helper.

---

### 3. Client-Side Components ("use client")

Create `app/javascript/components/search/SearchPageContent.tsx`:

```typescript
"use client";

import React, { Suspense } from 'react';
import AsyncStatus from '../async/traditional/AsyncStatus';
import AsyncWaitTime from '../async/traditional/AsyncWaitTime';
import AsyncSpecials from '../async/traditional/AsyncSpecials';
import AsyncTrending from '../async/traditional/AsyncTrending';
import AsyncRating from '../async/traditional/AsyncRating';
import Spinner from '../shared/Spinner';

interface Props {
  restaurantId: number;
}

export default function SearchPageContent({ restaurantId }: Props) {
  return (
    <div className="space-y-6">
      {/* Static content */}
      <RestaurantCardHeader restaurantId={restaurantId} />

      {/* Dynamic content with fallback spinners */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<Spinner label="Checking status..." />}>
          <AsyncStatus restaurantId={restaurantId} />
        </Suspense>

        <Suspense fallback={<Spinner label="Getting wait time..." />}>
          <AsyncWaitTime restaurantId={restaurantId} />
        </Suspense>

        <Suspense fallback={<Spinner label="Loading specials..." />}>
          <AsyncSpecials restaurantId={restaurantId} />
        </Suspense>

        <Suspense fallback={<Spinner label="Finding trending items..." />}>
          <AsyncTrending restaurantId={restaurantId} />
        </Suspense>

        <Suspense fallback={<Spinner label="Fetching ratings..." />}>
          <AsyncRating restaurantId={restaurantId} />
        </Suspense>
      </div>
    </div>
  );
}
```

---

### 4. Async Components (client-side fetch)

Create `app/javascript/components/async/traditional/AsyncStatus.tsx`:

```typescript
"use client";

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
- `AsyncWaitTime.tsx` - Fetches `/api/restaurants/:id/wait_time`
- `AsyncSpecials.tsx` - Fetches `/api/restaurants/:id/specials`
- `AsyncTrending.tsx` - Fetches `/api/restaurants/:id/trending`
- `AsyncRating.tsx` - Fetches `/api/restaurants/:id/rating`

---

### 5. Rails View

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

### 6. Routes Configuration

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

### 7. Rails Controller

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
- [ ] Parent (SearchPage) SSRs on server
- [ ] Child (SearchPageContent) marked "use client"
- [ ] Spinners visible initially
- [ ] All 5 async components load (separate API calls)
- [ ] Spinners replaced with content when ready
- [ ] Web Vitals collected and posted to `/api/performance_metrics`
- [ ] Web Vitals measured: LCP ~500-600ms, CLS ~0.10-0.15
- [ ] Console shows no errors

---

## Key Technical Details

### "use client" vs lazy()

**Traditional approach (not used here)**:
```typescript
const AsyncStatusLazy = lazy(() => import('./AsyncStatus.lazy'));
```

**New approach (Task 3 uses this)**:
```typescript
"use client";
// Component is client-side JavaScript
```

Both achieve the same goal: force component to be client-side. The "use client" directive is React 19's native approach.

### React Hydration

The RSC webpack config (created in Task 1) handles:
1. Server rendering SearchPage
2. Client-side hydration
3. Client-side rendering of SearchPageContent
4. Lazy loading of async chunks

Rails `react_component` helper automatically handles hydration.

### Data Fetching Pattern

- **No hooks in parent**: SearchPage is SSRed
- **Hooks in children**: SearchPageContent has "use client", children use useState/useEffect
- **API calls**: Each async component makes its own fetch() call
- **Error handling**: Try/catch and AbortController for cleanup

---

## Troubleshooting

**Problem**: Hydration mismatch
- **Solution**: Ensure parent has no "use client", only child has it

**Problem**: API calls not happening
- **Solution**: Check Network tab in DevTools, verify `/api/restaurants/:id/*` endpoints exist

**Problem**: Spinners never disappear
- **Solution**: Check API responses are valid JSON with correct format

---

## Files Created/Modified

- ✅ `app/javascript/entries/search.tsx`
- ✅ `app/javascript/components/search/SearchPage.tsx`
- ✅ `app/javascript/components/search/SearchPageContent.tsx`
- ✅ `app/javascript/components/async/traditional/AsyncStatus.tsx`
- ✅ `app/javascript/components/async/traditional/AsyncWaitTime.tsx`
- ✅ `app/javascript/components/async/traditional/AsyncSpecials.tsx`
- ✅ `app/javascript/components/async/traditional/AsyncTrending.tsx`
- ✅ `app/javascript/components/async/traditional/AsyncRating.tsx`
- ✅ `app/views/restaurants/search.html.erb`
- ✅ `app/controllers/restaurants_controller.rb`

---

## Notes

- Both Task 3 & 4 use the SAME webpack config created in Task 1
- Only the component patterns differ
- Performance difference comes from data fetching timing, not webpack configuration
- This task demonstrates the current best practice (before RSC)
