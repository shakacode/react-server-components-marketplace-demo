import React from 'react';
import { Product } from '../../types/product';

interface Props {
  product: Product;
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg className="w-5 h-5" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
        <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return (
    <svg className={`w-5 h-5 ${filled ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<StarIcon key={i} filled />);
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.25) {
      stars.push(<StarIcon key={i} filled={false} half />);
    } else {
      stars.push(<StarIcon key={i} filled={false} />);
    }
  }
  return (
    <div className={`flex items-center ${size === 'sm' ? 'gap-0.5 [&_svg]:w-4 [&_svg]:h-4' : 'gap-0.5'}`}>
      {stars}
    </div>
  );
}

export function ProductInfo({ product }: Props) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="hover:text-gray-700 cursor-pointer">Home</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="hover:text-gray-700 cursor-pointer">{product.category}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{product.brand}</span>
      </nav>

      {/* Brand */}
      <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide">{product.brand}</p>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

      {/* Rating summary */}
      <div className="flex items-center gap-3">
        <StarRating rating={product.average_rating} />
        <span className="text-sm font-semibold text-gray-900">{product.average_rating.toFixed(1)}</span>
        <span className="text-sm text-gray-500">({product.review_count.toLocaleString()} reviews)</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
        {product.original_price && (
          <>
            <span className="text-lg text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
            <span className="px-2.5 py-0.5 text-sm font-semibold text-red-700 bg-red-50 rounded-lg">
              {product.discount_percentage}% OFF
            </span>
          </>
        )}
      </div>

      {/* SKU */}
      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
    </div>
  );
}
