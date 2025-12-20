// Client bundle entry point for React on Rails
// This file is loaded in the browser and registers client-side components
import ReactOnRails from 'react-on-rails-pro';

// Import global styles
// import '../styles/application.css';

// Components will be registered here as they are created
// Example:
// import RestaurantCard from '../components/RestaurantCard';
// ReactOnRails.register({ RestaurantCard });

ReactOnRails.setOptions({
  traceTurbolinks: false,
  turbo: false,
});

console.log('[LocalHub Demo] Client bundle loaded');
