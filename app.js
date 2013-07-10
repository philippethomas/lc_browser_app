var fs = require('graceful-fs');
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


require('./models/elasticsearcher.js');
AppES = new ElasticSearcher({ host: 'localhost', port: 9200 });

////////////////////////////////////////////////////////////////////////////////

var searchFilters = [];
var docTemplates = [];

////////////////////////// MODULARIZATION STUFF BELOW //////////////////////////
//
// also check: 
// views/navlinks.jade

var hasEPF = (fs.existsSync('./node_modules/lc_epf_crawlers')) ? true : false;
var hasPET = (fs.existsSync('./node_modules/lc_pet_crawlers')) ? true : false;
var hasGGX = (fs.existsSync('./node_modules/lc_ggx_crawlers')) ? true : false;
var hasTKS = (fs.existsSync('./node_modules/lc_tks_crawlers')) ? true : false;

if (hasEPF) {

  var epf_app = require('lc_epf_crawlers/epf_app');
  app.use('/epf', epf_app);
  app.use(express.static(__dirname + '/node_modules/lc_epf_crawlers/pub'));

  var epf_filters = require('lc_epf_crawlers/epfDocTemplates.js').searchFilters;
  var epf_templates = require('lc_epf_crawlers/epfDocTemplates.js');

  searchFilters = searchFilters.concat(epf_filters);
  docTemplates = epf_templates;

  //app.post('/epf/epfDoctypes', epf_app.epfDoctypes);
  //var ep_type_list = require('lc_file_crawlers/epDocTemplates.js').typeList;

  require('./node_modules/lc_epf_crawlers/elasticsearcher.js');
  EPF_ES = new ElasticSearcher({ host: 'localhost', port: 9200 });
}

if (hasPET) {
}

if (hasGGX) {
}

if (hasTKS) {
}

////////////////////////////////////////////////////////////////////////////////

global.searchFilters = searchFilters;
global.docTemplates = docTemplates;
global.hasEPF = hasEPF;
global.hasPET = hasPET;
global.hasGGX = hasGGX;
global.hasTKS = hasTKS;

////////////////////////////////////////////////////////////////////////////////

//var epDocTemplates = require('lc_file_crawlers/epDocTemplates.js');
//var ep_files_filters = require('lc_file_crawlers/epDocTemplates.js').navSearchFilters;
//var ep_type_list = require('lc_file_crawlers/epDocTemplates.js').typeList;
//var sf = [];
//var searchFilters = sf.concat(ep_files_filters);


global.working = 'no';

//TODO maybe store config stuff for the Express app elsewhere: 
//check out https://github.com/flatiron/nconf




////////////////////////////////////////////////////////////////////////////////

var home = require('./home');
app.get('/',               home.index);
app.post('/setWorkStatus', home.setWorkStatus);
app.post('/getWorkStatus', home.getWorkStatus);


////////////////////////////////////////////////////////////////////////////////

var search = require('./search');
app.post('/ajaxSearch', search.ajaxSearch);
app.post('/ajaxGetDoc', search.ajaxGetDoc);
app.post('/search', search.search);
app.post('/csvExport', search.csvExport);
app.get('/search', home.index);

////////////////////////////////////////////////////////////////////////////////

//var maintenance = require('./maintenance');
//app.get('/maintenance/indexInit', maintenance.indexInit);
//app.get('/maintenance/indexStatus', maintenance.indexStatus);
//app.get('/maintenance/indexMapping', maintenance.indexMapping);

////////////////////////////////////////////////////////////////////////////////

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


////////////////////////////////////////////////////////////////////////////////

app.on('parsedDoc', function(data){
  io.sockets.emit('parsedDoc', data);
});

app.on('workStart', function(data){
  io.sockets.emit('workStart', data);
});

//app.on('showHit', function(data){
//  io.sockets.emit('showHit', data);
//});

//app.on('clearHits', function(){
//  io.sockets.emit('clearHits', null);
//});

app.on('workStop', function(data){
  io.sockets.emit('workStop', data);
});


////////////////////////////////////////////////////////////////////////////////


module.exports.app = app;
module.exports.io = io;
//var epfDocTemplates = require('lc_file_crawlers/epfDocTemplates.js');
//module.exports.epfDocTemplates = epfDocTemplates;
