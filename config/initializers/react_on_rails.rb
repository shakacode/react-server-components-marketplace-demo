# frozen_string_literal: true

# For more configuration options see:
# https://www.shakacode.com/react-on-rails/docs/guides/configuration

ReactOnRails.configure do |config|
  # This configures the script to run to build the production assets
  config.build_production_command = 'RAILS_ENV=production NODE_ENV=production bin/shakapacker'

  # This is the directory where your server bundle is generated
  config.server_bundle_js_file = 'ssr-generated/server-bundle.js'

  # Disable auto_load_bundle for now - we'll manually register components
  # Set to true later when using file-system based automated bundle generation
  config.auto_load_bundle = false
end
