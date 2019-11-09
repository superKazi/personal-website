  const merge = require('webpack-merge');
  const common = require('./webpack.common.js');
  const TerserPlugin = require('terser-webpack-plugin');
  const workboxPlugin = require('workbox-webpack-plugin');
  const WebpackPwaManifest = require('webpack-pwa-manifest');
  const CopyPlugin = require('copy-webpack-plugin');

  module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    module: {
      rules: [{
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', 'minify']
          }
        }
      }],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          sourceMap: true,
        }),
      ],
    },
    plugins: [
      new WebpackPwaManifest({
        name: 'Kazi Elman Awal',
        short_name: 'Kazi',
        description: 'Journalist, designer, developer Kazi Elman Awal’s website',
        background_color: '#ffffff',
        orientation: "portrait-primary",
        icons: [{
          src: 'src/favicon.png',
          sizes: [192, 512]
        }, ]
      }),
      new workboxPlugin.GenerateSW({
        swDest: 'sw.js',
        exclude: [/\.jpg$/, /\.png$/],
        clientsClaim: true,
        skipWaiting: true,
        cacheId: 'kazi’s-stuff'
      }),
      new CopyPlugin([
        'src/netlify.toml'
      ]),
    ],
  });