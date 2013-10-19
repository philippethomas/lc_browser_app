var fs = require('graceful-fs');
var express = require('express');
var S = require('string');
//var flash = require('connect-flash');
var app = express();
var server = app.listen(3000, function(){
  console.log('LogicalCat browser listening on port 3000');
});
var io = require('socket.io').listen(server);
//io.set('transports', [ 'jsonp-polling' ]);
//var expressValidator = require('express-validator');
//var humanize = require('humanize');


var config = require('./config.json')

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
//note it's global...
AppES = new ElasticSearcher({ host: config.es_host, port: config.es_port });

////////////////////////////////////////////////////////////////////////////////

var searchFilters = [];
var docTemplates = [];

////////////////////////// MODULARIZATION STUFF BELOW //////////////////////////

// IMPORTANT: modify navlinks.jade and layout.jade if adding any new modules

var hasEPF = (fs.existsSync('./node_modules/lc_epf_crawlers')) ? true : false;
var hasPET = (fs.existsSync('./node_modules/lc_pet_crawlers')) ? true : false;
var hasGGX = (fs.existsSync('./node_modules/lc_ggx_crawlers')) ? true : false;
var hasTKS = (fs.existsSync('./node_modules/lc_tks_crawlers')) ? true : false;
var hasDOX = (fs.existsSync('./node_modules/lc_dox_crawlers')) ? true : false;

if (hasEPF) {
  var epf_app = require('lc_epf_crawlers/epf_app');
  app.use('/epf', epf_app);
  app.use(express.static(__dirname + '/node_modules/lc_epf_crawlers/pub'));

  var epfFilters = require('lc_epf_crawlers/epf_doc_templates.js').searchFilters;
  var epfTemplates = require('lc_epf_crawlers/epf_doc_templates.js').templates;

  searchFilters = searchFilters.concat(epfFilters);
  docTemplates = docTemplates.concat(epfTemplates);

  require('./node_modules/lc_epf_crawlers/elasticsearcher.js');
  EPF_ES = new ElasticSearcher({ host: config.es_host, port: config.es_port });
}

if (hasPET) {
  var pet_app = require('lc_pet_crawlers/pet_app');
  app.use('/pet', pet_app);
  app.use(express.static(__dirname + '/node_modules/lc_pet_crawlers/pub'));

  var petFilters = require('lc_pet_crawlers/pet_doc_templates.js').searchFilters;
  var petTemplates = require('lc_pet_crawlers/pet_doc_templates.js').templates;

  searchFilters = searchFilters.concat(petFilters);
  docTemplates = docTemplates.concat(petTemplates);

  require('./node_modules/lc_pet_crawlers/elasticsearcher.js');
  PET_ES = new ElasticSearcher({ host: config.es_host, port: config.es_port });
}

if (hasGGX) {
  var ggx_app = require('lc_ggx_crawlers/ggx_app');
  app.use('/ggx', ggx_app);
  app.use(express.static(__dirname + '/node_modules/lc_ggx_crawlers/pub'));

  var ggxFilters = require('lc_ggx_crawlers/ggx_doc_templates.js').searchFilters;
  var ggxTemplates = require('lc_ggx_crawlers/ggx_doc_templates.js').templates;

  searchFilters = searchFilters.concat(ggxFilters);
  docTemplates = docTemplates.concat(ggxTemplates);

  require('./node_modules/lc_ggx_crawlers/elasticsearcher.js');
  GGX_ES = new ElasticSearcher({ host: config.es_host, port: config.es_port });
}


if (hasTKS) {
  //nobody home yet
}


if (hasDOX) {
  var dox_app = require('lc_dox_crawlers/dox_app');
  app.use('/dox', dox_app);
  app.use(express.static(__dirname + '/node_modules/lc_dox_crawlers/pub'));

  var doxFilters = require('lc_dox_crawlers/dox_doc_templates.js').searchFilters;
  var doxTemplates = require('lc_dox_crawlers/dox_doc_templates.js').templates;

  searchFilters = searchFilters.concat(doxFilters);
  docTemplates = docTemplates.concat(doxTemplates);

  require('./node_modules/lc_dox_crawlers/elasticsearcher.js');
  DOX_ES = new ElasticSearcher({ host: config.es_host, port: config.es_port });
}

////////////////////////////////////////////////////////////////////////////////

var getTemplate = function(doctype) {
  return docTemplates.filter(function(t){ return t.doctype === doctype; })[0];
}

// NOTE: similar function also exists in each scanner for non-browser use
function csvRowString(doc){
  var keys = getTemplate(doc.doctype).keys;
  var a = [];
  keys.forEach(function(key){
    var val = doc[key];
    if (val === undefined) {
      //util.debug('Weird: undefined document key: '+key);
      a.push(null);
    } else if (val === null) {
      a.push(null);
    } else if (key === 'cloud') {
      a.push('(excluded)');
    } else {
      val = S(val).trim().s;
      val = S(val).replaceAll('"', '""').s;
      val = '"'+val+'"';
      a.push(val);
    }
  });
  return a.join(',')+'\r\n';
}

////////////////////////////////////////////////////////////////////////////////

global.searchFilters = searchFilters;
global.docTemplates = docTemplates;
global.getTemplate = getTemplate;
global.csvRowString = csvRowString;
global.hasEPF = hasEPF;
global.hasPET = hasPET;
global.hasGGX = hasGGX;
global.hasTKS = hasTKS;
global.hasDOX = hasDOX;

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
app.get('/getWorkStatus',  home.getWorkStatus);
app.post('/initLocs',      home.initLocs);

////////////////////////////////////////////////////////////////////////////////

var search = require('./search');
app.post('/ajaxSearch', search.ajaxSearch);
app.post('/docDetail', search.docDetail);
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
  //send everything but loc (lat/lon points) to UI
  if (data.doctype != 'loc') { 
    io.sockets.emit('parsedDoc', data);
  }
});

app.on('workStart', function(data){
  io.sockets.emit('workStart', data);
});

app.on('crawlError', function(data){
  io.sockets.emit('crawlError', data);
});

app.on('workStop', function(data){
  io.sockets.emit('workStop', data);
});


////////////////////////////////////////////////////////////////////////////////


module.exports.app = app;
module.exports.io = io;
