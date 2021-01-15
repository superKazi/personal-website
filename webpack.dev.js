const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true,
                            postcssOptions: {
                                plugins: ['postcss-preset-env', 'cssnano'],
                            },
                        },
                    },
                ],
            },
        ],
    },
    devServer: {
        contentBase: './dist',
        compress: true,
        port: 9000,
        hot: true,
        inline: true,
    },
});
