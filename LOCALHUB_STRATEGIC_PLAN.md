# LocalHub: Strategic Implementation Plan
## Maximizing Code Sharing Between Traditional and RSC+Streaming Versions

**Document Purpose**: This strategic document outlines LocalHub's complete implementation with explicit attention to code reuse patterns. Tasks are ordered to minimize duplication and maximize shared code between the traditional (lazy-loading) and modern (RSC + streaming) versions.

**Key Principle**: Both versions share the same database, domain models, base UI components, and styling. Only the data fetching and rendering approaches differ.

---

## Executive Summary

LocalHub is a restaurant/vendor marketplace discovery platform designed to demonstrate how React Server Components (RSC) with streaming dramatically improve Web Vitals compared to traditional SSR + lazy-loading approaches.

### What Gets Built

**Two Parallel Versions**:
1. **Traditional Version**: SSR with client-side lazy-loading (current best practices)
   - Static shell rendered on server
   - Dynamic content lazy-loaded by client
   - Expected Web Vitals: LCP ~750ms, CLS ~0.25, PageSpeed ~42

2. **Modern Version**: RSC with streaming (React 19 + Rails integration)
   - Complete data fetched server-side in parallel
   - HTML streamed to browser with all data
   - Expected Web Vitals: LCP ~200ms, CLS ~0.02, PageSpeed ~92

**Comparison Interface**: Side-by-side demo showing metrics, network waterfall, performance differences

### Code Sharing Strategy

```
Shared (100%):         Database, Models, Styling, Base Components
Shared (70-80%):       Routes structure, API endpoints, Performance monitoring
Version-Specific:      Data fetching (2 completely different approaches)
Completely Different:  Component rendering logic
```

**Implementation Order** ensures that shared code is written once and reused:
1. Foundation (database, models) → used by both versions
2. UI components and styling → used by both versions
3. Routes and API structure → used by both versions
4. Performance monitoring infrastructure → used by both versions
5. Traditional version implementation → uses all above
6. Modern version implementation → uses all above except data fetching
7. Comparison interface → showcases metrics from both

---

## Part 1: Project Foundation

### What is LocalHub?

A marketplace discovery platform where users browse restaurants/vendors and see real-time operational information:
- Is the restaurant open right now?
- What's the current wait time?
- What active promotions/specials are available?
- What are trending items?
- What are recent customer ratings?

**Why This App?**
- Real-world use case that customers actually care about
- Public-facing, SEO-critical pages (appear in Google search)
- Mix of static data (restaurant info, menu) and dynamic data (wait times, specials)
- Realistic query complexity that creates natural 150-300ms latency
- Shows why lazy-loading breaks Web Vitals on these types of pages

**Target Audience**: Companies serving public-facing marketplace and discovery pages (e.g., restaurant platforms, vendor discovery, content aggregation sites)

---

## Part 2: Technical Stack & Architecture

### Technology Choices

```
Backend:
  - Rails 7.x+ (Ruby 3.2+)
  - PostgreSQL 14+
  - React on Rails gem

Frontend:
  - React 19
  - TypeScript
  - Tailwind CSS
  - Recharts (for performance charts)

DevOps:
  - Docker (containerization)
  - GitHub Actions (CI/CD)

Performance Monitoring:
  - Web Vitals library (LCP, CLS, INP, FID, TTFB)
  - Performance Observer API (network timings)
  - Custom metrics collection

Testing:
  - RSpec (backend)
  - Jest (frontend)
  - Playwright (E2E)
```

### Architecture Overview

Both versions share the same conceptual architecture, differing only in data fetching:

```
Request arrives at Rails router
  ↓
Controller action handles request
  ↓
[DIVERGENCE POINT]
  ├─ Traditional Version:
  │   ├─ Render static shell (100% SSR HTML, no data)
  │   ├─ Return HTML + JS bundle
  │   └─ Browser loads data via API endpoints (lazy-loading)
  │
  └─ Modern Version (RSC):
      ├─ Fetch all data in parallel (server-side)
      ├─ Render RSC components with data
      ├─ Stream HTML chunks to browser
      └─ Browser receives complete page
```

**Why This Architecture Maximizes Sharing**:
- Same API endpoints used by both (traditional via XMLHttpRequest, modern via RSC server functions)
- Same database queries (both versions run identical SQL)
- Same UI components (rendered differently, but same structure)
- Same styling and design

---

## Part 3: Database Design

### Data Volumes (Realistic for Production Scale)

```
restaurants:          50,000    # Like Popmenu, DoorDash scale
reviews:              2,000,000 # ~40 per restaurant average
orders:              10,000,000 # Historical data for trend analysis
menu_items:            500,000 # ~10 per restaurant average
order_lines:        50,000,000 # ~5 lines per order average
promotions:           100,000 # ~2 per restaurant average
special_hours:        150,000 # ~3 special dates per restaurant
```

### Core Tables & Purpose

