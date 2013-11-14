var winston = require('winston');

var logfile = __dirname+'/logs/meow.log';

var transports = [];
var to_console = new (winston.transports.Console)({ level: 'info' });
var to_file = new (winston.transports.File)({
  filename: logfile,
  maxsize: 5242880
})
transports.push(to_console);
if (process.argv[3]) {
  transports.push(to_file);
}

var logger = new (winston.Logger)({
  transports: transports
});

logger.info('initialized logging to console...')
if (process.argv[3]) {
  logger.info('also initialized logging to file: '+logfile)
}

module.exports= logger;
