module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo',{jsxImportSource:'nativewind'}],
   ],        // replaces preset-env + preset-react + preset-typescript for Expo
   plugins: [
    'react-native-reanimated/plugin',
   ],
  };
};