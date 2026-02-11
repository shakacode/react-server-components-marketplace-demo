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

    # Performance metrics collection
    post '/performance_metrics', to: 'performance_metrics#create'
  end
end
