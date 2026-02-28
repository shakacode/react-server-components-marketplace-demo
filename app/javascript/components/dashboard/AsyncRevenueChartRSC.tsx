// Server-only async component — streams revenue chart
// d3 (scale, shape, array, time-format) renders server-side → 0KB to client
import React from 'react';
import RevenueChart from './RevenueChart';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncRevenueChartRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('revenue_data');
  return <RevenueChart data={data} />;
}
