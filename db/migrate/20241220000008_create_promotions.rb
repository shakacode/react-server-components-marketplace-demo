class CreatePromotions < ActiveRecord::Migration[7.1]
  def change
    create_table :promotions do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :discount_type, null: false # percentage, fixed_amount, free_item
      t.decimal :discount_value, precision: 8, scale: 2, null: false
      t.string :code
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :promotions, %i[restaurant_id ends_at]
    add_index :promotions, %i[restaurant_id starts_at ends_at]
    add_index :promotions, :code
  end
end
