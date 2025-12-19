# LocalHub: Simplified Implementation Tasks (5 Tasks)

**A demo app should be simple and focused. These 5 tasks cover everything needed.**

---

## Task 1: Setup & Database (8-12 hours)

**Goal**: Rails app, database schema, realistic data seeding

### Deliverables

**Rails Application**:
- Rails 7.1 with TypeScript, React 19, Tailwind CSS
- PostgreSQL 14+
- Pre-commit hooks (rubocop, eslint, prettier)

**Database Schema** (8 tables):
```
restaurants (50K)
├─ hours (400K)
├─ special_hours (150K)
├─ reviews (2M)
├─ menu_items (500K)
├─ promotions (100K)
└─ orders (10M) ← CRITICAL: Drives query latency
   └─ order_lines (50M)
```

**Data Seeding**:
- 50K restaurants
- 10M orders (MUST achieve 100-150ms query latency)
- All related data
- Must complete in <30 minutes
- Verify with: `rake db:seed:verify`

### Success Criteria

- [ ] `rails server` starts on port 3000
- [ ] Database has 62M+ records
- [ ] `restaurant.current_wait_time` takes 100-150ms
- [ ] `restaurant.current_status` takes 20-30ms
- [ ] All 4 concurrent queries take 150-200ms total

### Key Files

- `Gemfile` (with react-on-rails, rspec)
- `package.json` (React 19, TypeScript, Tailwind)
- `db/migrate/` (9 migrations)
- `db/seeds.rb` + seed scripts
- `app/models/` (Restaurant, Order, Review, MenuItem, etc.)

### Notes

- **Task 1.4 (Data Seeding) is CRITICAL** - Demo credibility depends on realistic query latency
- Without 10M orders, wait_time queries will be <50ms, and RSC advantage won't be visible
- Use `insert_all` for bulk inserts, not `create`
- Run `VACUUM ANALYZE` after seeding

---

## Task 2: Shared Components & API (12-16 hours)

**Goal**: Display components and API endpoints used by both versions

### Deliverables

**Display Components** (100% shared):
- `StatusBadge` - "Open", "Closed", "Custom Hours"
- `WaitTimeBadge` - "25 min wait"
- `SpecialsList` - Active promotions
- `RatingBadge` - "4.5 ⭐ (1,234 reviews)"
- `TrendingItems` - Top 3 popular items
- `RestaurantCardHeader` - Name, image, cuisine
- `RestaurantCardFooter` - Rating, distance
- Design system with Tailwind tokens

**API Endpoints** (100% shared):
- `GET /api/restaurants/:id/status` → "open" | "closed" | "custom_hours"
- `GET /api/restaurants/:id/wait_time` → wait time in minutes
- `GET /api/restaurants/:id/specials` → active promotions
- `GET /api/restaurants/:id/trending` → top 3 items
- `GET /api/restaurants/:id/rating` → average rating + count

**Routes**:
- `GET /search` → traditional version
- `GET /search/rsc` → RSC version
- All API endpoints under `/api/`

### Success Criteria

- [ ] All display components render correctly
- [ ] API endpoints return correct JSON
- [ ] Wait time API response: 100-150ms (proves realistic latency)
- [ ] All components TypeScript with full types
- [ ] Tailwind styling is polished (looks professional)

### Key Files

- `app/javascript/components/restaurant/` (display components)
- `app/javascript/components/search/` (static content)
- `app/controllers/api/restaurants_controller.rb`
- `config/routes.rb`
- `app/javascript/types/index.ts`

### Notes

- Display components take data as props only (no hooks, no state)
- All components are purely presentational
- API responses should include timing metadata for metrics collection

---

## Task 3: Traditional Version (10-14 hours)

**Goal**: SSR + lazy-loading implementation

### Deliverables

**Webpack Configuration**:
- Code-splitting for lazy() components
- Entry point: `app/javascript/entries/search.tsx`
- Output: `app/assets/webpack/traditional/`

**Lazy-Loaded Components**:
- `AsyncStatus` + `AsyncStatus.lazy.tsx` (separate chunk)
- `AsyncWaitTime` + `AsyncWaitTime.lazy.tsx` (separate chunk)
- `AsyncSpecials` + `AsyncSpecials.lazy.tsx` (separate chunk)
- `AsyncTrending` + `AsyncTrending.lazy.tsx` (separate chunk)
- `AsyncRating` + `AsyncRating.lazy.tsx` (separate chunk)

