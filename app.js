
/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);


// lc_crawler dependencies
var scanner = require('lc_file_crawlers/scanner.js');

var fakeOpts = { 
  label: 'unlabeled',
  es_url: 'http://localhost:9200',
  fw_root: 'c:\\temp',
  work_dir: 'C:\\Users\\rbh\\AppData\\Local\\Temp',
  write_csv: false,
  write_es: false,
  zip_las: undefined,
  shp_feat: 50,
  img_size: 300,
  sgy_deep: undefined,
  find_LAS: true,
  find_SHP: false,
  find_SGY: false,
  find_IMG: false,
  cs_max: 26214400 
}

//
//http://vimeo.com/56166857

// Configuration

app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  //app.set('view options', {layout: false});
  //app.use(express.bodyParser());
  //app.use(express.methodOverride());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// yep, this triggers a real scan. just need to figure out routes
// scanner.scan(fakeOpts);


/*
function User(name, email) {
  this.name = name;
  this.email = email;
}

var users = [
  new User('tj', 'tj@vision-media.ca'),
  new User('ciaran', 'ciaranj@gmail.com'),
  new User('aaron', 'aaron.heckmann+github@gmail.com')
];

app.get('/users', function(req, res){
  res.render('users', { users: users });
});
*/


//app.get('/', routes.index);

var home = require('./lib/home');
var las = require('./lib/las');

app.use(home);
app.use(las);


/*
io.sockets.on('connection', function (socket) {
  socket.emit('greeting', { hello: 'world' });


  socket.on('lasdoc', function (data) {
    console.log('OH MY GOD, A LASDOC, heres data: '+data);
  });
  app.on('event:lasdoc', function (data) {
    console.log('OH MY GOD, A LASDOC, heres data: '+data);
  });

  socket.on('two', function (data) {
    console.log('two received, heres data: '+data);
  });

});
*/
