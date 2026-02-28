'use client';

// SearchShell — client component that wraps all interactive elements.
// This is the ONLY client component in the RSC search page.
// Product result cards are rendered as server components (zero JS).

import React, { useState, useCallback } from 'react';
import { SearchInput } from './SearchInput';
import { SortBar } from './SortBar';
import { FilterSidebar, FilterSidebarSkeleton } from './FilterSidebar';
import { PaginationControls } from './PaginationControls';
import { ActiveFilterPills } from './ActiveFilterPills';
import type { Facets, Pagination } from './types';

interface SearchShellHeaderProps {
  initialQuery: string;
}

// Client-side search bar wrapper
export function SearchShellHeader({ initialQuery }: SearchShellHeaderProps) {
  const handleSearch = useCallback((query: string) => {
    // In a real app, this would update URL params
  }, []);

  return (
    <SearchInput initialQuery={initialQuery} onSearch={handleSearch} />
  );
}

interface SearchShellSortProps {
  currentSort: string;
  totalResults: number;
}

// Client-side sort bar wrapper
export function SearchShellSort({ currentSort, totalResults }: SearchShellSortProps) {
  const [sort, setSort] = useState(currentSort);

  return (
    <SortBar currentSort={sort} totalResults={totalResults} onSortChange={setSort} />
  );
}

interface SearchShellFiltersProps {
  facets: Facets;
}

// Client-side filter sidebar wrapper
export function SearchShellFilters({ facets }: SearchShellFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string | undefined>>({});

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    setActiveFilters(filters);
  }, []);

  return (
    <FilterSidebar
      facets={facets}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
    />
  );
}

interface SearchShellPaginationProps {
  pagination: Pagination;
}

// Client-side pagination wrapper
export function SearchShellPagination({ pagination }: SearchShellPaginationProps) {
  const handlePageChange = useCallback((page: number) => {
    // In a real app, this would update URL params
  }, []);

  return (
    <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
  );
}

interface AddToCartButtonProps {
  productId: number;
  inStock: boolean;
}

// Client-side Add to Cart button — the only interactive part of a product card in RSC.
// In RSC: only this tiny component hydrates, the rest of the card is pure HTML.
// In SSR: this hydrates along with the entire card and all its rendering logic.
export function AddToCartButton({ productId, inStock }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleClick = useCallback(() => {
    setAdded(true);
    // In a real app: dispatch to cart store / API call
    setTimeout(() => setAdded(false), 2000);
  }, []);

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full mt-3 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        added
          ? 'bg-green-600 text-white'
          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
      }`}
    >
      {added ? 'Added!' : 'Add to Cart'}
    </button>
  );
}
