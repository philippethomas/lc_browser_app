var util = require('util');


exports.index = function(req, res){
  res.render('home/index', { 
    title: 'LogicalCat Home',
  });
};



exports.setWorkStatus = function(req, res){
  working = req.body.working; 
  res.send ({ working: working });
};

exports.getWorkStatus = function(req, res){
  res.send ({ working: working });
};


