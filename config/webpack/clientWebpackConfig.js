const { RSCWebpackPlugin } = require('react-on-rails-rsc/WebpackPlugin');
const commonWebpackConfig = require('./commonWebpackConfig');

const configureClient = () => {
  const clientConfig = commonWebpackConfig();

  // server-bundle is special and should ONLY be built by the serverConfig
  // In case this entry is not deleted, a very strange "window" not found
  // error shows referring to window["webpackJsonp"]. That is because the
  // client config is going to try to load chunks.
  delete clientConfig.entry['server-bundle'];

  clientConfig.plugins.push(new RSCWebpackPlugin({ isServer: false }));

  clientConfig.resolve.fallback = {
    fs: false,
    path: false,
    stream: false,
  };

  return clientConfig;
};

module.exports = configureClient;