**`restaurants`** (seed once, read often)
- Stores restaurant metadata, location, timezone
- Used by: Both versions for rendering restaurant card headers

**`hours`** (seed once, read often)
- Regular opening hours per day of week
- Used by: Both versions for "Is this restaurant open?" check

**`special_hours`** (seed once, read often)
- Holiday closures, event hours, emergency closures
- Used by: Both versions for current status determination

**`reviews`** (seed once, read often for aggregation)
- Customer reviews and ratings
- Used by: Both versions for rating display and avg rating calculation

**`orders`** (seed once, aggregate for queries) ⚠️ **CRITICAL**
- Historical order data (status, prep time, timestamps)
- Used by: Both versions for WAIT TIME calculation (most expensive query)
- Query requires scanning millions of rows for current hour aggregation

**`menu_items`** (seed once, read often)
- Menu for each restaurant with prep times
- Used by: Both versions for trending calculation

**`order_lines`** (seed once, reference for trending)
- Items in each order
- Used by: Both versions for trending/popular items analysis

**`promotions`** (seed and read often)
- Active specials and discounts
- Used by: Both versions for specials display

### Why This Database Design Proves Real Benefits

The **`orders` table with 10M rows** is the key:
- Querying wait time requires: `SELECT COUNT(*) WHERE restaurant_id = ? AND status = 'in_progress' AND created_at > NOW() - interval '30 minutes'`
- On 10M rows with proper indexing: **100-150ms query time**
- This is REAL work, not artificial delays
- Streaming shines here: Server performs this work while streaming other data

Without realistic volumes:
- Query would take 5ms (too fast, no visible advantage)
- RSC + streaming wouldn't show clear benefit
- Demo would look artificial

---

## Part 4: Implementation Strategy - Task Ordering

### Principle: Build Shared Code First

The order below ensures:
1. Foundation is built once, used by both versions
2. No code duplication between traditional and modern
3. Performance monitoring infrastructure is consistent
4. Database queries are identical (proves fair comparison)

---

## PHASE 1: SHARED FOUNDATION (Tasks 1-5)
## Build Database, Models, and Infrastructure Used by Both Versions

### Task 1.1: Database Setup & Migrations
**Purpose**: Create database schema used by BOTH versions

**What to build**:
- Rails migration files for all 8 tables
- Proper indexes for query performance
  - `(restaurant_id, day_of_week)` on hours
  - `(restaurant_id, created_at)` on reviews
  - `(restaurant_id, status, created_at)` on orders ← **CRITICAL** for wait time
  - `(restaurant_id, expires_at)` on promotions
  - `(restaurant_id, starts_at, ends_at)` on special_hours
- Foreign key constraints
- Timestamp columns (created_at, updated_at)

**Key Detail**: Ensure orders table has proper indexes to create ~150ms query latency

**Deliverable**: Migration files, schema.rb updated, ability to run `rake db:setup`

**Code Reuse**: ✅ Both versions use identical tables and indexes

---

### Task 1.2: Rails Models & Associations
**Purpose**: Define domain layer used by BOTH versions

**What to build**:
```ruby
class Restaurant < ApplicationRecord
  has_many :hours
  has_many :special_hours
  has_many :reviews
  has_many :orders
  has_many :menu_items
  has_many :promotions

  # Methods used by BOTH versions
  def current_status
    # Logic to check special_hours, then regular hours
  end

  def current_wait_time
    # Query orders table for wait calculation
  end

  def average_rating
    # Aggregate reviews
  end
end

class Hour < ApplicationRecord
  belongs_to :restaurant
end

class SpecialHour < ApplicationRecord
  belongs_to :restaurant
end

class Review < ApplicationRecord
  belongs_to :restaurant
end

class Order < ApplicationRecord
  belongs_to :restaurant
  has_many :order_lines
end

class MenuItem < ApplicationRecord
  belongs_to :restaurant
end

class OrderLine < ApplicationRecord
  belongs_to :order
  belongs_to :menu_item
end

class Promotion < ApplicationRecord
  belongs_to :restaurant
end
```

**Key Detail**: All query logic lives here (methods like `current_wait_time`, `current_status`). Both versions call these methods.

**Deliverable**: Model files with associations and query methods

**Code Reuse**: ✅ BOTH versions call the same methods, no duplication

---

### Task 1.3: Database Seeding Script
**Purpose**: Populate database with realistic data volumes used by BOTH versions

**What to build**:
```bash
# Script: db/seeds.rb (or rake task)

# 1. Create 50K restaurants
# 2. Create 150K special hours
# 3. Create 2M reviews (20-40 per restaurant)
# 4. Create 500K menu items (10 per restaurant average)
# 5. Create 10M orders (distributed across restaurants, last 6 months)
# 6. Create 50M order lines (5 per order average)
# 7. Create 100K promotions

# Timing strategy:
# - Sequential: 2-3 hours
# - Parallel: 45-60 minutes (parallel create for each type)
```

