export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine_type: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  website_url: string;
  timezone: string;
  average_rating: number;
  review_count: number;
  image_url: string;
}

export interface StatusData {
  status: 'open' | 'closed' | 'custom_hours';
  message?: string;
}

export interface WaitTimeData {
  wait_time: number; // minutes
}

export interface Promotion {
  id: number;
  restaurant_id: number;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_item';
  discount_value: number;
  code?: string;
  starts_at: string;
  ends_at: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  prep_time_minutes: number;
}

export interface Review {
  id: number;
  restaurant_id: number;
  rating: number;
  title: string;
  comment: string;
  reviewer_name: string;
}
