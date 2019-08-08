module.exports = {
  lintOnSave: undefined,
  publicPath: undefined,
  outputDir: undefined,
  assetsDir: undefined,
  runtimeCompiler: undefined,
  productionSourceMap: undefined,
  parallel: undefined,
  chainWebpack: (config) => {
    config.devtool('source-map');
  },
  devServer: {
    proxy: {
      '/api': {
        target: ' https://www.easy-mock.com/mock/',
        changeOrigin: true,
        pathRewrite: { '^/api': '5b7a5611f0e3593f36141420' },
      },
    },
  },
  css: {
    modules: false,
    sourceMap: true,
  },
};
