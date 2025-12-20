class Order < ApplicationRecord
  belongs_to :restaurant
  has_many :order_lines, dependent: :destroy

  validates :order_number, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: %w[pending preparing ready completed cancelled] }
  validates :placed_at, presence: true
  validates :total_price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :pending, -> { where(status: 'pending') }
  scope :preparing, -> { where(status: 'preparing') }
  scope :ready, -> { where(status: 'ready') }
  scope :completed, -> { where(status: 'completed') }
  scope :active, -> { where(status: %w[pending preparing ready]) }
  scope :recent, -> { where('placed_at > ?', 24.hours.ago) }
end
