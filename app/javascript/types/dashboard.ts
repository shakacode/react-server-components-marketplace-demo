export interface DashboardRestaurant {
  id: number;
  name: string;
  cuisine_type: string;
  city: string;
  state: string;
  average_rating: number;
  review_count: number;
}

export interface KpiStats {
  revenue: number;
  revenue_change: number;
  order_count: number;
  order_count_change: number;
  avg_order_value: number;
  avg_order_value_change: number;
  completion_rate: number;
  delivery_rate: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusItem {
  status: string;
  count: number;
}

export interface RecentOrder {
  id: number;
  order_number: string;
  status: string;
  total_price: number;
  items_count: number;
  item_names: string[];
  is_delivery: boolean;
  placed_at: string;
  completed_at: string | null;
}

export interface TopMenuItem {
  name: string;
  category: string;
  price: number;
  total_quantity: number;
  total_revenue: number;
}

export interface HourlyDataPoint {
  hour: number;
  orders: number;
  avg_value: number;
}
