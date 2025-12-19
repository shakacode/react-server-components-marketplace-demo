# LocalHub Demo: RSC + Streaming vs Traditional SSR

A restaurant marketplace discovery platform demonstrating how React Server Components with streaming dramatically improve Web Vitals compared to traditional SSR + lazy-loading.

## Quick Start

**The Problem**: Public-facing marketplace pages with dynamic real-time content suffer poor Web Vitals (slow LCP, high CLS) using traditional SSR + lazy-loading.

**The Solution**: React Server Components fetch all data server-side in parallel, stream complete HTML. Dramatically improves Web Vitals.

**The Results**:
- Traditional: LCP ~500-600ms, CLS ~0.10-0.15
- RSC: LCP ~200-250ms, CLS ~0.02
- **Improvement: 59% faster LCP, 83% less layout shift**

## Two Versions

```
/search         → Traditional: SSR static + lazy-load dynamic parts
/search/rsc     → RSC: Server-side fetch all + stream complete
/dashboard      → Metrics comparison
/comparison     → View both side-by-side
```

## Implementation (5 Tasks, 46-66 hours)

See `IMPLEMENTATION_TASKS.md` for detailed specifications.

| Task | Time | What |
|------|------|------|
| 1. Setup & Database | 8-12h | Rails app, PostgreSQL, seed 62M records |
| 2. Shared Components & API | 12-16h | Display components, 5 API endpoints |
| 3. Traditional Version | 10-14h | Webpack code-splitting, lazy components |
| 4. RSC Version | 10-14h | RSC loader, async components, streaming |
| 5. Dashboard & Docs | 6-10h | Metrics, demo walkthrough, deployment |

**Critical Path**: Task 1 (blocks everything) → Task 2 (blocks both versions) → Tasks 3&4 (parallel) → Task 5

## Architecture Decisions

### 1. One Database, Two Webpack Configs

**Shared** (82-85% code reuse):
- Same PostgreSQL database (50K restaurants, 10M orders)
- Same Rails models & API endpoints
- Same display components (StatusBadge, WaitTimeBadge, etc.)
- Same Tailwind styling

**Different**:
- Webpack config (traditional: code-splitting, RSC: RSC loader)
- Data fetching (client fetch vs getReactOnRailsAsyncProp)
- View templates

### 2. Realistic Query Latency is Essential

Wait time query scans 10M orders table, naturally takes **100-150ms**.

**Why critical**:
- <50ms queries: Both versions equally fast, demo fails
- 100-150ms queries: RSC advantage dramatic and real
- Proves benefit is architectural, not artificial

### 3. Traditional Version is Optimized

Traditional version uses best practices:
- SSR all static parts completely
- Only lazy-load dynamic parts
- No artificial slowdowns

Ensures RSC advantage is credible.

## Key Technical Details

### Display Components (100% Shared)

Same components used by both versions—pure functions taking data as props. NO hooks, state, or data fetching.

Examples: StatusBadge, WaitTimeBadge, RatingBadge, SpecialsList, TrendingItems

### Data Fetching Patterns

**Traditional Version**:
```typescript
// AsyncStatus wrapper (parent)
const AsyncStatusLazy = lazy(() => import('./AsyncStatus.lazy'));
export function AsyncStatus({ restaurantId }: Props) {
  return (
    <Suspense fallback={<Spinner />}>
      <AsyncStatusLazy restaurantId={restaurantId} />
    </Suspense>
  );
}

// AsyncStatus.lazy.tsx (separate chunk)
function AsyncStatusComponent({ restaurantId }: Props) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/status`).then(setStatus);
  }, [restaurantId]);
  return <StatusBadge status={status} />;
}
```

**RSC Version**:
```typescript
// Server component (async function, no hooks allowed)
async function AsyncStatus({ restaurantId }: Props) {
  const status = await getReactOnRailsAsyncProp('status', { restaurantId });
  return <StatusBadge status={status} />;
}
```

Key difference: Traditional fetches client-side, RSC fetches server-side.

## Web Vitals Targets

### Traditional (Optimized Lazy-Loading)
| Metric | Target |
|--------|--------|
| LCP | 500-600ms |
| CLS | 0.10-0.15 |
| INP | 80-100ms |

### RSC (Server-Side Fetch + Streaming)
| Metric | Target |
|--------|--------|
| LCP | 200-250ms |
| CLS | 0.02 |
| INP | 50-60ms |

## Database Schema

```
restaurants (50K)         - Root entity
hours (400K)             - Regular opening hours
special_hours (150K)     - Holidays/exceptions
reviews (2M)             - Customer ratings
menu_items (500K)        - Menu
orders (10M)             - **CRITICAL for 100-150ms latency**
order_lines (50M)        - Order line items
promotions (100K)        - Active discounts
```

**Critical Index**: `(restaurant_id, created_at)` on orders table for wait_time queries.

## API Endpoints (Shared)

All return JSON with `timestamp`.

- `GET /api/restaurants/:id/status` → { status } (20-30ms)
- `GET /api/restaurants/:id/wait_time` → { wait_time } (100-150ms) **[CRITICAL]**
- `GET /api/restaurants/:id/specials` → { promotions } (30-50ms)
- `GET /api/restaurants/:id/trending` → { items } (50-100ms)
- `GET /api/restaurants/:id/rating` → { average_rating, review_count } (20-40ms)

## Local Development

```bash
# Setup
bundle install && pnpm install
rails db:create db:migrate db:seed

