var humanize = require('humanize');

exports.index = function(req, res){
  res.render('index', { 
    title: 'LogicalCat Home'
  });
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


