module.exports = function (api) {
  api.cache(true);
  return {
    // 'nativewind/babel' returns a preset-like config, so include it in presets
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      // Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};
