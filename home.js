var util = require('util');


exports.index = function(req, res){
  var ep_type_list = require('lc_file_crawlers/epfDocTemplates.js').typeList;
  res.render('home/index', { 
    title: 'LogicalCat Home',
    ep_type_list: ep_type_list
  });
};



exports.setWorkStatus = function(req, res){
  working = req.body.working; 
  res.send ({ working: working });
};

exports.getWorkStatus = function(req, res){
  res.send ({ working: working });
};



/** returns a single crawl object to populate the crawl form */
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


