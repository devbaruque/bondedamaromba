// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Mantendo a configuração para SVG, que ainda pode ser útil
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Adicionar polyfills para módulos Node.js faltantes
config.resolver.extraNodeModules = {
  stream: path.resolve(__dirname, './src/utils/streamPolyfill.js'),
  events: path.resolve(__dirname, './src/utils/eventsPolyfill.js'),
  http: path.resolve(__dirname, './src/utils/httpPolyfill.js'),
  https: path.resolve(__dirname, './src/utils/httpsPolyfill.js'),
  net: path.resolve(__dirname, './src/utils/netPolyfill.js'),
  crypto: path.resolve(__dirname, './src/utils/cryptoPolyfill.js'),
  zlib: path.resolve(__dirname, './src/utils/zlibPolyfill.js'),
  tls: path.resolve(__dirname, './src/utils/tlsPolyfill.js'),
  url: path.resolve(__dirname, './src/utils/urlPolyfill.js'),
};

module.exports = config; 