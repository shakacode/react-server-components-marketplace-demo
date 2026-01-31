const { generateWebpackConfig, merge } = require('shakapacker');

const commonOptions = {
  resolve: {
    extensions: ['.css', '.ts', '.tsx'],
  },
};

const baseClientWebpackConfig = generateWebpackConfig();

const commonWebpackConfig = () => merge({}, baseClientWebpackConfig, commonOptions);

module.exports = commonWebpackConfig;
