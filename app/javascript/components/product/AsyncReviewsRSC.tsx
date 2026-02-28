// No 'use client' — this is a server component (RSC bundle).
// date-fns (~30KB) used in ReviewCard stays server-side.

import React from 'react';
import { ReviewsList } from './ReviewsList';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncReviewsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('reviews');

  return <ReviewsList reviews={data.reviews} />;
}
