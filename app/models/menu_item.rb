class MenuItem < ApplicationRecord
  belongs_to :restaurant
  has_many :order_lines, dependent: :restrict_with_error

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :available, -> { where(is_available: true) }
  scope :by_category, ->(category) { where(category: category) }
end
