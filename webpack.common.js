const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");

module.exports = {
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf|otf|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer',
        }),
    ],
    output: {
        filename: '[name].[contenthash].js',
        publicPath: '/'
    },
    optimization: {
        moduleIds: 'deterministic',
    },
};