**Key Details**:
- Orders must be distributed across restaurants AND time ranges
- Wait time calculations need orders from last 30 minutes, today, last hour, etc.
- Must include enough orders in "in_progress" status at any given time

**Deliverable**: Seed script that runs from CLI, creates 53M+ records

**Code Reuse**: ✅ Same data used by both versions

---

### Task 1.4: Query Performance Verification
**Purpose**: Verify database queries hit 150-300ms latency target

**What to build**:
- Rails console scripts to test each query:
  1. Current status query: `~20-30ms`
  2. Wait time query: `~100-150ms` (most expensive)
  3. Trending status query: `~50-150ms`
  4. Active specials query: `~30-50ms`
  5. Average rating query: `~20-40ms`

- Run 20 restaurants in parallel: `~150-200ms total`

**Deliverable**: Verified query performance baseline

**Code Reuse**: ✅ Query methods verified once, used by both versions

---

### Task 1.5: Performance Metrics Infrastructure
**Purpose**: Set up metrics collection used by BOTH versions

**What to build**:
```typescript
// /app/javascript/utils/performanceMetrics.ts

export interface PerformanceMetrics {
  lcp: number | null;        // Largest Contentful Paint
  cls: number | null;        // Cumulative Layout Shift
  inp: number | null;        // Interaction to Next Paint
  fid: number | null;        // First Input Delay
  ttfb: number | null;       // Time to First Byte
  imageCount: number;        // Lazy-loaded images
  jsSize: number;            // JS bundle size
  networkWaterfall: Array;   // Fetch timing details
}

export function collectMetrics(): Promise<PerformanceMetrics> {
  // Use Web Vitals library
  // Use Performance Observer API
  // Return collected metrics
}

export function reportMetrics(metrics: PerformanceMetrics) {
  // Send to /api/metrics endpoint (shared by both versions)
  // Store for comparison dashboard
}
```

**What to build (Rails API)**:
```ruby
# POST /api/metrics
class Api::MetricsController < ApplicationController
  def create
    version_type = params[:version_type] # 'traditional' or 'modern'
    test_run = params[:test_run_id]

    Metric.create!(
      version_type: version_type,
      test_run_id: test_run,
      lcp: params[:lcp],
      cls: params[:cls],
      # ... other metrics
    )
  end
end
```

**Deliverable**: Metrics collection working in both versions

**Code Reuse**: ✅ Same metrics endpoint, same collection logic used by both

---

## PHASE 2: SHARED UI & STYLING (Tasks 6-8)
## Build React Components and Styles Used by Both Versions

### Task 2.1: Base React Components
**Purpose**: Create UI components used by BOTH versions

**What to build**:

1. **RestaurantCard Component**
   ```typescript
   interface Restaurant {
     id: number;
     name: string;
     cuisine: string;
     rating: number;
     // ... other fields
   }

   export function RestaurantCard({
     restaurant,
     // Two versions pass different data shape
     status?: RestaurantStatus,           // Traditional: from API
     statusPromise?: Promise<Status>,     // Modern: async from RSC
   }) {
     return (
       <div className="restaurant-card">
         {/* Static parts (same in both) */}
         <h3>{restaurant.name}</h3>
         <p>{restaurant.cuisine}</p>

         {/* Dynamic parts differ by version */}
         {status && <StatusBadge status={status} />}
         {statusPromise && <Suspense><AsyncStatus promise={statusPromise} /></Suspense>}
       </div>
     );
   }
   ```

2. **Search/Filter Interface**
   - Input fields for cuisine type
   - Location filters
   - Sorting options
   - Same UI for both versions

3. **Restaurant Detail Page**
   - Restaurant header (static)
   - Current status section (dynamic - differs by version)
   - Menu section (static)
   - Active specials section (dynamic - differs by version)
   - Reviews section (dynamic - differs by version)
   - Wait time badge (dynamic - differs by version)

4. **Shared Utility Components**
   - StatusBadge (Open/Closed)
   - WaitTimeBadge
   - RatingDisplay
   - PromotionTag
   - TrendingBadge

**Key Architecture Detail**:
```
RestaurantCard (shared UI)
  ├─ Static parts (name, cuisine, image) - same in both
  ├─ Dynamic part 1 (status)
  │   ├─ Traditional: setState from API response
  │   └─ Modern: Suspense boundary with RSC promise
  └─ Dynamic part 2 (wait time)
      ├─ Traditional: useState hook
      └─ Modern: Direct value from RSC
```

**Why This Works**: Base structure is identical. Dynamic content just has different SOURCE (API vs RSC data). Component gracefully handles both.

**Deliverable**: Component library with proper TypeScript types

**Code Reuse**: ✅ 95% of component code is identical between versions

---

### Task 2.2: Tailwind CSS Styling
**Purpose**: Create styles used by BOTH versions

