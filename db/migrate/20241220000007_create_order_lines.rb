class CreateOrderLines < ActiveRecord::Migration[7.1]
  def change
    create_table :order_lines do |t|
      t.references :order, null: false, foreign_key: { on_delete: :cascade }
      t.references :menu_item, null: false, foreign_key: { on_delete: :restrict }
      t.integer :quantity, null: false, default: 1
      t.decimal :price_per_unit, precision: 8, scale: 2, null: false
      t.text :special_instructions

      t.timestamps
    end

    # Note: indexes created automatically by references
  end
end
