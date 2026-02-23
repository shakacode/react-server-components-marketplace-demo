'use client';

// Client-side data fetcher — loads all dashboard data via API calls
// d3 + date-fns are loaded as part of this async chunk

import React, { useEffect, useState, useCallback } from 'react';
import type {
  DashboardRestaurant,
  KpiStats,
  RevenueDataPoint,
  OrderStatusItem,
  RecentOrder,
  TopMenuItem,
  HourlyDataPoint,
} from '../../types/dashboard';
import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import OrderStatusChart from './OrderStatusChart';
import HourlyChart from './HourlyChart';
import RecentOrdersTable from './RecentOrdersTable';
import TopMenuItemsChart from './TopMenuItemsChart';
import { StatCardsSkeleton, ChartSkeleton, TableSkeleton, TopItemsSkeleton } from './DashboardSkeletons';

interface Props {
  restaurant: DashboardRestaurant;
}

interface DashboardData {
  kpiStats: KpiStats | null;
  revenueData: RevenueDataPoint[] | null;
  orderStatus: OrderStatusItem[] | null;
  recentOrders: RecentOrder[] | null;
  topItems: TopMenuItem[] | null;
  hourlyData: HourlyDataPoint[] | null;
}

export default function AsyncDashboardContent({ restaurant }: Props) {
  const [data, setData] = useState<DashboardData>({
    kpiStats: null,
    revenueData: null,
    orderStatus: null,
    recentOrders: null,
    topItems: null,
    hourlyData: null,
  });

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const opts = { signal: controller.signal };
    const base = '/api/dashboard';

    // Fetch all data in parallel
    const [kpiRes, revenueRes, statusRes, ordersRes, itemsRes, hourlyRes] = await Promise.all([
      fetch(`${base}/kpi_stats`, opts),
      fetch(`${base}/revenue_data`, opts),
      fetch(`${base}/order_status`, opts),
      fetch(`${base}/recent_orders`, opts),
      fetch(`${base}/top_menu_items`, opts),
      fetch(`${base}/hourly_distribution`, opts),
    ]);

    const [kpi, revenue, status, orders, items, hourly] = await Promise.all([
      kpiRes.json(),
      revenueRes.json(),
      statusRes.json(),
      ordersRes.json(),
      itemsRes.json(),
      hourlyRes.json(),
    ]);

    setData({
      kpiStats: kpi.stats,
      revenueData: revenue.data,
      orderStatus: status.data,
      recentOrders: orders.orders,
      topItems: items.items,
      hourlyData: hourly.data,
    });

    return () => controller.abort();
  }, [restaurant.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {data.kpiStats ? <StatCards stats={data.kpiStats} /> : <StatCardsSkeleton />}

      {data.revenueData ? (
        <RevenueChart data={data.revenueData} />
      ) : (
        <ChartSkeleton title="Loading revenue chart..." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.orderStatus ? (
          <OrderStatusChart data={data.orderStatus} />
        ) : (
          <ChartSkeleton title="Loading status chart..." height="h-60" />
        )}
        {data.hourlyData ? (
          <HourlyChart data={data.hourlyData} />
        ) : (
          <ChartSkeleton title="Loading hourly chart..." height="h-60" />
        )}
      </div>

      {data.recentOrders ? <RecentOrdersTable orders={data.recentOrders} /> : <TableSkeleton />}

      {data.topItems ? <TopMenuItemsChart items={data.topItems} /> : <TopItemsSkeleton />}
    </div>
  );
}
