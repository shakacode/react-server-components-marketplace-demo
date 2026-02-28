// Server component — dashboard header with restaurant info
import React from 'react';
import type { DashboardRestaurant } from '../../types/dashboard';

interface DashboardHeaderProps {
  restaurant: DashboardRestaurant;
}

export default function DashboardHeader({ restaurant }: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {restaurant.name} &middot; {restaurant.cuisine_type} &middot; {restaurant.city}, {restaurant.state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium">
            Last 30 days
          </span>
        </div>
      </div>
    </div>
  );
}
