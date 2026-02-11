// No "use client" — this is a server component (RSC bundle)

import React, { Suspense } from 'react';
import { Restaurant } from '../../types';
import { RestaurantCardHeader } from '../restaurant/RestaurantCardHeader';
import { RestaurantCardFooter } from '../restaurant/RestaurantCardFooter';
import { CardWidgetsSkeleton } from '../shared/CardWidgetsSkeleton';
import AsyncRestaurantWidgetsRSC from '../restaurant/AsyncRestaurantWidgetsRSC';

interface Props {
  restaurants: Restaurant[];
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function SearchPageRSC({ restaurants, getReactOnRailsAsyncProp }: Props) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Restaurant Search</h1>
      <p className="text-sm text-gray-500 mb-6">V3: RSC Streaming — Data streamed from server as each piece resolves</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-4">
            <RestaurantCardHeader restaurant={restaurant} />

            <Suspense fallback={<CardWidgetsSkeleton />}>
              <AsyncRestaurantWidgetsRSC
                restaurantId={restaurant.id}
                getReactOnRailsAsyncProp={getReactOnRailsAsyncProp}
              />
            </Suspense>

            <RestaurantCardFooter restaurant={restaurant} />
          </div>
        ))}
      </div>
    </div>
  );
}
