# frozen_string_literal: true

module Api
  class DashboardController < ApplicationController
    skip_forgery_protection

    def kpi_stats
      render json: {
        stats: Restaurant.dashboard_kpi_stats,
        timestamp: Time.current.iso8601
      }
    end

    def revenue_data
      render json: {
        data: Restaurant.dashboard_revenue_by_day,
        timestamp: Time.current.iso8601
      }
    end

    def order_status
      render json: {
        data: Restaurant.dashboard_order_status,
        timestamp: Time.current.iso8601
      }
    end

    def recent_orders
      render json: {
        orders: Restaurant.dashboard_recent_orders,
        timestamp: Time.current.iso8601
      }
    end

    def top_menu_items
      render json: {
        items: Restaurant.dashboard_top_menu_items,
        timestamp: Time.current.iso8601
      }
    end

    def hourly_distribution
      render json: {
        data: Restaurant.dashboard_hourly_distribution,
        timestamp: Time.current.iso8601
      }
    end
  end
end
