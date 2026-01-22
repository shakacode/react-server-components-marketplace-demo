import React from 'react';
import { Restaurant } from '../../types';

interface Props {
  restaurants: Restaurant[];
  children: (restaurant: Restaurant) => React.ReactNode;
}

export function RestaurantGrid({ restaurants, children }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map(restaurant => (
        <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-6">
          {children(restaurant)}
        </div>
      ))}
    </div>
  );
}
