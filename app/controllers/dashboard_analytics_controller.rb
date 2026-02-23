# frozen_string_literal: true

class DashboardAnalyticsController < ApplicationController
  include ReactOnRailsPro::RSCPayloadRenderer
  include ReactOnRailsPro::AsyncRendering

  enable_async_react_rendering only: [:show_rsc]

  # V1: Full Server SSR — fetch ALL data, return complete page
  # All queries must complete before ANY HTML is sent to the browser.
  def show_ssr
    @restaurant_data = dashboard_header_data

    # Sequential queries — every one blocks the response
    @kpi_stats = Restaurant.dashboard_kpi_stats
    @revenue_data = Restaurant.dashboard_revenue_by_day
    @order_status = Restaurant.dashboard_order_status
    @recent_orders = Restaurant.dashboard_recent_orders
    @top_items = Restaurant.dashboard_top_menu_items
    @hourly_data = Restaurant.dashboard_hourly_distribution
  end

  # V2: Client Components — send basic restaurant data, client fetches the rest
  def show_client
    @restaurant_data = dashboard_header_data
  end

  # V3: RSC Streaming — shell streams immediately, data streams as queries resolve
  def show_rsc
    @restaurant_data = dashboard_header_data
    stream_view_containing_react_components(template: "dashboard_analytics/show_rsc")
  end

  private

  def dashboard_header_data
    {
      id: 0,
      name: "All Restaurants",
      cuisine_type: "Multi-Cuisine",
      city: "Network",
      state: "US",
      average_rating: 4.2,
      review_count: Restaurant.sum(:review_count)
    }
  end
end
