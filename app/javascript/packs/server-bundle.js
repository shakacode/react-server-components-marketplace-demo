// Server bundle entry point for React on Rails
// This file is used for server-side rendering and RSC
import ReactOnRails from 'react-on-rails-pro';
import registerServerComponent from 'react-on-rails-pro/registerServerComponent/server';

// Components
import HelloWorld from '../components/HelloWorld';
import SimpleServerComponent from '../components/SimpleServerComponent';

// Register components with React on Rails
ReactOnRails.register({
  HelloWorld,
});

registerServerComponent({
  SimpleServerComponent,
});

console.log('[LocalHub Demo] Server bundle loaded');
