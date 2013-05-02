exports.index = function(req, res){
  res.render('index', { 
    title: 'LogicalCat Home'
  });
};


/**
 *
 */
exports.ajaxPreviousCrawls = function(req, res){

  var crawlType = req.body.crawlType;

  AppES.previousCrawls(crawlType, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      res.send( { prevCrawls: result.previousCrawls } );
    }
  });

}
