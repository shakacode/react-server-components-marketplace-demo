export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category: string;
  brand: string;
  sku: string;
  images: ProductImage[];
  specs: Record<string, string>;
  features: string[];
  average_rating: number;
  review_count: number;
  stock_quantity: number;
  in_stock: boolean;
  discount_percentage: number | null;
}

export interface ProductReview {
  id: number;
  rating: number;
  title: string;
  comment: string;
  reviewer_name: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  distribution: RatingDistribution[];
}

export interface ProductCard {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  category: string;
  brand: string;
  images: ProductImage[];
  average_rating: number;
  review_count: number;
  in_stock: boolean;
  discount_percentage: number | null;
}
