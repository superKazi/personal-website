const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const workboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets: 'defaults',
                                    useBuiltIns: 'usage',
                                    corejs: 3.8,
                                },
                            ],
                            'minify',
                        ],
                    },
                },
            },
            {
                test: /\.(sa|sc|c)ss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
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
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
        }),
        new WebpackPwaManifest({
            name: 'Kazi Elman Awal',
            short_name: 'Kazi',
            description:
                'Journalist, designer, developer Kazi Elman Awal’s website',
            background_color: '#FFFFFF',
            theme_color: '#FFFFFF',
            orientation: 'portrait-primary',
            ios: true,
            icons: [
                {
                    src: 'src/favicon.png',
                    sizes: [96, 256, 512],
                    ios: true,
                },
                {
                    src: 'src/favicon.svg',
                    sizes: '512x512',
                    purpose: 'maskable',
                    ios: true,
                },
            ],
        }),
        new workboxPlugin.GenerateSW({
            swDest: 'sw.js',
            exclude: [/\.jpg$/, /\.jpeg$/, /\.png$/, /\.svg$/, /^_.*/],
            clientsClaim: true,
            skipWaiting: true,
            cleanupOutdatedCaches: true,
            sourcemap: true,
            inlineWorkboxRuntime: true,
            cacheId: 'kazi’s-stuff',
            runtimeCaching: [
                {
                    urlPattern: /\.(?:jpg|jpeg|png|svg)$/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'kazi’s-images',
                        expiration: {
                            maxEntries: 5,
                        },
                    },
                },
            ],
        }),
        new CopyPlugin({
            patterns: [{ from: 'src/_headers' }, { from: 'src/_redirects' }],
            options: { concurrency: 50 },
        }),
    ],
});
