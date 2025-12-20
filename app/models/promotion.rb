class Promotion < ApplicationRecord
  belongs_to :restaurant

  validates :title, presence: true
  validates :discount_type, presence: true, inclusion: { in: %w[percentage fixed_amount free_item] }
  validates :discount_value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :starts_at, presence: true
  validates :ends_at, presence: true

  scope :active, -> { where(is_active: true).where('starts_at <= ? AND ends_at >= ?', Time.current, Time.current) }

  def active?
    is_active && starts_at <= Time.current && ends_at >= Time.current
  end

  def discount_display
    case discount_type
    when 'percentage'
      "#{discount_value.to_i}% off"
    when 'fixed_amount'
      "$#{discount_value.to_f.round(2)} off"
    when 'free_item'
      'Free item'
    end
  end
end
