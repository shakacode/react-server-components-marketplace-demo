class SpecialHour < ApplicationRecord
  belongs_to :restaurant

  validates :date, presence: true, uniqueness: { scope: :restaurant_id }
end
