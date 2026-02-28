// No 'use client' — this is a server component (RSC bundle).
// ReviewDistributionChart rendering stays server-side.

import React from 'react';
import { ReviewDistributionChart } from './ReviewDistributionChart';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncReviewStatsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('review_stats');

  return (
    <ReviewDistributionChart
      distribution={data.distribution}
      averageRating={data.average_rating}
      totalReviews={data.total_reviews}
    />
  );
}
