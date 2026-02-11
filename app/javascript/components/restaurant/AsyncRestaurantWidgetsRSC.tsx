// No "use client" — this is a server component (RSC bundle)

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { WaitTimeBadge } from './WaitTimeBadge';
import { SpecialsList } from './SpecialsList';
import { TrendingItems } from './TrendingItems';

interface Props {
  restaurantId: number;
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncRestaurantWidgetsRSC({
  restaurantId,
  getReactOnRailsAsyncProp,
}: Props) {
  const data = await getReactOnRailsAsyncProp(`restaurant_${restaurantId}_widgets`);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={data.status} />
        <WaitTimeBadge minutes={data.wait_time} />
      </div>
      <SpecialsList promotions={data.specials} />
      <TrendingItems items={data.trending} />
    </div>
  );
}
