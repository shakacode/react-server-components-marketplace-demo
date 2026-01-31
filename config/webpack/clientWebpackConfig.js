const { RSCWebpackPlugin } = require('react-on-rails-rsc/WebpackPlugin');
const commonWebpackConfig = require('./commonWebpackConfig');

// Override CSS Modules configuration to use v8-style default exports
const overrideCssModulesConfig = (config) => {
  // Find the CSS rule in the module rules
  const cssRule = config.module.rules.find(
    (rule) => rule.test && rule.test.toString().includes("css")
  )

  if (cssRule && cssRule.use) {
    const cssLoaderUse = cssRule.use.find(
      (use) => use.loader && use.loader.includes("css-loader")
    )

    if (cssLoaderUse) {
      cssRule.use.push({
        loader: "postcss-loader",
        options: {
          postcssOptions: {
            plugins: [
              [
                "postcss-preset-env",
                {
                  // Options
                },
              ],
            ],
          },
        },
      })
    }
  }

  return config
}

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

  return overrideCssModulesConfig(clientConfig);
};

module.exports = configureClient;
