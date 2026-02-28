// No 'use client' — this is a server component in RSC.
// date-fns (~30KB) stays server-side in the RSC bundle.

import React from 'react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ProductReview } from '../../types/product';
import { StarRating } from './ProductInfo';

interface Props {
  review: ProductReview;
}

export function ReviewCard({ review }: Props) {
  const reviewDate = parseISO(review.created_at);
  const relativeTime = formatDistanceToNow(reviewDate, { addSuffix: true });
  const absoluteDate = format(reviewDate, 'MMMM d, yyyy');

  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Rating stars */}
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} size="sm" />
            {review.verified_purchase && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verified Purchase
              </span>
            )}
          </div>

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
          )}

          {/* Comment */}
          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>

          {/* Reviewer info */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {review.reviewer_name.charAt(0)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">{review.reviewer_name}</span>
              <span title={absoluteDate}>{relativeTime}</span>
            </div>
          </div>
        </div>

        {/* Helpful count */}
        {review.helpful_count > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.038 4.418 9.75 5.25 9.75h.904" />
            </svg>
            <span className="tabular-nums">{review.helpful_count}</span>
          </div>
        )}
      </div>
    </div>
  );
}
