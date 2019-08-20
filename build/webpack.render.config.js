const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const baseConfig = require('./webpack.base');
const { dependencies } = require('../package.json');
const whiteListedModules = ['vue'];

const rendererConfig = {
    entry: {
        app: path.resolve(__dirname, '../renderer/main.js'),
    },
    externals: [
        ...Object.keys(dependencies || {}).filter((d) => !whiteListedModules.includes(d)),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                oneOf: [
                    {
                        resourceQuery: /module/,
                        use: [
                            'vue-style-loader',
                            {
                                loader: 'css-loader',
                                options: {
                                    modules: {
                                        mode: 'local',
                                        localIdentName: '[name]_[local]_[hash:base64:8]',
                                    },
                                },
                            },
                        ],
                    },
                    {
                        use: [
                            {
                                loader: process.env.NODE_ENV !== 'production' ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
                            },

                            {
                                loader: 'css-loader',
                            },
                        ],
                    },
                ],
            },
            {
                test: /\.vue$/,
                use: {
                    loader: 'vue-loader',
                },
            },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../renderer/template.html'),
            chunks: ['app'],
        }),
        new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {
        alias: {
            '@': path.join(__dirname, '../src'),
            vue$: 'vue/dist/vue.esm.js',
            '@util': path.join(__dirname, '../util'),
        },
        extensions: ['.js', '.vue', '.json', '.css'],
    },
    target: 'electron-renderer',
};
module.exports = baseConfig(rendererConfig);
