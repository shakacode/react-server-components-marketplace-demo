class CreateSpecialHours < ActiveRecord::Migration[7.1]
  def change
    create_table :special_hours do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.date :date, null: false
      t.time :opens_at
      t.time :closes_at
      t.boolean :is_closed, default: false
      t.string :reason # holiday, event, etc.

      t.timestamps
    end

    add_index :special_hours, %i[restaurant_id date], unique: true
  end
end
