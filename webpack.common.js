const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");

module.exports = {
    entry: {
        app: './src/index.js',
    },
    module: {
        rules: [
            {
                test: /\.(png|jpe?g|gif|woff|woff2|eot|ttf|otf|svg)$/,
                use: ['file-loader'],
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
        filename: '[name].[hash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        moduleIds: 'hashed',
    },
};
