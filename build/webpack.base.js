const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');
const baseConfig = {
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/electron'),
    },
    mode: process.env.NODE_ENV,
    module: { rules: [
        {
            test: /\.js$/,
            use: 'babel-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
            use: {
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'imgs/[name]--[folder].[ext]',
                },
            },
        },
        {
            test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
            loader: 'url-loader',
            options: {
                limit: 10000,
                name: 'media/[name]--[folder].[ext]',
            },
        },
        {
            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
            use: {
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'fonts/[name]--[folder].[ext]',
                },
            },
        },
    ] },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production',
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
    ],
};

module.exports = function (...cfg) {
    return merge(baseConfig, ...cfg);
};
