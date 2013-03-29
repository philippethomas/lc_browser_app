var app = require('./app').app


exports.list = function(req, res){
  res.render('petra', { 
    title: 'IHS Petra'
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
