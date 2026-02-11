'use client';

import React, { useState, useEffect } from 'react';
import { Promotion, MenuItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import { WaitTimeBadge } from './WaitTimeBadge';
import { SpecialsList } from './SpecialsList';
import { TrendingItems } from './TrendingItems';

interface Props {
  restaurantId: number;
}

export default function AsyncRestaurantWidgets({ restaurantId }: Props) {
  const [status, setStatus] = useState<{ status: 'open' | 'closed' | 'custom_hours' } | null>(null);
  const [waitTime, setWaitTime] = useState<{ wait_time: number } | null>(null);
  const [specials, setSpecials] = useState<{ promotions: Promotion[] } | null>(null);
  const [trending, setTrending] = useState<{ items: MenuItem[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const opts = { signal: controller.signal };

    fetch(`/api/restaurants/${restaurantId}/status`, opts)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
    fetch(`/api/restaurants/${restaurantId}/wait_time`, opts)
      .then((r) => r.json())
      .then(setWaitTime)
      .catch(() => {});
    fetch(`/api/restaurants/${restaurantId}/specials`, opts)
      .then((r) => r.json())
      .then(setSpecials)
      .catch(() => {});
    fetch(`/api/restaurants/${restaurantId}/trending`, opts)
      .then((r) => r.json())
      .then(setTrending)
      .catch(() => {});

    return () => controller.abort();
  }, [restaurantId]);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-3">
        {status && <StatusBadge status={status.status} />}
        {waitTime && <WaitTimeBadge minutes={waitTime.wait_time} />}
      </div>
      {specials && <SpecialsList promotions={specials.promotions} />}
      {trending && <TrendingItems items={trending.items} />}
    </div>
  );
}