**What to build**:
- `tailwind.config.js` configuration
- CSS utility classes for:
  - Layout (grid for restaurant cards)
  - Cards (border, shadow, hover effects)
  - Badges (colors for open/closed, wait times)
  - Typography
  - Responsive design (mobile-first)
  - Dark mode support (optional)

**Deliverable**: Complete styling system

**Code Reuse**: ✅ Identical styling in both versions

---

### Task 2.3: Design System & Brand Assets
**Purpose**: Professional appearance for both versions

**What to build**:
- Brand colors (primary, secondary, success, warning, error)
- Logo and icons
- Restaurant images/placeholders
- Responsive layout grid
- Mobile-first breakpoints

**Deliverable**: Design system document + asset files

**Code Reuse**: ✅ Same design used by both versions

---

## PHASE 3: SHARED ROUTES & API INFRASTRUCTURE (Tasks 9-11)
## Build API endpoints and Route structure Used by Both Versions

### Task 3.1: Routes and Controller Structure
**Purpose**: Define route hierarchy used by BOTH versions

**What to build**:

```ruby
# config/routes.rb

Rails.application.routes.draw do
  # SHARED by both versions
  root 'restaurants#search'

  get '/restaurants/search', to: 'restaurants#search'

  # API endpoints used by BOTH versions
  # (Traditional version calls these via XMLHttpRequest)
  # (Modern version calls these via server-side fetch in RSC)
  namespace :api do
    resources :restaurants, only: [:show] do
      member do
        get 'status'    # Current open/closed status
        get 'wait_time' # Current wait time
        get 'specials'  # Active promotions
        get 'trending'  # Trending items
        get 'rating'    # Average rating
      end
    end

    # Shared metrics endpoint
    post 'metrics', to: 'metrics#create'
  end
end
```

**Key Detail**: Same endpoints, but called differently:
- **Traditional**: Browser XMLHttpRequest to `/api/restaurants/:id/wait_time`
- **Modern**: Server-side fetch in RSC to `/api/restaurants/:id/wait_time`

**Deliverable**: Routes file with all endpoints

**Code Reuse**: ✅ Identical routes used by both

---

### Task 3.2: API Controller Actions (Shared Logic)
**Purpose**: Implement API endpoints with shared query logic

**What to build**:

```ruby
# app/controllers/api/restaurants_controller.rb

class Api::RestaurantsController < ApplicationController
  def status
    restaurant = Restaurant.find(params[:id])
    # This method is SHARED - both versions call it
    status = restaurant.current_status
    render json: {
      status: status.state,          # 'open', 'closed', 'closing_soon'
      reason: status.reason,
      updated_at: status.timestamp
    }
  end

  def wait_time
    restaurant = Restaurant.find(params[:id])
    # This method is SHARED - both versions call it
    wait = restaurant.current_wait_time
    render json: {
      minutes: wait.estimated_minutes,
      confidence: wait.confidence_level,
      orders_count: wait.in_progress_count
    }
  end

  # ... other endpoints (specials, trending, rating) all follow same pattern
end
```

**Key Architecture**:
- All business logic in models (`restaurant.current_status`, `restaurant.wait_time`)
- Controller just calls model methods and returns JSON
- **Both versions call identical controller actions**

**Deliverable**: API controller with all endpoints

**Code Reuse**: ✅ Identical API logic used by both

---

### Task 3.3: Request Middleware & Performance Tracking
**Purpose**: Track request performance used by BOTH versions

**What to build**:
```ruby
# app/middleware/request_timer.rb
class RequestTimer
  def initialize(app)
    @app = app
  end

  def call(env)
    start_time = Time.current
    status, headers, body = @app.call(env)
    end_time = Time.current

    duration = (end_time - start_time) * 1000 # ms
    Rails.logger.info "Request took: #{duration}ms"

    [status, headers, body]
  end
end
```

**Deliverable**: Middleware for request tracking

**Code Reuse**: ✅ Both versions benefit from timing data

---

## PHASE 4: SHARED TESTING INFRASTRUCTURE (Task 12)
## Set up tests used by BOTH versions

### Task 4.1: Model Tests (RSpec)
**Purpose**: Verify query logic used by BOTH versions

**What to build**:
- Test `Restaurant#current_status`
- Test `Restaurant#current_wait_time` with 10M orders
- Test `Restaurant#average_rating`
- Test all query methods

**Why It Matters**: If model tests pass, both versions use identical, tested logic

**Deliverable**: RSpec tests for all model methods

**Code Reuse**: ✅ Tests verify logic used by both versions

---

### Task 4.2: API Tests (RSpec)
**Purpose**: Verify API endpoints work correctly

**What to build**:
- Test `/api/restaurants/:id/status`
- Test `/api/restaurants/:id/wait_time`
- Test all API endpoints

**Why It Matters**: Both versions depend on these endpoints

**Deliverable**: API integration tests

**Code Reuse**: ✅ Tests verify endpoints used by both

---

### Task 4.3: Component Tests (Jest)
**Purpose**: Test React components used by BOTH versions

