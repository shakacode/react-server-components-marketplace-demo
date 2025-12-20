// import statement added by react_on_rails:generate_packs rake task
import "./../generated/server-bundle-generated.js"
// Server bundle entry point for React on Rails
// This file is used for server-side rendering and RSC
import ReactOnRails from 'react-on-rails-pro';
import registerServerComponent from 'react-on-rails-pro/registerServerComponent/server';

// Components - import from startup directory for auto-bundling compatibility
import HelloWorld from '../startup/HelloWorld';
import SimpleServerComponent from '../startup/SimpleServerComponent';

// Register components with React on Rails
ReactOnRails.register({
  HelloWorld,
});

registerServerComponent({
  SimpleServerComponent,
});

console.log('[LocalHub Demo] Server bundle loaded');
