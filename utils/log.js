const winston = require('winston');
const os = require('os');
const fs = require('fs');

const crawlerDir = 'webgatherer-exceptions';

const homeDir = os.homedir();
const unixTime = new Date().getTime();

function getLogger(module) {
  const path = module.filename.split('/').slice(-2).join('/');

  if (!fs.existsSync(`${homeDir}/${crawlerDir}/`)) {
    fs.mkdirSync(`${homeDir}/${crawlerDir}/`);
  }

  return new winston.Logger({
    transports: [
      new winston.transports.File({
        name: 'error-file',
        filename: `${homeDir}/${crawlerDir}/exception_${unixTime}.log`,
        level: 'error',
        json: false,
      }),
      new winston.transports.Console({
        colorize: true,
        level: 'debug',
        label: path,
        timestamp() {
          const d = new Date();
          return d.toLocaleTimeString();
        },
      }),
    ],
  });
}
module.exports = getLogger;
