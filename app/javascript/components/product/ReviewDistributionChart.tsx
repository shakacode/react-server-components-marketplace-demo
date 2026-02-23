// No 'use client' — this is a server component in RSC.
// The SVG chart rendering stays server-side in the RSC bundle.

import React from 'react';
import { RatingDistribution } from '../../types/product';

interface Props {
  distribution: RatingDistribution[];
  averageRating: number;
  totalReviews: number;
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function RatingBar({ stars, percentage, count }: RatingDistribution) {
  const barColor =
    stars >= 4 ? 'bg-green-500' :
    stars === 3 ? 'bg-yellow-400' :
    'bg-red-400';

  return (
    <div className="flex items-center gap-3 group">
      <div className="flex items-center gap-1 w-12 justify-end flex-shrink-0">
        <span className="text-sm font-medium text-gray-600 tabular-nums">{stars}</span>
        <StarIcon />
      </div>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
      <div className="w-24 text-right flex-shrink-0">
        <span className="text-sm text-gray-500 tabular-nums">
          {percentage.toFixed(0)}%
          <span className="text-gray-400 ml-1">({count.toLocaleString()})</span>
        </span>
      </div>
    </div>
  );
}

export function ReviewDistributionChart({ distribution, averageRating, totalReviews }: Props) {
  // Render full rating stars
  const fullStars = Math.floor(averageRating);
  const hasHalf = averageRating % 1 >= 0.25;

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <div className="flex items-start gap-8">
        {/* Left: Overall rating */}
        <div className="text-center flex-shrink-0">
          <div className="text-5xl font-bold text-gray-900 tabular-nums">{averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= fullStars ? 'text-amber-400' : (star === fullStars + 1 && hasHalf) ? 'text-amber-200' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">{totalReviews.toLocaleString()} reviews</div>
        </div>

        {/* Right: Distribution bars */}
        <div className="flex-1 space-y-2">
          {distribution.map((item) => (
            <RatingBar key={item.stars} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