**What to build**:
- Test RestaurantCard component renders correctly
- Test filtering UI works
- Test all shared components

**Deliverable**: Jest tests for components

**Code Reuse**: ✅ Component tests verify code used by both

---

## PHASE 5: TRADITIONAL VERSION (Tasks 13-15)
## Lazy-Loading Implementation (This Version Only)

### Task 5.1: Traditional Search Controller
**Purpose**: Render static shell (no data)

**What to build**:
```ruby
# app/controllers/restaurants_controller.rb (traditional version)

class RestaurantsController < ApplicationController
  def search
    # Just render the page - NO DATA
    @cuisines = CUISINE_OPTIONS # Static data only

    # DON'T fetch restaurants here
    # DON'T fetch wait times here
    # Browser will lazy-load these

    render :search
  end
end
```

```erb
<!-- app/views/restaurants/search.html.erb -->

<div class="search-container">
  <!-- Search form (static) -->
  <%= search_form %>

  <!-- Restaurant grid with skeleton loaders -->
  <div class="restaurants-grid">
    <% 20.times do %>
      <div class="restaurant-card-skeleton">
        <!-- Skeleton UI - will be replaced by client JS -->
        <div class="skeleton-header"></div>
        <div class="skeleton-content"></div>
      </div>
    <% end %>
  </div>
</div>

<!-- Bundle is ~95KB after code splitting -->
<%= javascript_bundle_tag :traditional_bundle %>
```

**Key Detail**: Page returns immediately with skeleton loaders. Browser then lazy-loads data via API calls.

**Deliverable**: Controller and view for traditional version

**Code Reuse**: ⚠️ This version only (but uses shared API endpoints)

---

### Task 5.2: Traditional React Component (Lazy-Loading)
**Purpose**: Client-side data fetching and hydration

**What to build**:
```typescript
// app/javascript/components/TraditionalRestaurantSearch.tsx

import { useEffect, useState } from 'react';
import { RestaurantCard } from './RestaurantCard';

interface RestaurantData {
  id: number;
  name: string;
  // ... fields
  status?: { state: string };
  waitTime?: { minutes: number };
  // ... other dynamic data
}

export function TraditionalRestaurantSearch() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Step 1: Mount and hydrate
    // Step 2: Download JS bundle (95KB, includes lazy components)
    // Step 3: Fetch restaurant list
    async function fetchRestaurants() {
      const response = await fetch('/api/restaurants/search');
      const data = await response.json();
      setRestaurants(data);
      setLoading(false);
    }

    // This fires AFTER hydration, causing LCP delay
    fetchRestaurants();
  }, []);

  return (
    <div className="grid">
      {loading ? (
        <Skeleton /> // Skeleton UI while loading
      ) : (
        restaurants.map(restaurant => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            // Data from API, triggers lazy components
            status={restaurant.status}
            waitTime={restaurant.waitTime}
          />
        ))
      )}
    </div>
  );
}
```

**Timeline**:
1. Browser receives HTML (100ms)
2. Browser starts downloading JS (200ms total from start)
3. React hydrates (300ms total)
4. Lazy components mount (400ms total)
5. API request sent (450ms total)
6. Server queries DB (150ms latency) = 600ms total
7. Browser renders with CLS = 750ms total ❌

**Code Reuse**: ⚠️ This version only, but uses shared RestaurantCard component

---

### Task 5.3: Traditional Lazy-Loading Components
**Purpose**: Components that load data after initial hydration

**What to build**:
```typescript
// Lazy components that load only when mounted
const AsyncStatus = lazy(() => import('./AsyncStatus'));
const AsyncWaitTime = lazy(() => import('./AsyncWaitTime'));
const AsyncSpecials = lazy(() => import('./AsyncSpecials'));

// These components trigger API requests on mount
// Causing layout shift when data arrives
```

**Code Reuse**: ⚠️ This version only

---

## PHASE 6: MODERN VERSION (Tasks 16-18)
## React Server Components + Streaming Implementation

### Task 6.1: Modern Search Controller (RSC)
**Purpose**: Fetch all data server-side, stream response

**What to build**:
```ruby
# app/controllers/restaurants_controller.rb (modern version)

class RestaurantsController < ApplicationController
  def search
    # In modern version, we fetch all data server-side
    # and pass to RSC components
    @restaurants = fetch_restaurants_with_data

    # Streaming happens automatically with RSC
    render :search_modern
  end

  private

  def fetch_restaurants_with_data
    # This query fetches:
    # 1. Restaurant metadata (quick)
    # 2. Current status (server-side) (20-30ms)
    # 3. Wait times (server-side, expensive) (100-150ms)
    # 4. Specials (server-side) (30-50ms)
    # 5. Ratings (server-side) (20-40ms)
    # ALL IN PARALLEL = 150-200ms total

    restaurants = Restaurant.all.limit(20)

    restaurants.map do |r|
      {
        id: r.id,
        name: r.name,
        status: r.current_status,      # Fetched here, not on client
        wait_time: r.current_wait_time,  # Expensive query runs here
        specials: r.active_promotions,   # All on server
        rating: r.average_rating,        # All on server
      }
    end
  end
end
```

