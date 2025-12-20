class CreateRestaurants < ActiveRecord::Migration[7.1]
  def change
    create_table :restaurants do |t|
      t.string :name, null: false
      t.text :description
      t.string :cuisine_type, null: false
      t.decimal :latitude, precision: 10, scale: 7
      t.decimal :longitude, precision: 10, scale: 7
      t.string :address
      t.string :city
      t.string :state
      t.string :zip_code
      t.string :phone
      t.string :website
      t.string :timezone, null: false, default: 'America/New_York'
      t.decimal :average_rating, precision: 3, scale: 2, default: 0.0
      t.integer :review_count, default: 0

      t.timestamps
    end

    add_index :restaurants, :city
    add_index :restaurants, :cuisine_type
    add_index :restaurants, :average_rating
  end
end