# Run
rails server              # Port 3000
./bin/webpack-dev-server  # Port 8080

# Visit
http://localhost:3000/search      # Traditional
http://localhost:3000/search/rsc  # RSC
http://localhost:3000/dashboard   # Metrics
```

**Verify latency** (must be 100-150ms):
```bash
time curl http://localhost:3000/api/restaurants/1/wait_time
```

## Deployment

See Task 5 for full deployment guide (Docker, Heroku).

## Project Structure

```
app/
├── models/
│   ├── restaurant.rb          # Core domain model
│   ├── order.rb               # For wait_time calculations
│   └── ...
├── controllers/
│   ├── api/restaurants_controller.rb  # 5 API endpoints
│   └── dashboard_controller.rb
├── views/
│   └── restaurants/
│       ├── search.html.erb       # Traditional view
│       └── search_rsc.html.erb   # RSC view
└── javascript/
    ├── components/
    │   ├── restaurant/           # Display components (shared)
    │   ├── async/
    │   │   ├── traditional/      # Traditional async components
    │   │   └── rsc/              # RSC async components
    │   └── Dashboard.tsx
    └── entries/
        ├── search.tsx            # Traditional webpack entry
        └── search_rsc.tsx        # RSC webpack entry
config/
├── webpack/
│   ├── webpack.config.js     # Traditional
│   └── webpack.rsc.js        # RSC with loader
└── initializers/react_on_rails.rb
db/
├── migrate/
├── seeds.rb                  # Seeds 62M records
└── seed_scripts/
spec/ or test/               # RSpec, Jest, Playwright
```

## Technology Stack

- **Backend**: Rails 7.x, Ruby 3.2+, PostgreSQL 14+
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Bundling**: Webpack 5 (traditional), Webpack 5 + RSC loader (RSC)
- **Testing**: RSpec, Jest, Playwright
- **Monitoring**: Web Vitals API

## Key Files to Study

1. `IMPLEMENTATION_TASKS.md` - What to build and specifications
2. `tasks/Task_1_Setup_and_Database.md` - Database design details
3. `tasks/Task_2_Shared_Components_and_API.md` - Component patterns
4. `tasks/Task_3_Traditional_Version.md` - Traditional pattern examples
5. `tasks/Task_4_RSC_Version.md` - RSC pattern examples
6. `tasks/Task_5_Dashboard_and_Docs.md` - Dashboard & deployment

## Demo Walkthrough (for presenting to customers)

1. **Show problem**: `/search` with spinners loading, LCP ~500ms, CLS ~0.12
2. **Show solution**: `/search/rsc` complete immediately, LCP ~200ms, CLS ~0.02
3. **Show metrics**: `/dashboard` - charts showing improvement
4. **Explain difference**: "Same database, same components, only data fetching timing"

See Task 5 for full walkthrough script.

## Critical Success Factors

**Task 1.4 (Data Seeding)**: Must achieve 100-150ms wait_time query latency
- Small database = demo fails (no visible advantage)
- Realistic latency = demo succeeds (59% improvement is real)

**Task 2**: Display components must be 100% pure (no hooks, no fetching)
- Ensures reuse between versions
- Forces correct architectural patterns

**Tasks 3&4**: Must show identical visual output despite different data fetching
- Proves RSC isn't "magic"—it's just better timing

## FAQ

**Q: Why 10M orders?**
A: Creates natural 100-150ms query latency. Without it, demo fails.

**Q: Why two webpack configs?**
A: RSC requires RSC loader and three-bundle strategy that traditional version doesn't need.

**Q: Can I modify query latency?**
A: No—that defeats the demo's purpose.

**Q: What about caching?**
A: Not implemented. Goal is proving RSC advantage without caching complexity.

**Q: Can I use different data?**
A: Yes, keep 10M orders. Change restaurant names/cuisines as desired.

## Related Resources

- React 19 Server Components: https://react.dev/blog/2024/12/19/react-19
- react-on-rails: https://github.com/shakacode/react_on_rails
- Web Vitals: https://web.dev/vitals/
- Streaming HTML: https://web.dev/rendering-on-the-web/

---

**Status**: Ready for implementation
**Next Step**: Read `IMPLEMENTATION_TASKS.md`, then start Task 1
