const winston = require('winston');

function getLogger(module) {
  const path = module.filename.split('/').slice(-2).join('/');

  return new winston.Logger({
    transports: [
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
