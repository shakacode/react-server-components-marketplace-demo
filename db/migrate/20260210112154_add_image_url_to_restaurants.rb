class AddImageUrlToRestaurants < ActiveRecord::Migration[7.2]
  def change
    add_column :restaurants, :image_url, :string

    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE restaurants
          SET image_url = 'https://picsum.photos/seed/restaurant-' || id || '/400/300'
        SQL
      end
    end
  end
end
