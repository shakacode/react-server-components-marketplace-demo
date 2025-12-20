class CreateHours < ActiveRecord::Migration[7.1]
  def change
    create_table :hours do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.integer :day_of_week, null: false # 0-6: Sunday-Saturday
      t.time :opens_at
      t.time :closes_at
      t.boolean :is_closed, default: false

      t.timestamps
    end

    add_index :hours, %i[restaurant_id day_of_week]
  end
end