**Pattern**:
```typescript
// Wrapper (with Suspense)
const AsyncStatusLazy = lazy(() => import('./AsyncStatus.lazy'));
export function AsyncStatus({ restaurantId }: Props) {
  return (
    <Suspense fallback={<Spinner />}>
      <AsyncStatusLazy restaurantId={restaurantId} />
    </Suspense>
  );
}

// Lazy component (in separate chunk)
function AsyncStatusComponent({ restaurantId }: Props) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/status`)
      .then(r => r.json())
      .then(setStatus);
  }, [restaurantId]);
  return status ? <StatusBadge status={status} /> : null;
}
```

**View Template**:
```erb
<!-- app/views/restaurants/search.html.erb -->
<RestaurantCardHeader restaurant={<%= restaurant.to_json %>} />
<Suspense fallback={<Spinner />}>
  <AsyncStatus restaurantId={<%= restaurant.id %>} />
</Suspense>
<!-- etc -->
```

**Performance Monitoring**:
- Collect Web Vitals (LCP, CLS, INP)
- Measure: "Lazy Load Time" (mount to display)

### Success Criteria

- [ ] Static parts SSR completely
- [ ] Spinners show while loading
- [ ] Lazy components load in separate chunks
- [ ] API calls visible in DevTools Network
- [ ] Page fully loaded: ~500-600ms
- [ ] LCP: ~500-600ms
- [ ] CLS: ~0.10-0.15

### Key Files

- `config/webpack/webpack.config.js`
- `app/javascript/entries/search.tsx`
- `app/javascript/components/async/traditional/` (10 files)
- `app/views/restaurants/search.html.erb`
- `app/javascript/utils/performance/vitals.ts`

### Notes

- Both versions exist in same app, different routes/templates
- Same database, same API, same display components
- Only difference: data fetching approach (client vs server)

---

## Task 4: RSC Version (10-14 hours)

**Goal**: Server Components + streaming implementation

### Deliverables

**Webpack Configuration**:
- RSC loader for server components
- RSC webpack plugin for three bundles (RSC payload, server, client)
- Entry point: `app/javascript/entries/search_rsc.tsx`
- Output: `app/assets/webpack/rsc/`

**Async Server Components**:
- `AsyncStatus.tsx` (async function, server component)
- `AsyncWaitTime.tsx` (async function, server component)
- `AsyncSpecials.tsx` (async function, server component)
- `AsyncTrending.tsx` (async function, server component)
- `AsyncRating.tsx` (async function, server component)

**Pattern**:
```typescript
// Server component (async, no hooks)
async function AsyncStatus({ restaurantId }: Props) {
  const status = await getReactOnRailsAsyncProp('status', { restaurantId });
  return <StatusBadge status={status} />;
}
export default AsyncStatus;
```

**View Template**:
```erb
<!-- app/views/restaurants/search_rsc.html.erb -->
<RestaurantCardHeader restaurant={<%= restaurant.to_json %>} />
<Suspense fallback={<Spinner />}>
  <AsyncStatus restaurantId={<%= restaurant.id %>} />
