var fs = require('graceful-fs');
var express = require('express');
//var winston = require('winston');
var S = require('string');
var app = express();
var app_port = process.argv[2] || 8008
var logger = require('./logging');

//io.set('transports', [ 'jsonp-polling' ]);
//var flash = require('connect-flash');
//var expressValidator = require('express-validator');

////////////////////////////////////////////////////////////////////////////////

var server = app.listen(app_port, function(){
  logger.info('_____ launching LogicalCat browser on port '+app_port);
});
var io = require('socket.io').listen(server);

////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
//set hasXXX conditionals all to false too

var app_es = require('./models/elasticsearcher.js');
var app_ES = new app_es({host:config.es_host, port:config.es_port});
app.use(function(req, res, next){
  res.locals.app_ES = app_ES;
  res.locals.hasDOX = false;
  res.locals.hasEPF = false;
  res.locals.hasGGX = false;
  res.locals.hasPET = false;
  res.locals.hasTKS = false;
  next();
});


////////////////////////////////////////////////////////////////////////////////

var filters = [];
var docTemplates = [];

////////////////////////// MODULARIZATION STUFF BELOW //////////////////////////
// IMPORTANT: modify navlinks.jade and layout.jade if adding any new modules

var has_epf = (fs.existsSync(__dirname+'/node_modules/lc_epf_crawlers/cli.js'))
  ? true : false;
var has_pet = (fs.existsSync(__dirname+'/node_modules/lc_pet_crawlers/cli.js'))
  ? true : false;
var has_ggx = (fs.existsSync(__dirname+'/node_modules/lc_ggx_crawlers/cli.js'))
  ? true : false;
var has_tks = (fs.existsSync(__dirname+'/node_modules/lc_tks_crawlers/cli.js'))
  ? true : false;
var has_dox = (fs.existsSync(__dirname+'/node_modules/lc_dox_crawlers/cli.js'))
  ? true : false;

////////////////////////////////////////////////////////////////////////////////
// first, declare app.use stuff before ANY middleware app.router stuff...

if (has_epf) {
  var epf_es = require(__dirname+'/node_modules/lc_epf_crawlers/elasticsearcher.js');
  var epf_ES = new epf_es({host:config.es_host, port:config.es_port});

  var epfFilt = require('lc_epf_crawlers/epf_doc_templates.js').searchFilters;
  filters = filters.concat(epfFilt);

  var epfTemplates = require('lc_epf_crawlers/epf_doc_templates.js').templates;
  docTemplates = docTemplates.concat(epfTemplates);

  app.use(function(req, res, next){
    res.locals.hasEPF = true;
    res.locals.epf_ES = epf_ES;
    next();
  });
}

if (has_dox) {
  var dox_es = require(__dirname+'/node_modules/lc_dox_crawlers/elasticsearcher.js');
  var dox_ES = new dox_es({host:config.es_host, port:config.es_port});

  var doxFilt = require('lc_dox_crawlers/dox_doc_templates.js').searchFilters;
  filters = filters.concat(doxFilt);

  var doxTemplates = require('lc_dox_crawlers/dox_doc_templates.js').templates;
  docTemplates = docTemplates.concat(doxTemplates);

  app.use(function(req, res, next){
    res.locals.hasDOX = true;
    res.locals.dox_ES = dox_ES;
    next();
  });
}

if (has_pet) {
  var pet_es = require(__dirname+'/node_modules/lc_pet_crawlers/elasticsearcher.js');
  var pet_ES = new pet_es({host: config.es_host, port:config.es_port});

  var petFilt = require('lc_pet_crawlers/pet_doc_templates.js').searchFilters;
  filters = filters.concat(petFilt);

  var petTemplates = require('lc_pet_crawlers/pet_doc_templates.js').templates;
  docTemplates = docTemplates.concat(petTemplates);
  app.use(function(req, res, next){
    res.locals.hasPET = true;
    res.locals.pet_ES = pet_ES;
    next();
  });
}

