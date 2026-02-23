# frozen_string_literal: true

class ProductReview < ApplicationRecord
  belongs_to :product

  validates :rating, presence: true, inclusion: { in: 1..5 }
  validates :reviewer_name, presence: true
end
