const portfinder = require('portfinder');

module.exports = function (defaultPort) {
    portfinder.basePort = defaultPort;
    return new Promise((resolve, reject) => {
        portfinder.getPort((err, port) => {
            if (err) {
                throw err;
            }
            try {
                resolve(port);
            } catch (errs) {
                reject();
                console.error(`chdir: ${errs}`);
            }
        });
    });
};