if (has_ggx) {
  var ggx_es = require(__dirname+'/node_modules/lc_ggx_crawlers/elasticsearcher.js');
  var ggx_ES = new ggx_es({host:config.es_host, port:config.es_port});

  var ggxFilt = require('lc_ggx_crawlers/ggx_doc_templates.js').searchFilters;
  filters = filters.concat(ggxFilt);

  var ggxTemplates = require('lc_ggx_crawlers/ggx_doc_templates.js').templates;
  docTemplates = docTemplates.concat(ggxTemplates);

  app.use(function(req, res, next){
    res.locals.hasGGX = true;
    res.locals.ggx_ES = ggx_ES;
    next();
  });
}

if (has_tks) { //not actually here yet
  var tks_es = require(__dirname+'/node_modules/lc_tks_crawlers/elasticsearcher.js');
  var tks_ES = new tks_es({host:config.es_host, port:config.es_port});

  var tksFilters = require('lc_tks_crawlers/tks_doc_templates.js').searchFilters;
  filters = filters.concat(tksFilters);

  var tksTemplates = require('lc_tks_crawlers/tks_doc_templates.js').templates;
  docTemplates = docTemplates.concat(tksTemplates);

  app.use(function(req, res, next){
    res.locals.hasTKS = true;
    res.locals.tks_ES = tks_ES;
    next();
  });
}

////////////////////////////////////////////////////////////////////////////////
// ...then define routes

if (has_epf) {
  var epf_app = require('lc_epf_crawlers/epf_app');
  app.use('/epf', epf_app);
  app.use(express.static(__dirname + '/node_modules/lc_epf_crawlers/pub'));
}

if (has_dox) {
  var dox_app = require('lc_dox_crawlers/dox_app');
  app.use('/dox', dox_app);
  app.use(express.static(__dirname + '/node_modules/lc_dox_crawlers/pub'));
}

if (has_pet) {
  var pet_app = require('lc_pet_crawlers/pet_app');
  app.use('/pet', pet_app);
  app.use(express.static(__dirname + '/node_modules/lc_pet_crawlers/pub'));
}

if (has_ggx) {
  var ggx_app = require('lc_ggx_crawlers/ggx_app');
  app.use('/ggx', ggx_app);
  app.use(express.static(__dirname + '/node_modules/lc_ggx_crawlers/pub'));
}

if (has_tks) { //not actually here yet :)
  var tks_app = require('lc_tks_crawlers/tks_app');
  app.use('/tks', tks_app);
  app.use(express.static(__dirname + '/node_modules/lc_tks_crawlers/pub'));
}

////////////////////////////////////////////////////////////////////////////////

var getTemplate = function(doctype) {
  return docTemplates.filter(function(t){ return t.doctype === doctype; })[0];
}

// NOTE: similar function also exists in each scanner for command-line use
function csvRowString(doc){
  var keys = getTemplate(doc.doctype).keys;
  var a = [];
  keys.forEach(function(key){
    var val = doc[key];
    if (val === undefined) {
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
// add the "global" functions used by lc_crawlers

app.use(function(req, res, next){
  res.locals.searchFilters = filters;
  res.locals.getTemplate = getTemplate;
  res.locals.csvRowString = csvRowString;
  next();
});

////////////////////////////////////////////////////////////////////////////////

var home = require('./home');
app.get('/',               home.index);
app.post('/setWorkStatus', home.setWorkStatus);
app.get('/getWorkStatus',  home.getWorkStatus);
app.post('/initLocs',      home.initLocs);

////////////////////////////////////////////////////////////////////////////////

var search = require('./search');
app.post('/ajaxSearch',    search.ajaxSearch);
app.post('/docDetail',     search.docDetail);
app.post('/search',        search.search);
app.post('/csvExport',     search.csvExport);
app.get('/search',         home.index);

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

app.on('browserMessage', function(data){
  io.sockets.emit('browserMessage', data);
});

app.on('workStop', function(data){
  io.sockets.emit('workStop', data);
});

////////////////////////////////////////////////////////////////////////////////
// "working" controls spinner and flow during and after a crawl
var working = 'no';
////////////////////////////////////////////////////////////////////////////////


exports.working = working;
module.exports.app = app;
module.exports.io = io;
