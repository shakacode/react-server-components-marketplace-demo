'use client';

// V1: Full Server SSR — ALL data fetched on server, entire page rendered at once.
// All queries must complete before ANY HTML is sent to the browser.
//
// Libraries shipped to client (for hydration):
//   - d3-scale, d3-shape, d3-array, d3-time-format (~80KB)
//   - d3-format (~5KB)
//   - date-fns (~30KB)
//   - All chart + table component code
//
// Total extra JS: ~115KB+ sent to client for hydration.

import React from 'react';
import type {
  DashboardRestaurant,
  KpiStats,
  RevenueDataPoint,
  OrderStatusItem,
  RecentOrder,
  TopMenuItem,
  HourlyDataPoint,
} from '../../types/dashboard';
import DashboardHeader from './DashboardHeader';
import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import OrderStatusChart from './OrderStatusChart';
import HourlyChart from './HourlyChart';
import RecentOrdersTable from './RecentOrdersTable';
import TopMenuItemsChart from './TopMenuItemsChart';
import { INPOverlay } from '../blog/INPOverlay';

interface Props {
  restaurant: DashboardRestaurant;
  kpi_stats: KpiStats;
  revenue_data: RevenueDataPoint[];
  order_status: OrderStatusItem[];
  recent_orders: RecentOrder[];
  top_items: TopMenuItem[];
  hourly_data: HourlyDataPoint[];
}

export default function DashboardPageSSR({
  restaurant,
  kpi_stats,
  revenue_data,
  order_status,
  recent_orders,
  top_items,
  hourly_data,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Version indicator */}
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
          V1: Full SSR — All data fetched server-side before any HTML is sent. d3 + date-fns shipped to client for hydration (~115KB).
        </p>

        <DashboardHeader restaurant={restaurant} />

        <div className="mb-6">
          <StatCards stats={kpi_stats} />
        </div>

        <div className="mb-6">
          <RevenueChart data={revenue_data} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <OrderStatusChart data={order_status} />
          <HourlyChart data={hourly_data} />
        </div>

        <div className="mb-6">
          <RecentOrdersTable orders={recent_orders} />
        </div>

        <div className="mb-6">
          <TopMenuItemsChart items={top_items} />
        </div>

        <INPOverlay />
      </div>
    </div>
  );
}
