// Server-only async component — streams top menu items chart
// d3 format + scale stays server-side → 0KB to client
import React from 'react';
import TopMenuItemsChart from './TopMenuItemsChart';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncTopItemsRSC({ getReactOnRailsAsyncProp }: Props) {
  const { items } = await getReactOnRailsAsyncProp('top_items');
  return <TopMenuItemsChart items={items} />;
}
