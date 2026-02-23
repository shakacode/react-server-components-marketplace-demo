// Server-only async component — streams recent orders table
// date-fns stays server-side → 30KB savings
import React from 'react';
import RecentOrdersTable from './RecentOrdersTable';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncRecentOrdersRSC({ getReactOnRailsAsyncProp }: Props) {
  const { orders } = await getReactOnRailsAsyncProp('recent_orders');
  return <RecentOrdersTable orders={orders} />;
}
