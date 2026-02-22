Rails.application.routes.draw do
  rsc_payload_route
  # Health check endpoint
  get 'up' => 'rails/health#show', as: :rails_health_check

  # Root route (will be updated later)
  root 'home#index'
  get '/rsc' => 'home#rsc'

  # Search routes — three versions of the same page
  get '/search/ssr', to: 'restaurants#search_ssr'       # V1: All data fetched on server, returned at once
  get '/search/client', to: 'restaurants#search_client'  # V2: Loadable components, client-side fetch
  get '/search/rsc', to: 'restaurants#search_rsc'        # V3: RSC streaming

  # Blog post routes — three versions demonstrating bundle size differences
  get '/blog/ssr', to: 'blog#post_ssr'       # V1: marked + highlight.js shipped to client
  get '/blog/client', to: 'blog#post_client'  # V2: Libraries loaded in async chunk
  get '/blog/rsc', to: 'blog#post_rsc'              # V3: Libraries stay server-side + streaming
  get '/blog/rsc-simple', to: 'blog#post_rsc_simple' # V4: Libraries stay server-side, all data upfront

  # RSC debug steps (incremental complexity)
  get '/blog/rsc-step1', to: 'blog#post_rsc_step1'
  get '/blog/rsc-step1b', to: 'blog#post_rsc_step1b'
  get '/blog/rsc-step1c', to: 'blog#post_rsc_step1c'
  get '/blog/rsc-step2', to: 'blog#post_rsc_step2'
  get '/blog/rsc-step3', to: 'blog#post_rsc_step3'
  get '/blog/rsc-step4', to: 'blog#post_rsc_step4'
  get '/blog/rsc-step5', to: 'blog#post_rsc_step5'

  # Dashboard route (Task 5)
  get '/dashboard', to: 'dashboard#index'
  get '/comparison', to: 'dashboard#comparison'

  # API endpoints (Task 2)
  namespace :api do
    resources :restaurants, only: [] do
      member do
        get :status
        get :wait_time
        get :specials
        get :trending
        get :rating
      end
    end

    resources :blog_posts, only: [] do
      member do
        get :related_posts
      end
    end

    # Performance metrics collection
    post '/performance_metrics', to: 'performance_metrics#create'
  end
end
