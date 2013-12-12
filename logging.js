var winston = require('winston');

var logfile = __dirname+'/logs/logicalcat.log';

var transports = [];
var to_console = new (winston.transports.Console)({ level: 'info' });
var to_file = new (winston.transports.File)({
  level: 'info',
  filename: logfile,
  json: false,
  maxsize: 5242880
})
transports.push(to_console);
transports.push(to_file);

var logger = new (winston.Logger)({
  transports: transports
});


logger.info('@@@@@')
logger.info('(re)initialized logging to console and file:');
logger.info(logfile);

module.exports= logger;
