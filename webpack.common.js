  const path = require('path');
  const {
    CleanWebpackPlugin
  } = require('clean-webpack-plugin');
  const HtmlWebpackPlugin = require('html-webpack-plugin');

  module.exports = {
    entry: {
      app: './src/index.js',
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        'meta': {
          'description': 'Journalist, designer, developer Kazi Elman Awal’s website',
          'robots': 'index,follow',
          'googlebot': 'index,follow',
          'generator': 'Webpack',
          'subject': 'Proof Kazi can kind of code, for the web at least',
          'referrer': 'no-referrer',
        },
        title: 'Kazi Elman Awal',
        favicon: './src/favicon.png',
      }),
    ],
    module: {
      rules: [{
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ],
        },
        {
          test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf|otf)$/,
          use: [
            'file-loader',
          ],
        },
      ],
    },
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
      moduleIds: 'hashed',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    }
  };