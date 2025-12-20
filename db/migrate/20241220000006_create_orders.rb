class CreateOrders < ActiveRecord::Migration[7.1]
  def change
    create_table :orders do |t|
      t.references :restaurant, null: false, foreign_key: true
      t.string :order_number, null: false
      t.string :status, null: false, default: 'pending' # pending, preparing, ready, completed, cancelled
      t.datetime :placed_at, null: false
      t.datetime :estimated_ready_time
      t.datetime :actual_ready_time
      t.datetime :completed_at
      t.decimal :total_price, precision: 10, scale: 2, null: false
      t.boolean :is_delivery, default: false

      t.timestamps
    end

    # CRITICAL INDEXES for wait_time queries
    add_index :orders, %i[restaurant_id created_at], order: { created_at: :desc }
    add_index :orders, %i[restaurant_id status]
    add_index :orders, %i[restaurant_id completed_at]
    add_index :orders, :order_number, unique: true
  end
end
