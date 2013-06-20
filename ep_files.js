var createHash = require('crypto').createHash;
var util = require('util');
var humanize = require('humanize');
var fork = require('child_process').fork;
  
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
 */
exports.crawl = function(req, res){
  var app = require('./app').app;

  var ep_label = req.body.ep_label || 'unlabeled';
  var ep_es_host = req.body.ep_es_host || 'localhost';
  var ep_es_port = req.body.ep_es_port || '9200';
  var ep_fw_root = req.body.ep_fw_root || 'c:/temp';
  var ep_work_dir = req.body.ep_work_dir || process.env.TMP;

  var ep_write_csv = req.body.ep_write_csv;
  var ep_write_es = true; //see below
  var ep_zip_las = req.body.ep_zip_las;
  var ep_shp_feat = Math.round(req.body.ep_shp_feat);
  var ep_ras_clip = req.body.ep_ras_clip;
  var ep_find_LAS = req.body.ep_find_LAS;
  var ep_find_SHP = req.body.ep_find_SHP;
  var ep_find_SGY = req.body.ep_find_SGY;
  var ep_find_RAS = req.body.ep_find_RAS;
  var ep_cs_max = 25 * Math.pow(1024,2);
  var ep_ras_max_size = 8 * Math.pow(1024,2);
  var ep_ras_max_ar = 0.1;

  var opts = { 
    ep_label: ep_label,
    ep_es_host: ep_es_host,
    ep_es_port: ep_es_port,
    ep_fw_root: ep_fw_root,
    ep_work_dir: ep_work_dir,
    ep_write_csv: ep_write_csv,
    ep_write_es: ep_write_es,
    ep_zip_las: ep_zip_las,
    ep_shp_feat: ep_shp_feat,
    ep_ras_clip: ep_ras_clip,
    ep_find_LAS: ep_find_LAS,
    ep_find_SHP: ep_find_SHP,
    ep_find_SGY: ep_find_SGY,
    ep_find_RAS: ep_find_RAS,
    ep_cs_max: ep_cs_max,
    ep_ras_max_size: ep_ras_max_size,
    ep_ras_max_ar: ep_ras_max_ar
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
        app.emit('crawlStart', 'scanning '+opts.ep_fw_root);
        child.on('message', function(m){ app.emit(m.type, m.msg); });
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
