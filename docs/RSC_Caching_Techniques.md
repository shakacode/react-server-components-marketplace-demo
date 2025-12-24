# RSC Caching Techniques

Quick reference for React Server Components caching strategies to maximize performance.

---

## 1. Data Cache (`unstable_cache` / `use cache`)

Cache expensive data fetches on the server.

```typescript
// Using unstable_cache (current)
import { unstable_cache } from 'next/cache';

const getCachedUser = unstable_cache(
  async (id: number) => await db.user.findUnique({ where: { id } }),
  ['user-cache'],
  { revalidate: 3600, tags: ['users'] }
);

// Using 'use cache' directive (React 19+)
async function getUser(id: number) {
  'use cache';
  return await db.user.findUnique({ where: { id } });
}
```

---

## 2. Request Memoization (`cache`)

Deduplicate identical requests within a single render pass.

```typescript
import { cache } from 'react';

const getUser = cache(async (id: number) => {
  return await db.user.findUnique({ where: { id } });
});

// Called multiple times in component tree = only 1 DB query
```

---

## 3. Cache Tags & Revalidation

Invalidate specific cached data on-demand.

```typescript
// Tag your cache
const getProducts = unstable_cache(
  async () => await db.products.findMany(),
  ['products'],
  { tags: ['products', 'inventory'] }
);

// Invalidate by tag (Server Action)
import { revalidateTag } from 'next/cache';

async function updateProduct() {
  'use server';
  await db.products.update(...);
  revalidateTag('products'); // Purges all caches with this tag
}
```

---

## 4. Time-Based Revalidation

Auto-refresh cached data at intervals.

```typescript
// Revalidate every hour
const getStats = unstable_cache(
  async () => await fetchStats(),
  ['stats'],
  { revalidate: 3600 } // seconds
);

// Or at fetch level
const data = await fetch(url, { next: { revalidate: 60 } });
```

---

## 5. Static Generation with Dynamic Islands

Pre-render static shell, stream dynamic parts.

```typescript
// Static outer shell
export default async function Page() {
  return (
    <div>
      <Header /> {/* Static - cached at build */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent /> {/* Streamed on request */}
      </Suspense>
      <Footer /> {/* Static - cached at build */}
    </div>
  );
}
```

---

## 6. Parallel Data Fetching

Fetch data concurrently, not sequentially.

```typescript
async function Dashboard({ userId }: { userId: number }) {
  // Parallel - fast
  const [user, orders, stats] = await Promise.all([
    getUser(userId),
    getOrders(userId),
    getStats(userId),
  ]);

  return <DashboardView user={user} orders={orders} stats={stats} />;
}
```

---

## 7. Preloading Data

Start fetching before component renders.

```typescript
import { preload } from 'react-dom';

// Preload function
export function preloadUser(id: number) {
  void getUser(id); // Fire and forget
}

// In parent component
export default function Page({ params }) {
  preloadUser(params.id); // Start fetch immediately
  return <UserProfile id={params.id} />;
}
```

---

## 8. Cache Lifetimes (`cacheLife`)

Define cache duration profiles (React 19+).

```typescript
async function getProducts() {
  'use cache';
  cacheLife('hours'); // Predefined: seconds, minutes, hours, days, weeks
  return await db.products.findMany();
}

// Custom profile
cacheLife({ stale: 300, revalidate: 60, expire: 3600 });
```

---

## Performance Checklist

| Technique | Use When |
|-----------|----------|
| `unstable_cache` | Expensive DB queries, API calls |
| `cache` (React) | Same data needed in multiple components |
| `revalidateTag` | Data changes from user actions |
| `revalidate: N` | Data changes predictably over time |
| `Promise.all` | Multiple independent data fetches |
| Suspense boundaries | Streaming progressive content |
| Preloading | Known upcoming data needs |

---

## Quick Wins

1. **Wrap all DB calls** in `unstable_cache` with appropriate tags
2. **Use `Promise.all`** for parallel fetches (avoid waterfalls)
3. **Add Suspense boundaries** around slow data sections
4. **Tag everything** - makes invalidation surgical
5. **Default to caching** - opt-out with `{ cache: 'no-store' }` when needed
