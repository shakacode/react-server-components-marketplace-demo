Rails.application.routes.draw do
  rsc_payload_route
  # Health check endpoint
  get 'up' => 'rails/health#show', as: :rails_health_check

  # Root route (will be updated later)
  root 'home#index'
  get '/rsc' => 'home#rsc'

  # Search routes (Tasks 3 & 4)
  get '/search', to: 'restaurants#search'
  get '/search/rsc', to: 'restaurants#search_rsc'

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
