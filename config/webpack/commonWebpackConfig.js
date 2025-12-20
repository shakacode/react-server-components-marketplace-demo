const { generateWebpackConfig, merge } = require('shakapacker');

const commonOptions = {
  resolve: {
    extensions: ['.css', '.ts', '.tsx'],
  },
};

const baseClientWebpackConfig = generateWebpackConfig();

const commonWebpackConfig = () => {
  const config = merge({}, baseClientWebpackConfig, commonOptions);

  // Fix CSS modules for Shakapacker 9.x compatibility
  // Shakapacker 9 defaults to namedExport: true, but our code uses default imports
  // Override to use the old behavior for backward compatibility
  config.module.rules.forEach((rule) => {
    if (rule.test && (rule.test.test('example.module.scss') || rule.test.test('example.module.css'))) {
      if (Array.isArray(rule.use)) {
        rule.use.forEach((loader) => {
          if (
            loader.loader &&
            loader.loader.includes('css-loader') &&
            loader.options &&
            loader.options.modules
          ) {
            // Disable named exports to support default imports
            // eslint-disable-next-line no-param-reassign
            loader.options.modules.namedExport = false;
            // eslint-disable-next-line no-param-reassign
            loader.options.modules.exportLocalsConvention = 'camelCase';
          }
        });
      }
    }
  });

  return config;
};

module.exports = commonWebpackConfig;
