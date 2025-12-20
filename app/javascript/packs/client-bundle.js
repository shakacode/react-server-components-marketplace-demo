// Client bundle entry point for React on Rails
// This file is loaded in the browser and registers client-side components
import ReactOnRails from 'react-on-rails-pro';

// Components
import HelloWorld from '../components/HelloWorld.jsx';

// Register components with React on Rails
ReactOnRails.register({
  HelloWorld,
});

ReactOnRails.setOptions({
  traceTurbolinks: false,
  turbo: false,
});

console.log('[LocalHub Demo] Client bundle loaded');
