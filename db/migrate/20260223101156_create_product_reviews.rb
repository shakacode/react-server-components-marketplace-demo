# frozen_string_literal: true

class CreateProductReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :product_reviews do |t|
      t.references :product, null: false, foreign_key: true
      t.integer :rating, null: false
      t.string :title
      t.text :comment
      t.string :reviewer_name, null: false
      t.boolean :verified_purchase, default: false
      t.integer :helpful_count, default: 0
      t.timestamps
    end

    add_index :product_reviews, [:product_id, :created_at]
    add_index :product_reviews, [:product_id, :rating]
    add_index :product_reviews, [:product_id, :helpful_count]
  end
end
