class Review < ApplicationRecord
  belongs_to :restaurant

  validates :rating, presence: true, inclusion: { in: 1..5 }

  after_save :update_restaurant_rating
  after_destroy :update_restaurant_rating

  private

  def update_restaurant_rating
    restaurant.update_cached_rating!
  end
end
