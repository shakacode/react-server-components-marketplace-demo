class CreateReviews < ActiveRecord::Migration[7.1]
  def change
    create_table :reviews do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.integer :rating, null: false # 1-5
      t.string :title
      t.text :comment
      t.string :reviewer_name

      t.timestamps
    end

    # Note: restaurant_id index created automatically by references
    add_index :reviews, %i[restaurant_id created_at]

    # Add CHECK constraint for rating
    execute <<-SQL
      ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 5);
    SQL
  end
end
