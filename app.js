var express = require('express');
//var flash = require('connect-flash');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);
//var expressValidator = require('express-validator');

// Configuration
app.configure(function(){
  app.use(express.bodyParser());
  //app.use(expressValidator);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.methodOverride());
  //app.use(express.cookieParser('logicalcat'));
  //app.use(express.session({cookie:{maxAge:60000}}));
  //app.use(flash());
  app.use(express.static(__dirname + '/public'));
})




var home = require('./home');
app.get('/', home.index);


var ep_files = require('./ep_files');
app.get('/ep_files', ep_files.list);
app.post('/ep_files', ep_files.save_and_run)
//app.get('/flash', ep_files.flash);

var petra = require('./petra');
app.get('/petra', petra.list);
app.post('/petra', petra.run_and_save_crawl)


var maintenance = require('./maintenance');
app.get('/maintenance/indexInit', maintenance.indexInit);
app.get('/maintenance/indexStatus', maintenance.indexStatus);
app.get('/maintenance/indexMapping', maintenance.indexMapping);


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});




app.on('lasdoc', function(data){
  io.sockets.emit('lasdoc', data);
});

app.on('ziplasdoc', function(data){
  io.sockets.emit('ziplasdoc', data);
});







module.exports.app = app;
