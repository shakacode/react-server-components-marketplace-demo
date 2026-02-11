'use client';

import React from 'react';
import loadable from '@loadable/component';
import { Restaurant } from '../../types';
import { RestaurantCardHeader } from '../restaurant/RestaurantCardHeader';
import { RestaurantCardFooter } from '../restaurant/RestaurantCardFooter';
import { CardWidgetsSkeleton } from '../shared/CardWidgetsSkeleton';

const AsyncRestaurantWidgets = loadable(
  () => import('../restaurant/AsyncRestaurantWidgets'),
  { fallback: <CardWidgetsSkeleton /> }
);

interface Props {
  restaurants: Restaurant[];
}

export default function SearchPageClient({ restaurants }: Props) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Restaurant Search</h1>
      <p className="text-sm text-gray-500 mb-6">V2: Client Components — Basic info SSRed, widgets fetched client-side</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-4">
            <RestaurantCardHeader restaurant={restaurant} />

            <AsyncRestaurantWidgets restaurantId={restaurant.id} />

            <RestaurantCardFooter restaurant={restaurant} />
          </div>
        ))}
      </div>
    </div>
  );
}