```erb
<!-- app/views/restaurants/search_modern.html.erb -->

<!-- RSC component - server renders with all data -->
<ServerRestaurantSearch restaurants={@restaurants} />
```

**Timeline**:
1. Browser requests page (0ms)
2. Server fetches all data in parallel (150ms)
3. Server renders RSC components (50ms)
4. Server streams HTML chunks (50ms)
5. Browser receives complete page (200ms) ✅
6. No lazy-loading, no CLS

**Code Reuse**: ✅ Uses shared API endpoints, models, query methods

---

### Task 6.2: RSC Components with Streaming
**Purpose**: Server-rendered components with streaming

**What to build**:
```typescript
// app/javascript/components/ServerRestaurantSearch.tsx
// This runs on the server

interface ServerRestaurantSearchProps {
  restaurants: Array<{
    id: number;
    name: string;
    status: any;
    waitTime: any;
    // ... all data already fetched
  }>;
}

export async function ServerRestaurantSearch({ restaurants }: ServerRestaurantSearchProps) {
  // This component runs on server with all data available
  // No useEffect, no useState needed

  return (
    <div className="grid">
      {restaurants.map(restaurant => (
        // Components receive complete data, not promises
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          status={restaurant.status}           // Already fetched
          waitTime={restaurant.waitTime}       // Already fetched
        />
      ))}
    </div>
  );
}
```

**Key Difference from Traditional**:
- No lazy loading
- All data fetched on server
- Components receive data directly, not via API
- Browser receives complete, hydrated HTML

**Code Reuse**: ✅ Uses same RestaurantCard component!

---

### Task 6.3: Streaming Transport Layer
**Purpose**: Send HTML chunks to browser as they're ready

**What to build**:
```ruby
# Configure Rails for streaming responses
# Set response headers for chunked transfer

def search_modern
  response.headers['Transfer-Encoding'] = 'chunked'
  response.headers['Content-Type'] = 'text/html; charset=utf-8'

  # Flush chunks as they're ready
  render :search_modern, streaming: true
end
```

**Deliverable**: Streaming infrastructure working

**Code Reuse**: ⚠️ Modern version only

---

## PHASE 7: COMPARISON INTERFACE (Task 19)
## Dashboard Showing Side-by-Side Performance Metrics

### Task 7.1: Metrics Collection Dashboard
**Purpose**: Display Web Vitals comparison between versions

**What to build**:

```typescript
// Component showing both versions' metrics
export function ComparisonDashboard() {
  return (
    <div className="comparison-grid">
      <div className="version-column">
        <h2>Traditional (Lazy-Loading)</h2>
        <MetricsCard metrics={traditionalMetrics} />
        <NetworkWaterfall data={traditionalNetwork} />
        <BundleSize size={95} />
      </div>

      <div className="version-column">
        <h2>Modern (RSC + Streaming)</h2>
        <MetricsCard metrics={modernMetrics} />
        <NetworkWaterfall data={modernNetwork} />
        <BundleSize size={25} />
      </div>
    </div>
  );
}

function MetricsCard({ metrics }) {
  return (
    <div className="metrics">
      <MetricRow label="LCP"
        traditional={metrics.traditional.lcp}
        modern={metrics.modern.lcp}
        improvement={(1 - metrics.modern.lcp/metrics.traditional.lcp)*100}
      />
      <MetricRow label="CLS"
        traditional={metrics.traditional.cls}
        modern={metrics.modern.cls}
        improvement={(1 - metrics.modern.cls/metrics.traditional.cls)*100}
      />
      <MetricRow label="INP"
        traditional={metrics.traditional.inp}
        modern={metrics.modern.inp}
      />
      <MetricRow label="Bundle Size"
        traditional="95 KB"
        modern="25 KB"
        improvement="74%"
      />
    </div>
  );
}
```

**Visual Elements**:
- Side-by-side metric cards
- Color coding (green for better, red for worse)
- Percentage improvement badges
- Network waterfall charts
- Bundle size breakdown

**Deliverable**: Comparison dashboard

**Code Reuse**: ✅ Uses shared metrics endpoint

---

## PHASE 8: DOCUMENTATION & POLISH (Task 20)

### Task 8.1: README and Setup Guide
### Task 8.2: Technical Deep-Dive Documentation
### Task 8.3: Visual Design Polish
### Task 8.4: Performance Testing Guide

---

## Complete Task Dependency Map

