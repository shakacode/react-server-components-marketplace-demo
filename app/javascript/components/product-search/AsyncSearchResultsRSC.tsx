// No 'use client' — this is a server component that awaits streamed search results.
// The SearchResultCard components are rendered server-side as pure HTML.
// No JS is shipped for the product cards themselves.
// Only the AddToCartButton (client component) hydrates per card.

import React from 'react';
import type { SearchProduct, Pagination as PaginationType } from './types';
import { SearchResultCard } from './SearchResultCard';
import { SearchShellSort, SearchShellPagination } from './SearchShell';

interface SearchResultsData {
  products: SearchProduct[];
  pagination: PaginationType;
  meta: {
    query: string;
    sort: string;
    total_results: number;
  };
}

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncSearchResultsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data: SearchResultsData = await getReactOnRailsAsyncProp('search_results');
  const { products, pagination, meta } = data;

  return (
    <div>
      {/* Sort bar — client component wrapper (receives data, manages its own state) */}
      <SearchShellSort currentSort={meta.sort} totalResults={meta.total_results} />

      {products.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          {/* Product grid — ALL cards are server-rendered HTML, zero JS hydration cost.
              Only the AddToCartButton (client component) hydrates per card. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <SearchResultCard
                key={product.id}
                product={product}
                description={product.description}
              />
            ))}
          </div>

          {/* Pagination — client component wrapper */}
          <SearchShellPagination pagination={pagination} />
        </>
      )}
    </div>
  );
}
