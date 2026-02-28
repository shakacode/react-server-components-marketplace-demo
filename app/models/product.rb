# frozen_string_literal: true

class Product < ApplicationRecord
  has_many :product_reviews, dependent: :destroy

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true
  validates :brand, presence: true
  validates :sku, presence: true, uniqueness: true

  scope :in_category, ->(category) { where(category: category) }

  def discount_percentage
    return nil unless original_price && original_price > price

    ((1 - (price / original_price)) * 100).round
  end

  def review_stats
    stats = product_reviews
      .group(:rating)
      .count

    total = stats.values.sum
    distribution = (1..5).map do |star|
      count = stats[star] || 0
      {
        stars: star,
        count: count,
        percentage: total > 0 ? (count * 100.0 / total).round(1) : 0
      }
    end.reverse

    {
      average_rating: average_rating.to_f,
      total_reviews: review_count,
      distribution: distribution
    }
  end

  def top_reviews(limit = 10)
    product_reviews
      .order(helpful_count: :desc, verified_purchase: :desc, created_at: :desc)
      .limit(limit)
  end

  def related_products(limit = 4)
    Product
      .where(category: category)
      .where.not(id: id)
      .order(average_rating: :desc, review_count: :desc)
      .limit(limit)
  end

  def update_cached_rating!
    stats = product_reviews.select('AVG(rating) as avg, COUNT(*) as cnt').take
    update!(
      average_rating: stats.avg&.round(2) || 0,
      review_count: stats.cnt || 0
    )
  end
end
