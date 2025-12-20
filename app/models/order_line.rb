class OrderLine < ApplicationRecord
  belongs_to :order
  belongs_to :menu_item

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :price_per_unit, presence: true, numericality: { greater_than_or_equal_to: 0 }

  def total_price
    quantity * price_per_unit
  end
end
