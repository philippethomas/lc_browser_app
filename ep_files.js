
exports.list = function(req, res){
  res.render('ep_files', { 
    title: 'E&P Files'
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


exports.save_and_run = function(req, res){

  var app = require('./app').app

  var label = req.body.label || 'unlabeled';
  var es_url = req.body.es_url || 'http://localhost:9200';
  var fw_root = req.body.fw_root || 'c:/temp';
  var work_dir = req.body.work_dir || process.env.TMP;

  var write_csv = req.body.write_csv;
  var write_es = req.body.write_es;
  var zip_las = req.body.zip_las;
  var shp_feat = req.body.shp_feat || 50;
  var img_size = req.body.img_size || 300;
  var sgy_deep = req.body.sgy_deep; 
  var find_LAS = req.body.find_LAS;
  var find_SHP = req.body.find_SHP;
  var find_SGY = req.body.find_SGY;
  var find_IMG = req.body.find_IMG;
  var cs_max = 26214400;
  var app = app;

  /*
  req.assert('label', 'Invalid field: label').isAlphanumeric();
  req.assert('es_url', 'Invalid field: es_url').isUrl();
  req.assert('fw_root', 'Invalid field: fw_root').regex(/^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/);
  req.assert('work_dir', 'Invalid field: workdir').regex(/^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/);

  req.sanitize('write_csv').toBoolean();
  req.sanitize('write_es').toBoolean();

  req.sanitize('zip_las').toBoolean();
  req.assert('shp_feat', 'Invalid field: shp_feat').isInt();
  req.assert('img_size', 'Invalid field: img_size').isInt();
  req.sanitize('sgy_deep').toBoolean();

  req.sanitize('find_LAS').toBoolean();;
  req.sanitize('find_SGY').toBoolean();
  req.sanitize('find_IMG').toBoolean();
  */

  //req.assert('cs_max', 'Invalid field: cs_max').isInt();


  //var errors = req.validationErrors();
  console.log('*****************************');
  //console.log(errors);
  console.log('*****************************');
  /*
  if (errors){ 
    req.flash('info', "CHECK YO FORM");
    res.render('ep_files', { 
      message: req.flash(),
      title: 'AFTER CLICK'
    });
  }
  */


  var opts = { 
    label: label,
    es_url: es_url,
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
    app: app
  }

  var scanner = require('lc_file_crawlers/scanner.js');
  console.log('@@@@@@@@@@@@@ new scan @@@@@@@@@@@@@'+new Date().toISOString());

  scanner.scan(opts);
  

};



