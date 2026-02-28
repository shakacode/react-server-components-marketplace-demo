// No 'use client' — this is a server component in RSC.
// ReviewCard imports date-fns, which stays server-side.

import React from 'react';
import { ProductReview } from '../../types/product';
import { ReviewCard } from './ReviewCard';

interface Props {
  reviews: ProductReview[];
}

export function ReviewsList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Reviews</h3>
        <span className="text-sm text-gray-500">Sorted by most helpful</span>
      </div>
      <div className="divide-y divide-gray-100">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
