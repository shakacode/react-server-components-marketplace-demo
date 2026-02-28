# frozen_string_literal: true

class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.text :description, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.decimal :original_price, precision: 10, scale: 2
      t.string :category, null: false
      t.string :brand, null: false
      t.string :sku, null: false
      t.jsonb :images, default: []
      t.jsonb :specs, default: {}
      t.jsonb :features, default: []
      t.decimal :average_rating, precision: 3, scale: 2, default: 0
      t.integer :review_count, default: 0
      t.integer :stock_quantity, default: 100
      t.boolean :in_stock, default: true
      t.timestamps
    end

    add_index :products, :category
    add_index :products, :brand
    add_index :products, :sku, unique: true
  end
end
