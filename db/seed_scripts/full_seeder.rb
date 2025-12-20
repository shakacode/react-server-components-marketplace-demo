# frozen_string_literal: true

class FullSeeder
  def self.seed!
    puts "=== FULL SEED MODE (Production) ==="
    puts "Target: 62M+ records"
    puts "Estimated time: 20-30 minutes"
    puts ""

    start_time = Time.now

    # Disable logging for speed
    ActiveRecord::Base.logger.level = Logger::WARN

    # Seed in dependency order
    BaseSeeder.seed_restaurants(count: 50_000)
    BaseSeeder.seed_hours          # 350K (7 per restaurant)
    BaseSeeder.seed_special_hours  # ~100K (1-3 per restaurant)
    BaseSeeder.seed_reviews(count: 2_000_000)
    BaseSeeder.seed_menu_items(count: 500_000)
    BaseSeeder.seed_promotions(count: 100_000)

    # CRITICAL: Orders table - drives query latency
    # 10M orders needed for 100-150ms wait_time queries
    BaseSeeder.seed_orders(count: 10_000_000)
    BaseSeeder.seed_order_lines    # ~30M (1-5 per order, avg 3)

    # Post-seed optimization
    puts "\nRunning VACUUM ANALYZE..."
    ActiveRecord::Base.connection.execute("VACUUM ANALYZE")

    elapsed = ((Time.now - start_time) / 60).round(1)
    puts "\n=== Full seed complete in #{elapsed} minutes! ==="
    print_summary
  end

  def self.print_summary
    puts "\n=== Database Summary ==="
    {
      'Restaurants' => Restaurant,
      'Hours' => Hour,
      'Special Hours' => SpecialHour,
      'Reviews' => Review,
      'Menu Items' => MenuItem,
      'Promotions' => Promotion,
      'Orders' => Order,
      'Order Lines' => OrderLine
    }.each do |name, model|
      count = model.count
      formatted = count.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
      puts "  #{name}: #{formatted}"
    end
  end
end
