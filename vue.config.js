const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');
module.exports = {
  lintOnSave: undefined,
  publicPath: './',
  outputDir: 'static',
  indexPath: 'index.html',
  assetsDir: '',
  runtimeCompiler: undefined,
  productionSourceMap: false,
  parallel: undefined,
  chainWebpack: (config) => {
    config.devtool('source-map');
  },
  configureWebpack: {
    plugins: [
      new MonacoWebpackPlugin()
    ],
  },
  devServer: {
    compress: true,
    port: 9000
  },
  css: {
    modules: false,
    sourceMap: false,
  },
};
