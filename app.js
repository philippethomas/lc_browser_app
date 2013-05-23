var express = require('express');
//var flash = require('connect-flash');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);
//io.set('transports', [ 'jsonp-polling' ]);
//var expressValidator = require('express-validator');
//var humanize = require('humanize');


// Configuration
var store  = new express.session.MemoryStore;
app.configure(function(){
  app.use(express.bodyParser());
  //app.use(expressValidator);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.methodOverride());
  app.use(express.cookieParser('logicalcat'));
  app.use(express.session({ secret: 'lOgIcAlCaT', store: store }));
  //app.use(express.session({cookie:{maxAge:60000}}));
  //app.use(flash());
  app.use(express.static(__dirname + '/public'));
})


//merge stuff together later after we get more crawlers
//
var epDocTemplates = require('lc_file_crawlers/epDocTemplates.js');
var ep_files_filters = require('lc_file_crawlers/epDocTemplates.js').navSearchFilters;
var ep_type_list = require('lc_file_crawlers/epDocTemplates.js').typeList;
var sf = [];
var searchFilters = sf.concat(ep_files_filters);
app.locals({
  searchFilters: searchFilters,
  epDocTemplates: epDocTemplates,
});


global.working = 'no';

//TODO maybe store config stuff for the Express app elsewhere: 
//check out https://github.com/flatiron/nconf
var es = require('./models/elasticsearcher.js');
AppES = new ElasticSearcher({ host: 'localhost', port: 9200 });


var home = require('./home');
app.get('/', home.index);
app.post('/getCrawlDoc', home.getCrawlDoc);
app.post('/setWorkStatus', home.setWorkStatus);
app.post('/getWorkStatus', home.getWorkStatus);
app.post('/stats', home.stats);


var ep_files = require('./ep_files');
app.get('/ep_files', ep_files.index);
app.post('/ep_files_crawl', ep_files.crawl);

var petra = require('./petra');
app.get('/petra', petra.stats);
app.post('/petra_crawl', petra.crawl);

/*
var discovery = require('./discovery');
app.get('/discovery', discovery.stats);
app.post('/discovery_crawl', discovery.crawl);

var kingdom = require('./kingdom');
app.get('/kingdom', kingdom.stats);
app.post('/kingdom_crawl', kingdom.crawl);
*/

var search = require('./search');
app.post('/ajaxSearch', search.ajaxSearch);
app.post('/ajaxGetDoc', search.ajaxGetDoc);
app.post('/search', search.search);
app.get('/search', home.index);
app.post('/csvExport', search.csvExport);
app.post('/previousQuery', search.previousQuery);


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


/********** socket stuff **********/

ep_type_list.forEach(function(d){
  app.on(d+'doc', function(data){
    io.sockets.emit(d+'doc', data);
  });
});

/*
app.on('lasdoc', function(data){
  io.sockets.emit('lasdoc', data);
});

app.on('sgydoc', function(data){
  io.sockets.emit('sgydoc', data);
});

app.on('rasdoc', function(data){
  io.sockets.emit('rasdoc', data);
});

app.on('shpdoc', function(data){
  io.sockets.emit('shpdoc', data);
});
*/

app.on('workStart', function(data){
  io.sockets.emit('workStart', data);
});
app.on('workStop', function(data){
  io.sockets.emit('workStop', data);
});




module.exports.app = app;
module.exports.io = io;
module.exports.epDocTemplates = epDocTemplates;