```
PHASE 1: SHARED FOUNDATION (Must Complete First)
├── Task 1.1: Database Migrations
├── Task 1.2: Rails Models & Associations
├── Task 1.3: Database Seeding Script
├── Task 1.4: Query Performance Verification
└── Task 1.5: Performance Metrics Infrastructure

  ↓ (Foundation required for all subsequent tasks)

PHASE 2: SHARED UI & STYLING (All Use Phase 1)
├── Task 2.1: Base React Components
├── Task 2.2: Tailwind CSS Styling
└── Task 2.3: Design System & Brand Assets

  ↓ (UI required for traditional and modern)

PHASE 3: SHARED ROUTES & API (All Use Phase 1)
├── Task 3.1: Routes and Controller Structure
├── Task 3.2: API Controller Actions
└── Task 3.3: Request Middleware

  ↓ (Routes/API required for both versions)

PHASE 4: SHARED TESTING (All Use Phases 1-3)
├── Task 4.1: Model Tests
├── Task 4.2: API Tests
└── Task 4.3: Component Tests

  ↓ (Tests validate shared code)

PHASE 5: TRADITIONAL VERSION (Uses Phases 1-4, independent from Phase 6)
├── Task 5.1: Traditional Search Controller
├── Task 5.2: Traditional React Component (Lazy-Loading)
└── Task 5.3: Lazy-Loading Components

PHASE 6: MODERN VERSION (Uses Phases 1-4, independent from Phase 5)
├── Task 6.1: Modern Search Controller (RSC)
├── Task 6.2: RSC Components with Streaming
└── Task 6.3: Streaming Transport Layer

  ↓ (Both versions complete)

PHASE 7: COMPARISON INTERFACE (Uses outputs from 5 & 6)
└── Task 7.1: Metrics Collection Dashboard

  ↓

PHASE 8: POLISH & DOCUMENTATION (Uses everything)
├── Task 8.1: README and Setup Guide
├── Task 8.2: Technical Deep-Dive Docs
├── Task 8.3: Visual Design Polish
└── Task 8.4: Performance Testing Guide
```

### Task Execution Parallelization

**While waiting for code to be written** (typical team workflow):
- Phase 1 → Must be sequential (foundation)
- Phase 2 and 3 → Can run in parallel (both use Phase 1)
- Phase 4 → Can run in parallel with 2 & 3
- Phase 5 and 6 → Can run in parallel (independent implementations)
- Phase 7 → Must wait for 5 & 6 complete
- Phase 8 → Can start after Phase 7 begins

---

## Code Reuse Summary

### 100% Shared
- ✅ Database schema and migrations
- ✅ Rails models and query methods
- ✅ API endpoints and controllers
- ✅ Database seed script
- ✅ Route structure
- ✅ React component structure (RestaurantCard, etc.)
- ✅ Tailwind styling
- ✅ Performance metrics collection
- ✅ RSpec tests for models and APIs
- ✅ Jest tests for components

### ~70% Shared
- ✅ React component templates (same JSX structure, different data sources)
- ✅ View files (same layout, different rendering approach)

### 0% Shared (Version-Specific)
- ❌ Data fetching approach (API calls vs server-side in RSC)
- ❌ Component hydration strategy (useState/useEffect vs RSC)
- ❌ Streaming implementation (Server-Sent Events vs Transfer-Encoding)

### Effort Reduction
By following this structure:
- **70% of code is reused** between versions
- **No duplicate business logic** (queries live in models once)
- **Identical tests** validate shared code
- **Single API layer** serves both versions
- **Traditional takes ~5-6 days** (React lazy-loading UI)
- **Modern takes ~3-4 days** (RSC adaptation)
- **Total without sharing: ~12-14 days**
- **Total with sharing: ~10-11 days** (only 1-2 days saved? NO!)
- **Shared foundation saves: ~3-4 days** (no duplicate setup)
- **Single test suite saves: ~1-2 days** (tests once, verify both)
- **Total actual effort: ~6-7 days** for both versions complete

---

## Critical Success Factors

### 1. Database Query Performance
- ❌ **FAIL**: Queries run in <50ms (no visible difference)
- ✅ **SUCCESS**: Queries run 100-200ms (streaming advantage clear)

**Verification**:
```bash
# Before starting implementation:
rails console
Restaurant.first.current_wait_time  # Must show ~100-150ms query time
```

### 2. Fair Comparison
- ❌ **FAIL**: Traditional version artificially slow
- ✅ **SUCCESS**: Traditional version uses best practices

**Verification**:
- Both versions use identical database queries
- Both versions use Code-split components
- Only difference: data fetching approach

### 3. No Code Duplication
- ❌ **FAIL**: Business logic duplicated in both versions
- ✅ **SUCCESS**: All business logic in models, called by both

**Verification**: grep for duplicate query logic across versions → should find zero

### 4. Real Latency, Not Artificial
- ❌ **FAIL**: Queries artificially slow with `sleep(100ms)`
- ✅ **SUCCESS**: Queries naturally slow due to volume

**Verification**: Query execution plans show actual work being done

---

## Success Metrics

**Traditional Version Should Show**:
- LCP: 700-800ms
- CLS: 0.20-0.30
- PageSpeed: 40-45
- Bundle: 95 KB
- Time to First Interaction: 600ms+

