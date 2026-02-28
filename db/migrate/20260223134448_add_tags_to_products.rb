class AddTagsToProducts < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :tags, :jsonb, default: []
    add_index :products, :tags, using: :gin
    add_index :products, :price
  end
end
