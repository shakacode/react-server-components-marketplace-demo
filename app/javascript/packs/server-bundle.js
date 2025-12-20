// Server bundle entry point for React on Rails
// This file is used for server-side rendering and RSC
import ReactOnRails from 'react-on-rails-pro';

// Components will be registered here as they are created
// Example:
// import RestaurantCard from '../components/RestaurantCard';
// ReactOnRails.register({ RestaurantCard });

// Make React available globally for testing
if (process.env.NODE_ENV === 'test') {
  globalThis.React = require('react');
}

console.log('[LocalHub Demo] Server bundle loaded');
