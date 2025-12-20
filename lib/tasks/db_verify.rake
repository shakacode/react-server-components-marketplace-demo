# frozen_string_literal: true

namespace :db do
  namespace :seed do
    desc 'Verify database seeding and query latency'
    task verify: :environment do
      puts "\n=== Database Verification ==="

      # Count records
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
        puts "#{name}: #{formatted}"
      end

      # Test wait_time query latency
      restaurant = Restaurant.first

      if restaurant
        puts "\n=== Query Latency Test ==="
        start_time = Time.now
        wait_time = restaurant.current_wait_time
        elapsed = ((Time.now - start_time) * 1000).round(2)

        puts "Wait time result: #{wait_time} minutes"
        puts "Query latency: #{elapsed}ms"

        if Order.count < 100_000
          puts "\n⚠️  NOTE: Small seed mode detected (#{Order.count} orders)"
          puts '   Query latency will be faster with small dataset'
          puts '   Run SEED_MODE=full rails db:seed for accurate latency testing'
        elsif elapsed < 50
          puts "\n⚠️  WARNING: Query too fast (#{elapsed}ms < 50ms)"
          puts '   Demo may not show RSC advantage effectively'
        elsif elapsed > 200
          puts "\n⚠️  WARNING: Query too slow (#{elapsed}ms > 200ms)"
          puts '   Consider optimizing query or adding indexes'
        else
          puts "\n✓ Query latency is optimal (100-150ms range)"
        end
      else
        puts "\n⚠️  No restaurants found. Run rails db:seed first."
      end
    end
  end
end
