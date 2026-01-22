class Api::RestaurantsController < ActionController::Base
  def status
    restaurant = Restaurant.find(params[:id])

    render json: {
      status: restaurant.current_status,
      timestamp: Time.current.iso8601
    }
  end

  def wait_time
    restaurant = Restaurant.find(params[:id])

    render json: {
      wait_time: restaurant.current_wait_time,
      timestamp: Time.current.iso8601
    }
  end

  def specials
    restaurant = Restaurant.find(params[:id])

    render json: {
      promotions: restaurant.active_promotions.map { |p|
        {
          id: p.id,
          title: p.title,
          description: p.description,
          discount_type: p.discount_type,
          discount_value: p.discount_value,
          code: p.code,
          ends_at: p.ends_at.iso8601
        }
      },
      timestamp: Time.current.iso8601
    }
  end

  def trending
    restaurant = Restaurant.find(params[:id])

    render json: {
      items: restaurant.trending_items.map { |item|
        {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description
        }
      },
      timestamp: Time.current.iso8601
    }
  end

  def rating
    restaurant = Restaurant.find(params[:id])

    render json: {
      average_rating: restaurant.reviews.average(:rating).round(2),
      review_count: restaurant.reviews.count,
      timestamp: Time.current.iso8601
    }
  end
end
