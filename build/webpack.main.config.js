'use strict';

const path = require('path');
const { dependencies } = require('../package.json');

const baseConfig = require('./webpack.base');
// const BabiliWebpackPlugin = require('babili-webpack-plugin');
const INCLUDE = path.resolve(__dirname, '../main');
const mainConfig = {
    entry: {
        main: path.join(__dirname, '../main/index.ts'),
    },
    externals: [
        ...Object.keys(dependencies || {}),
    ],
    watch: process.env.NODE_ENV === 'development',
    module: {
        rules: [
            {
                test: /\.tsx|ts$/,
                use: [
                    'cache-loader',
                    {
                        loader: 'ts-loader',
                        options: {
                            experimentalWatchApi: true,
                            transpileOnly: true,
                        },
                    },
                ],
                include: INCLUDE,
            },
        ],
    },

    resolve: {
        extensions: ['.ts', '.tsx'],
    },
    target: 'electron-main',
};
const c = baseConfig(mainConfig);
module.exports = c;