</Suspense>
<!-- etc -->
```

**Performance Monitoring**:
- Collect Web Vitals (same as Traditional)
- Measure: "Stream Complete Time", "Server Fetch Time"

### Success Criteria

- [ ] All data fetched server-side (before rendering)
- [ ] HTML streamed to browser with Suspense boundaries
- [ ] Spinners resolved on server (no client-side spinners)
- [ ] API calls ONLY on server (no fetch() in components)
- [ ] Page fully loaded: ~200-250ms
- [ ] LCP: ~200-250ms
- [ ] CLS: ~0.02 (no layout shifts)
- [ ] 59% faster than Traditional (550ms → 225ms)

### Key Files

- `config/webpack/webpack.rsc.js`
- `app/javascript/entries/search_rsc.tsx`
- `app/javascript/components/async/rsc/` (5 files)
- `app/views/restaurants/search_rsc.html.erb`
- `config/initializers/react_on_rails.rb` (RSC enabled)

### Notes

- Server components can't use hooks, state, or context (RSC constraint)
- All data fetched via `getReactOnRailsAsyncProp` (provided by react-on-rails)
- Same display components as Traditional version
- Only difference from Traditional: where data is fetched

---

## Task 5: Comparison Dashboard & Documentation (6-10 hours)

**Goal**: Compare both versions and document the project

### Deliverables

**Comparison Dashboard**:
- Route: `/dashboard`
- Side-by-side metrics: Traditional vs RSC
- Charts: LCP over time, CLS distribution
- Network waterfall visualization
- Key stats: 59% LCP improvement, 83% CLS improvement

**Comparison View**:
- Route: `/comparison`
- Two iframes: Traditional + RSC
- Synchronized scrolling
- Real-time metrics overlay

**Documentation**:
- `README.md` - What is LocalHub, how to run it
- `DEPLOYMENT.md` - How to deploy
- `DEMO_WALKTHROUGH.md` - How to present it
- Inline code comments

### Success Criteria

- [ ] Dashboard accessible and metrics accurate
- [ ] Comparison view works smoothly
- [ ] Documentation is clear and complete
- [ ] Demo is ready to show to customers

### Key Files

- `app/javascript/components/ComparisonDashboard.tsx`
- `app/javascript/components/ComparisonView.tsx`
- `app/controllers/dashboard_controller.rb`
- `app/views/dashboard/index.html.erb`
- `README.md`, `DEPLOYMENT.md`, `DEMO_WALKTHROUGH.md`

### Notes

- Dashboard pulls metrics from both versions (collected during Tasks 3 & 4)
- Should highlight the 59% LCP improvement dramatically
- Comparison view is the "wow" moment for customers

---

## Timeline & Effort

| Task | Time | Notes |
|------|------|-------|
| 1. Setup & Database | 8-12h | **CRITICAL**: Data seeding determines demo credibility |
| 2. Shared Components & API | 12-16h | Used by both versions, done once |
| 3. Traditional Version | 10-14h | Can run parallel with Task 4 |
| 4. RSC Version | 10-14h | Can run parallel with Task 3 |
| 5. Dashboard & Docs | 6-10h | After 3 & 4 complete |
| **Total** | **46-66h** | **5-8 weeks with 1 developer** |

**With 2 developers**: 3-4 weeks (Task 3 & 4 in parallel)

---

## Dependency Chain

```
Task 1 (Setup & Database) [BLOCKING]
  ↓
Task 2 (Shared Components & API)
  ↓
[PARALLELIZATION POINT]
  ├─ Task 3 (Traditional)  [Can run in parallel]
  ├─ Task 4 (RSC)          [Can run in parallel]
  ↓
Task 5 (Dashboard & Docs)
```

---

## Critical Success Factor: Task 1.4 (Data Seeding)

**This is make-or-break for the demo.**

- If queries take <50ms: Demo fails (both versions look the same)
- If queries take 100-150ms: Demo succeeds (RSC advantage is dramatic)

**Verification**:
```bash
time rails db:seed
rake db:seed:verify
# Should show:
# Orders: 10,000,045 ✓
# current_wait_time: 142ms ✓
# All queries parallel: 178ms ✓
```

**If latency is wrong**:
- Add more orders? No, 10M is already a lot
- Check indexes? Yes, must be created
- Check queries? Yes, aggregation must be correct
- Check data distribution? Yes, orders spread across restaurants

---

## Code Sharing Breakdown

**How 82-85% code reuse happens**:

| Category | % of Code | Shared? | Notes |
|----------|-----------|---------|-------|
| Database, Models, API | 30% | 100% | Both versions use same data |
| Display Components | 20% | 100% | StatusBadge, etc. are pure components |
| Tailwind Styling | 15% | 100% | Same design system |
| Routes, Layouts | 10% | 100% | Both have /search and /search/rsc |
| Async Component Structure | 10% | 95% | Same pattern, different data source |
| Tests | 5% | 100% | Test both versions |
| Webpack Config | 5% | 0% | Completely different (trad vs RSC) |
| Data Fetching Logic | 5% | 0% | fetch() vs getReactOnRailsAsyncProp |

**Result**: ~82-85% code reuse

---

## Next Steps

1. **Review this plan** - Make sure 5 tasks make sense
2. **Assign developers** - Task 1 blocks everything; Tasks 3 & 4 can parallelize
3. **Start Task 1** - Database is critical path
4. **Monitor latency** - Verify Task 1.4 achieves 100-150ms queries
5. **Execute Tasks 2-5** in order

---

## Questions to Clarify

1. **Timeline**: 5-8 weeks acceptable?
2. **Team**: How many developers?
3. **Deployment**: Where should it run? (localhost, staging, production?)
4. **Customization**: Any specific restaurants to use for demo data?
5. **Metrics**: Any Web Vitals targets beyond 59% LCP improvement?

