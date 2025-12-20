class Hour < ApplicationRecord
  belongs_to :restaurant

  validates :day_of_week, presence: true, inclusion: { in: 0..6 }
  validates :day_of_week, uniqueness: { scope: :restaurant_id }

  # Day names for display
  DAY_NAMES = %w[Sunday Monday Tuesday Wednesday Thursday Friday Saturday].freeze

  def day_name
    DAY_NAMES[day_of_week]
  end
end
