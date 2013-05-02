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
var docTemplates = require('lc_file_crawlers/docTemplates.js');
var ep_files_filters = require('lc_file_crawlers/docTemplates.js').navSearchFilters;
var sf = [];
var searchFilters = sf.concat(ep_files_filters);
app.locals({
  searchFilters: searchFilters,
  docTemplates: docTemplates,
});



//TODO maybe store config stuff for the Express app elsewhere: 
//check out https://github.com/flatiron/nconf
var es = require('./models/elasticsearcher.js');
AppES = new ElasticSearcher({ host: 'localhost', port: 9200 });


var home = require('./home');
app.get('/', home.index);
app.post('/ajaxPreviousCrawls', home.ajaxPreviousCrawls);


var ep_files = require('./ep_files');
app.get('/ep_files', ep_files.index);
app.post('/ep_files_crawl', ep_files.crawl);
app.post('/stats', ep_files.stats);

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
app.post('/csvExport', search.csvExport);
//app.get('/search',search.search);


var maintenance = require('./maintenance');
app.get('/maintenance/indexInit', maintenance.indexInit);
app.get('/maintenance/indexStatus', maintenance.indexStatus);
app.get('/maintenance/indexMapping', maintenance.indexMapping);
//app.get('/maintenance/purge/:idx', maintenance.purge


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


app.on('lasdoc', function(data){
  io.sockets.emit('lasdoc', data);
});

app.on('sgydoc', function(data){
  io.sockets.emit('sgydoc', data);
});

app.on('walkerDone', function(data){
  io.sockets.emit('walkerDone', data);
});




module.exports.app = app;
module.exports.docTemplates = docTemplates;
