// Server bundle entry point for React on Rails
// This file is used for server-side rendering and RSC
import ReactOnRails from 'react-on-rails-pro';

// Components
import HelloWorld from '../components/HelloWorld.jsx';

// Register components with React on Rails
ReactOnRails.register({
  HelloWorld,
});

// Make React available globally for testing
if (process.env.NODE_ENV === 'test') {
  globalThis.React = require('react');
}

console.log('[LocalHub Demo] Server bundle loaded');
