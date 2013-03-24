var express = require('express');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);
var expressValidator = require('express-validator');

// Configuration
app.configure(function(){
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
})


var home = require('./home');
app.get('/', home.index);


var las = require('./las');
app.get('/las', las.list);
app.post('/las', las.run_and_save_crawl)

app.get('/test', las.test)




app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});




app.on('lasdoc', function(data){
  io.sockets.on('connection', function (socket) {
    socket.emit('lasdoc', data);
  });
});







module.exports.app = app;
