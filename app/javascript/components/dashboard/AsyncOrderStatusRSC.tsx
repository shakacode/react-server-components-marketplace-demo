// Server-only async component — streams order status donut chart
import React from 'react';
import OrderStatusChart from './OrderStatusChart';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncOrderStatusRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('order_status');
  return <OrderStatusChart data={data} />;
}
