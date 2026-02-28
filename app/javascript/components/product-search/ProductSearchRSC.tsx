// No 'use client' — this is a server component (RSC bundle).
//
// V3: RSC Streaming — Search shell with input streams immediately.
// Results (with review snippets merged) and facets stream progressively.
//
// Only 2 streaming emits (reduced from 3):
//   1. search_results (products + review_snippets + pagination + meta)
//   2. facets (category/brand/price/rating aggregations)
//
// Libraries that stay SERVER-SIDE (never shipped to browser):
//   - marked + highlight.js (~350KB) — used to render description markdown
//   - SearchResultCard rendering logic — all stays server-side
//   - Star rating computation, price formatting, feature lists
//
// Only shipped to client (interactive wrappers):
//   - SearchShellHeader (~2KB) — search bar
//   - SearchShellFilters (~4KB) — filter sidebar
//   - SearchShellSort (~1KB) — sort dropdown
//   - SearchShellPagination (~2KB) — page navigation
//   - INPOverlay (~2KB) — performance monitoring
//
// Total JS savings: ~400KB+ eliminated from client bundle.
// Result cards (the heaviest content) are pure HTML — zero hydration cost.

import React, { Suspense } from 'react';
import type { SearchParams } from './types';
import { SearchShellHeader } from './SearchShell';
import { INPOverlay } from '../blog/INPOverlay';
import AsyncSearchResultsRSC from './AsyncSearchResultsRSC';
import AsyncFacetsRSC from './AsyncFacetsRSC';
import { ResultsGridSkeleton } from './SearchSkeletons';
import { FilterSidebarSkeleton } from './FilterSidebar';

interface Props {
  search_params: SearchParams;
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default function ProductSearchRSC({ search_params, getReactOnRailsAsyncProp }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — streams immediately with search input */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Product Search</h1>
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              V3: RSC Streaming — Result cards rendered server-side (0KB JS). Only filters + search are interactive.
            </p>
          </div>
          <SearchShellHeader initialQuery={search_params.q || ''} />
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar — facets stream from server */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[140px]">
              <Suspense fallback={<FilterSidebarSkeleton />}>
                <AsyncFacetsRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
              </Suspense>
            </div>
          </div>

          {/* Results area — product cards stream as server-rendered HTML */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<ResultsGridSkeleton />}>
              <AsyncSearchResultsRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
            </Suspense>
          </div>
        </div>
      </div>

      <INPOverlay />
    </div>
  );
}
