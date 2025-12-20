class CreateMenuItems < ActiveRecord::Migration[7.1]
  def change
    create_table :menu_items do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :category
      t.decimal :price, precision: 8, scale: 2, null: false
      t.integer :prep_time_minutes
      t.boolean :is_available, default: true

      t.timestamps
    end

    # Note: restaurant_id index created automatically by references
    add_index :menu_items, %i[restaurant_id category]
  end
end
