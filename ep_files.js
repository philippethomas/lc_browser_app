var createHash = require('crypto').createHash

exports.list = function(req, res){

  /*
  AppES.search('las', 'las', function(error, result){
    if(error){
      console.log(error);
    }else{
      stuff = result;
    }
  });
  */

  AppES.priorCrawlsAndDocs('ep_files', function(error, result){
    if(error){
      console.log(error);
    }else{
      res.render('ep_files', { 
	title: 'E&P Files',
	previousCrawls: result.previousCrawls,
	searchResults: result.searchResults
      });
    }

  });

  /*
  AppES.getPreviousCrawls('ep_files_crawl', function(error, result){
    if(error){
      console.log(error);
      res.send(error);
    }else{

      res.render('ep_files', { 
	title: 'E&P Files',
	previousCrawls: result,
	stuff: stuff
      });

    }
  });
  */


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


exports.save_and_run = function(req, res){
  var app = require('./app').app;

  var label = req.body.label || 'unlabeled';
  var es_host = req.body.es_host || 'localhost';
  var es_port = req.body.es_port || '9200';
  var fw_root = req.body.fw_root || 'c:/temp';
  var work_dir = req.body.work_dir || process.env.TMP;

  var write_csv = req.body.write_csv;
  var write_es = req.body.write_es;
  var zip_las = req.body.zip_las;
  var shp_feat = Math.round(req.body.shp_feat);
  var img_size = Math.round(req.body.img_size);
  var sgy_deep = req.body.sgy_deep; 
  var find_LAS = req.body.find_LAS;
  var find_SHP = req.body.find_SHP;
  var find_SGY = req.body.find_SGY;
  var find_IMG = req.body.find_IMG;
  var cs_max = 26214400;

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
    img_size: img_size,
    sgy_deep: sgy_deep,
    find_LAS: find_LAS,
    find_SHP: find_SHP,
    find_SGY: find_SGY,
    find_IMG: find_IMG,
    cs_max: cs_max,
  }

  // add some attributes for storing in ElasticSearch
  opts.doctype = 'ep_files_crawl';
  opts.guid = guidify(JSON.stringify(opts));
  opts.crawled = new Date().toISOString();

  AppES.writeDoc(opts, function(error,result){
    if(error){
      console.log(error);
    }else{
      if (result.ok){
	opts.app = app; // hijack app's EventEmitter properties

	var scanner = require('lc_file_crawlers/scanner.js');
	scanner.scan(opts);
      }
    }
  });
  
  
  

};


//----------
// used to make a sort of natural key as doc id
var guidify = function(s){
  var guid = createHash('md5');
  guid.update(s);
  return guid.digest('hex');
}