**Modern Version Should Show**:
- LCP: 150-250ms
- CLS: < 0.05
- PageSpeed: 90-95
- Bundle: 25 KB
- Time to First Interaction: 200ms

**Improvement**:
- LCP improvement: ~70%
- CLS improvement: ~80%
- PageSpeed improvement: ~110%
- Bundle reduction: ~74%

---

## File Structure

```
localhub-demo/
├── README.md
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── performance.yml
├── app/
│   ├── controllers/
│   │   ├── restaurants_controller.rb      [SHARED base, versions differ in action body]
│   │   └── api/
│   │       ├── restaurants_controller.rb  [SHARED]
│   │       └── metrics_controller.rb      [SHARED]
│   ├── models/
│   │   ├── restaurant.rb                  [SHARED]
│   │   ├── order.rb                       [SHARED]
│   │   ├── review.rb                      [SHARED]
│   │   └── ...
│   ├── views/
│   │   ├── restaurants/
│   │   │   ├── search.html.erb            [TRADITIONAL - lazy-load shell]
│   │   │   └── search_modern.html.erb     [MODERN - RSC]
│   │   └── layouts/
│   │       └── application.html.erb       [SHARED]
│   └── javascript/
│       ├── components/
│       │   ├── RestaurantCard.tsx         [SHARED UI component]
│       │   ├── TraditionalSearch.tsx      [TRADITIONAL only - lazy-load logic]
│       │   ├── ModernSearch.tsx           [MODERN only - RSC]
│       │   └── ComparisonDashboard.tsx    [SHARED - comparison UI]
│       └── utils/
│           ├── performanceMetrics.ts      [SHARED]
│           └── api.ts                     [SHARED]
├── db/
│   ├── migrate/
│   │   ├── 001_create_restaurants.rb      [SHARED]
│   │   ├── 002_create_orders.rb           [SHARED]
│   │   └── ...
│   └── seeds.rb                           [SHARED]
├── spec/
│   ├── models/
│   │   ├── restaurant_spec.rb             [SHARED - tests model methods]
│   │   └── order_spec.rb                  [SHARED]
│   └── requests/
│       └── api/restaurants_spec.rb        [SHARED - tests API endpoints]
├── package.json                           [SHARED]
├── tsconfig.json                          [SHARED]
└── tailwind.config.js                     [SHARED]
```

**Legend**:
- `[SHARED]` - Same file used by both versions
- `[TRADITIONAL only]` - Only traditional version
- `[MODERN only]` - Only modern version
- `[SHARED base, versions differ]` - Same file but different logic per version

---

## Next Steps

1. **Get Approval**: Review this strategic plan with team
2. **Create GitHub Issues**: Break into granular tasks (one per GitHub issue)
3. **Assign Ownership**: Assign tasks to team members
4. **Begin Phase 1**: Start with database foundation
5. **Track Progress**: Monitor task completion and code reuse

---

## Questions This Plan Answers

**Q: How do we avoid duplicating code?**
A: All shared code (models, APIs, components) is written once in Phase 1-4. Both versions consume this shared code.

**Q: What's different between versions?**
A: Only the data fetching approach differs:
- Traditional: Client fetches via API after hydration
- Modern: Server fetches before rendering, streams response

**Q: How do we ensure fair comparison?**
A: Both versions use identical databases, queries, and components. The only difference is architectural timing.

**Q: What if the queries don't take 100-200ms?**
A: We can add indexes or adjust data volumes. The goal is realistic latency that proves streaming benefits.

**Q: When should we start on Phases 5 & 6?**
A: Only after Phase 4 is complete. Both versions depend on shared foundation.

**Q: Can traditional and modern be built in parallel?**
A: Yes! Phase 5 and 6 are completely independent and can use the same developer resources simultaneously.

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Queries too fast (<50ms) | Demo doesn't show benefit | Use realistic data volumes, verify latency before starting |
| Code duplication | Increased maintenance | Architecture review before Phase 5 & 6 begin |
| Streaming not visible | Looks like normal response | Use network tab demo, console.time() logging |
| Traditional version artifically slow | Unfair comparison | Use modern best practices, same queries |
| Database seeding takes too long | Timeline slip | Parallelize inserts, use bulk loading |
| RSC bugs | Phase 6 blocked | Reference existing react_on_rails RSC implementation |

---

## Final Checklist Before Implementation

- [ ] Database design reviewed (query performance targets confirmed)
- [ ] Task breakdown reviewed (no duplicate work identified)
- [ ] Team understands code sharing strategy
- [ ] Success metrics agreed upon
- [ ] Testing strategy approved
- [ ] Timeline expectations set

---

**Document Version**: 1.0
**Last Updated**: December 19, 2024
**Status**: Ready for Implementation Planning

This document is comprehensive enough to be referenced throughout development and detailed enough to serve as the master specification for both versions.
