export interface SearchProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  brand: string;
  sku: string;
  images: { url: string; alt: string; position: number }[];
  features: string[];
  tags: string[];
  average_rating: number;
  review_count: number;
  in_stock: boolean;
  stock_quantity: number;
  discount_percentage: number | null;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface PriceRange {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface RatingCount {
  stars: number;
  count: number;
}

export interface Facets {
  categories: [string, number][];
  brands: [string, number][];
  price_ranges: PriceRange[];
  rating_distribution: RatingCount[];
  in_stock_count: number;
  out_of_stock_count: number;
  total_count: number;
}

export interface SearchMeta {
  query: string;
  sort: string;
  total_results: number;
  filters_applied?: { type: string; value: string }[];
}

export interface ReviewSnippet {
  title: string;
  rating: number;
  reviewer_name: string;
  comment: string;
  helpful_count: number;
}

export interface SearchParams {
  q?: string;
  category?: string;
  brand?: string;
  min_rating?: string;
  in_stock?: string;
  price_min?: string;
  price_max?: string;
  sort?: string;
  page?: string;
}
