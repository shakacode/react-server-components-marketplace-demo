# frozen_string_literal: true

ReactOnRailsPro.configure do |config|
  # Enable RSC (React Server Components) support
  config.enable_rsc_support = true

  # RSC bundle file name
  config.rsc_bundle_js_file = 'rsc-bundle.js'

  # Use Node renderer for server-side rendering
  config.server_renderer = 'NodeRenderer'

  # Renderer URL for the Node.js server
  config.renderer_url = ENV.fetch('RENDERER_URL', 'http://localhost:3800')

  # RSC payload generation URL path
  config.rsc_payload_generation_url_path = 'rsc_payload/'
end
