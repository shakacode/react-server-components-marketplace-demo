// Client bundle entry point for React on Rails
// This file is loaded in the browser and registers client-side components
import ReactOnRails from 'react-on-rails-pro';
import registerServerComponent from 'react-on-rails-pro/registerServerComponent/client';

// Components - import from startup directory for auto-bundling compatibility
import HelloWorld from '../startup/HelloWorld';

// Register components with React on Rails
ReactOnRails.register({
  HelloWorld,
});

registerServerComponent('SimpleServerComponent');

ReactOnRails.setOptions({
  traceTurbolinks: false,
  turbo: false,
});

console.log('[LocalHub Demo] Client bundle loaded');
