# Main seed file - determines which script to run
mode = ENV.fetch('SEED_MODE', 'small')

require_relative 'seed_scripts/base_seeder'

case mode
when 'small'
  require_relative 'seed_scripts/small_seeder'
  SmallSeeder.seed!
when 'full'
  require_relative 'seed_scripts/full_seeder'
  FullSeeder.seed!
else
  puts "Unknown SEED_MODE: #{mode}. Use 'small' or 'full'"
  exit 1
end
