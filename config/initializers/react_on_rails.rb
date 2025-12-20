# frozen_string_literal: true

# For more configuration options see:
# https://www.shakacode.com/react-on-rails/docs/guides/configuration

ReactOnRails.configure do |config|
  # This configures the script to run to build the production assets
  config.build_production_command = 'RAILS_ENV=production NODE_ENV=production bin/shakapacker'

  # This is the directory where your server bundle is generated
  config.server_bundle_js_file = 'server-bundle.js'

  # Enable auto bundling - file-system based automated bundle generation
  config.auto_load_bundle = true

  # Directory name where components are discovered for auto bundling
  config.components_subdirectory = 'startup'
end
