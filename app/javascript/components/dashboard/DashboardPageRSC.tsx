// No 'use client' — this is a server component (RSC bundle).
//
// V3: RSC Streaming — Shell streams immediately, each data section streams independently.
//
// ALL libraries stay SERVER-SIDE (zero shipped to browser):
//   - d3-scale, d3-shape, d3-array, d3-time-format (~80KB) — chart rendering
//   - d3-format (~5KB) — number formatting
//   - date-fns (~30KB) — date formatting in orders table
//   - All chart components — RevenueChart, OrderStatusChart, HourlyChart, TopMenuItemsChart
//   - RecentOrdersTable, StatCards — all render server-side
//
// ZERO client components — no "use client" imports means no charting/d3/date-fns JS
// shipped to the browser at all. The entire page is pure server-rendered HTML + SVG.
//
// Total JS savings: ~115KB+ eliminated from client bundle.
// Plus: streaming means shell appears in <50ms instead of waiting for ALL queries.

import React, { Suspense } from 'react';
import type { DashboardRestaurant } from '../../types/dashboard';
import DashboardHeader from './DashboardHeader';
import AsyncKpiStatsRSC from './AsyncKpiStatsRSC';
import AsyncRevenueChartRSC from './AsyncRevenueChartRSC';
import AsyncOrderStatusRSC from './AsyncOrderStatusRSC';
import AsyncHourlyChartRSC from './AsyncHourlyChartRSC';
import AsyncRecentOrdersRSC from './AsyncRecentOrdersRSC';
import AsyncTopItemsRSC from './AsyncTopItemsRSC';
import { StatCardsSkeleton, ChartSkeleton, TableSkeleton, TopItemsSkeleton } from './DashboardSkeletons';

interface Props {
  restaurant: DashboardRestaurant;
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default function DashboardPageRSC({ restaurant, getReactOnRailsAsyncProp }: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Version indicator */}
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-6">
          V3: RSC Streaming — d3 charting + date-fns stay server-side, 0KB to client. Each section streams independently as its query completes.
        </p>

        {/* Header — renders IMMEDIATELY (no data dependencies) */}
        <DashboardHeader restaurant={restaurant} />

        {/* KPI Stats — streams first (simple aggregation queries) */}
        <div className="mb-6">
          <Suspense fallback={<StatCardsSkeleton />}>
            <AsyncKpiStatsRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
        </div>

        {/* Revenue Chart — streams as time-series aggregation completes */}
        <div className="mb-6">
          <Suspense fallback={<ChartSkeleton title="Loading revenue chart..." />}>
            <AsyncRevenueChartRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
        </div>

        {/* Two-column: Order Status + Hourly Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Suspense fallback={<ChartSkeleton title="Loading status chart..." height="h-60" />}>
            <AsyncOrderStatusRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton title="Loading hourly chart..." height="h-60" />}>
            <AsyncHourlyChartRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
        </div>

        {/* Recent Orders Table — streams with date-fns formatting server-side */}
        <div className="mb-6">
          <Suspense fallback={<TableSkeleton />}>
            <AsyncRecentOrdersRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
        </div>

        {/* Top Menu Items — streams last (heaviest JOIN query) */}
        <div className="mb-6">
          <Suspense fallback={<TopItemsSkeleton />}>
            <AsyncTopItemsRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
