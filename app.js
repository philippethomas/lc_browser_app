/**
 * Module dependencies.
 */
var express = require('express');
//var routes = require('./routes');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);
module.exports.app = app;

//var scanner = require('lc_file_crawlers/scanner.js');


var home = require('./home');
app.get('/', home.index);


var las = require('./las');
app.get('/las', las.list);

app.get('/test', las.test)


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});



//app.on('lasdoc', function(data){
//  console.log('LASDOC, here is the data: '+data.fullpath);
//  io.sockets.emit('zzz', data);
//});


io.sockets.on('connection', function (socket) {
  //socket.emit('zzz', {blah:'blah'});

  app.on('lasdoc', function(data){
    console.log('zzzLASDOC, here is the data: '+data.fullpath);
    //io.sockets.emit('zzz', data);
    socket.emit('zzz',data);
  });

});

