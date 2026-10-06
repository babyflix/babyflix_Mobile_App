module.exports = function (api) {
  // Re-evaluate when the build mode or env file changes, so a dev bundle and
  // a production bundle never share a cached config.
  api.cache.using(() => `${process.env.NODE_ENV}-${process.env.EXPO_PUBLIC_ENV}`);

  const isProductionBuild = process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: process.env.EXPO_PUBLIC_ENV === 'production'
            ? '.env.production'
            : '.env.development',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      // Strip console.log/info/debug from release bundles (they cost real
      // time on the JS thread). console.error and console.warn are kept.
      ...(isProductionBuild
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      "react-native-reanimated/plugin",
    ],
  };
};
