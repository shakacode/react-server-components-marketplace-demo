module.exports = function(api) {
  api.cache(true);

  const presets = [
    ['@babel/preset-env', {
      targets: {
        browsers: ['> 1%', 'last 2 versions']
      }
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true
    }]
  ];

  const plugins = [];

  return {
    presets,
    plugins
  };
};
