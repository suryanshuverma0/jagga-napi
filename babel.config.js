module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      // Strip every console.* call from release bundles (Metro sets NODE_ENV=production).
      production: { plugins: ['transform-remove-console'] },
    },
  };
};
