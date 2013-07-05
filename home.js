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



/** returns a single crawl object to populate a crawl form */
exports.getCrawlDoc = function(req, res){
  var idx = 'lc_app_idx';
  var query = 'guid:'+req.body.guid;
  var from = 0;
  var size = 1;
  
  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      res.send({ crawl: result.docs[0] });
    }
  });

};


