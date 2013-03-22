//var EventEmitter = require('events').EventEmitter;
//var xxx = new EventEmitter();

//xxx.on('lasdoc', function(d){
//  console.log('ooooooooooooooooooooooooooooooooooo '+d.guid);
//});

var app = require('./app').app


exports.list = function(req, res){
  res.render('las', { 
    title: 'LAS'
  });
};


exports.test = function(req, res){
  console.log('test');
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

