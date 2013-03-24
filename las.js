
var app = require('./app').app


exports.list = function(req, res){
  res.render('las', { 
    title: 'LAS'
  });
};



exports.run_and_save_crawl = function(req, res){
  //todo add validator.check and such after github is back

  //var label = req.body.label || 'unlabeled';
  var fw_root = req.body.fw_root;
  var zip_las = req.body.zip_las || false;
  
  req.assert('label', 'Invalid urlparam').isInt();
  var errors = req.validationErrors();
  console.log(errors);

  //console.log('label='+label+'  fw_root='+fw_root+'  zip_las='+zip_las);

  res.redirect('back');
};


exports.test = function(req, res){

  res.render('las', { 
    title: 'LAS' 
  });
  
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
    cs_max: 26214400,
    app: app
  }
  scanner.scan(fakeOpts);

}

