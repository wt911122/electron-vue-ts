'use strict';

process.env.NODE_ENV = 'development';
const chalk = require('chalk');
const electron = require('electron');
const path = require('path');
const { say } = require('cfonts');
const { spawn } = require('child_process');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackHotMiddleware = require('webpack-hot-middleware');

const mainConfig = require('../build/webpack.main.config');
const rendererConfig = require('../build/webpack.render.config');

const getAvailablePort = require('./findPort');
let electronProcess = null;
let manualRestart = false;
let hotMiddleware;

function logStats(proc, data) {
    let log = '';

    log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`);
    log += '\n\n';

    if (typeof data === 'object') {
        data.toString({
            colors: true,
            chunks: false,
        }).split(/\r?\n/).forEach((line) => {
            log += '  ' + line + '\n';
        });
    } else {
        log += `  ${data}\n`;
    }

    log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n';

    console.log(log);
}

function electronLog(data, color) {
    let log = '';
    data = data.toString().split(/\r?\n/);
    data.forEach((line) => {
        log += `  ${line}\n`;
    });
    if (/[0-9A-z]+/.test(log)) {
        console.log(
            chalk[color].bold('┏ Electron -------------------')
      + '\n\n'
      + log
      + chalk[color].bold('┗ ----------------------------')
      + '\n'
        );
    }
}

function greeting() {
    const cols = process.stdout.columns;
    let text = '';

    if (cols > 104)
        text = 'electron-vue-ts';
    else if (cols > 76)
        text = 'electron-|vue-ts|';
    else
        text = false;

    if (text) {
        say(text, {
            colors: ['yellow'],
            font: 'simple3d',
            space: false,
        });
    } else
        console.log(chalk.yellow.bold('\n  electron-vue'));
    console.log(chalk.blue('  getting ready...') + '\n');
}

function startRenderer() {
    for (const name in rendererConfig.entry) {
        rendererConfig.entry[name] = [path.join(__dirname, 'compiling.js')].concat(rendererConfig.entry[name]);
    }

    const compiler = webpack(rendererConfig);
    hotMiddleware = webpackHotMiddleware(compiler, {
        log: false,
        heartbeat: 2500,
    });

    compiler.hooks.compilation.tap('compilation', (compilation) => {
        compilation.hooks.htmlWebpackPluginAfterEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
            hotMiddleware.publish({ action: 'reload' });
            cb();
        });
    });

    compiler.hooks.done.tap('done', (stats) => {
        logStats('Renderer', stats);
    });

    return Promise.all([getAvailablePort(9080), getAvailablePort(9222)])
        .then(([serverPort, devToolPort]) => {
            process.env.renderDevServerPort = serverPort;
            process.env.renderDevToolPort = devToolPort;
            return new Promise((resolve, reject) => {
                const server = new WebpackDevServer(
                    compiler,
                    {
                        contentBase: path.join(__dirname, '../'),
                        quiet: false,
                        before(app, ctx) {
                            app.use(hotMiddleware);
                            ctx.middleware.waitUntilValid(() => {
                                resolve();
                            });
                        },
                        proxy: {
                            '/json': {
                                target: {
                                    host: '127.0.0.1',
                                    protocol: 'http:',
                                    port: devToolPort,
                                },
                            },
                            '/devtools': {
                                target: {
                                    host: '127.0.0.1',
                                    protocol: 'http:',
                                    port: devToolPort,
                                },
                            },
                        },
                    }
                );

                server.listen(serverPort);
            });
        });
}

function startMain() {
    mainConfig.entry.main = [path.join(__dirname, '../main/index.dev.ts')].concat(mainConfig.entry.main);

    const compiler = webpack(mainConfig);
    compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
        logStats('Main', chalk.white.bold('compiling...'));
        hotMiddleware.publish({ action: 'compiling' });
        done();
    });
    return new Promise((resolve, reject) => {
        compiler.watch({}, (err, stats) => {
            if (err) {
                console.log(err);
                return;
            }

            logStats('Main', stats);

            if (electronProcess && electronProcess.kill) {
                manualRestart = true;
                process.kill(electronProcess.pid);
                electronProcess = null;
                startElectron();

                setTimeout(() => {
                    manualRestart = false;
                }, 5000);
            }

            resolve();
        });
    });
}
function startElectron() {
    let args = [
        '--inspect=5858',
        path.join(__dirname, '../dist/electron/main.js'),
    ];
    if (process.env.npm_execpath.endsWith('yarn.js')) {
        args = args.concat(process.argv.slice(3));
    } else if (process.env.npm_execpath.endsWith('npm-cli.js')) {
        args = args.concat(process.argv.slice(2));
    }
    electronProcess = spawn(electron, args);
    electronProcess.stdout.on('data', (data) => {
        electronLog(data, 'blue');
    });
    electronProcess.stderr.on('data', (data) => {
        electronLog(data, 'red');
    });

    electronProcess.on('close', () => {
        if (!manualRestart)
            process.exit();
    });
}

function init() {
    greeting();

    Promise.all([startRenderer(), startMain()])
        .then(() => {
            startElectron();
        })
        .catch((err) => {
            console.error(err);
        });
}

init();
