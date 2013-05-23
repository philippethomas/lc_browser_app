var createHash = require('crypto').createHash;
var util = require('util');
var humanize = require('humanize');
var fork = require('child_process').fork;
  
//var scanner = require('lc_file_crawlers/scanner.js');

exports.index = function(req, res){

  AppES.previousCrawls('ep_files', function(error, result){
    if(error){
      util.debug(error);
    }else{
      result.previous.forEach(function(x){
	x['crawled'] = humanize.date('Y-M-d h:i:s A', new Date(x['crawled'])); 
      });
      res.render('ep_files', { 
	title: 'E&P Files',
	previousCrawls: result.previous
      });
    }
  });

};




/*
exports.flash = function(req, res){
  req.flash('info', 'Flash is Flashy')
  res.render('ep_files', { 
    message: req.flash(),
    title: 'E&P Files'
  });
};
*/


/**
 * Invoke the scanner of the ep_files crawler cli with supplied args.
 * The real-time message path from crawler to webpage is...complicated.
 * scan.publish --> parrot.emit --> process.send --> app.emit --> socket.io
 */
exports.crawl = function(req, res){
  var app = require('./app').app;

  var label = req.body.label || 'unlabeled';
  var es_host = req.body.es_host || 'localhost';
  var es_port = req.body.es_port || '9200';
  var fw_root = req.body.fw_root || 'c:/temp';
  var work_dir = req.body.work_dir || process.env.TMP;

  var write_csv = req.body.write_csv;
  var write_es = true; //see below
  var zip_las = req.body.zip_las;
  var shp_feat = Math.round(req.body.shp_feat);
  var ras_clip = req.body.ras_clip;
  var find_LAS = req.body.find_LAS;
  var find_SHP = req.body.find_SHP;
  var find_SGY = req.body.find_SGY;
  var find_RAS = req.body.find_RAS;
  var cs_max = 26214400;
  var ras_max_size = 10485760;
  var ras_max_ar = 0.1;

  var opts = { 
    label: label,
    es_host: es_host,
    es_port: es_port,
    fw_root: fw_root,
    work_dir: work_dir,
    write_csv: write_csv,
    write_es: write_es,
    zip_las: zip_las,
    shp_feat: shp_feat,
    ras_clip: ras_clip,
    find_LAS: find_LAS,
    find_SHP: find_SHP,
    find_SGY: find_SGY,
    find_RAS: find_RAS,
    cs_max: cs_max,
    ras_max_size: ras_max_size,
    ras_max_ar: ras_max_ar
  }

  opts.doctype = 'ep_files_crawl';
  opts.guid = guidify(JSON.stringify(opts));
  opts.crawled = new Date().toISOString();

  var child = fork('./node_modules/lc_file_crawlers/scanner.js');

  AppES.saveCrawl(opts, function(error,result){
    if (error) {
      util.debug(error);
    } else {
      if (result.ok) {
	opts.in_browser = true; 
	app.emit('workStart', 'scanning '+opts.fw_root);
	child.on('message', function(m){ app.emit(m.type, m.doc); });
	child.send( {message: opts} );
      }
    }
  });
  
  res.end();

};




//----------
// used to make a sort of natural key as doc id
var guidify = function(s){
  var guid = createHash('md5');
  guid.update(s);
  return guid.digest('hex');
}
