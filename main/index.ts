import { app, BrowserWindow } from 'electron'

app.commandLine.appendSwitch('remote-debugging-port', process.env.renderDevToolPort);

app.on('ready', () =>{
    const w = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
        },
    });
    const appPort = process.env.renderDevServerPort;
    const appHost = '127.0.0.1';
    const appURL = `http://${appHost}:${appPort}`;
    w.loadURL(`${appURL}/index.html`)
})