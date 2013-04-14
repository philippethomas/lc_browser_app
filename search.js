exports.ajaxSearch = function(req, res){
  var app = require('./app').app;

  var idx = req.body.searchFilter;
  var query = req.body.searchText; 
  var from = req.body.from || 0;
  var size = req.body.size || 20;

  console.log('---+++------------');
  console.log(idx+' '+query+' '+from+' '+size);
  console.log('---+++------------');

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      console.log(error);
    }else{
      //app.emit('lasdoc', {crawled:'asdfasdfasdf'});
      //res.send( { docs: result.docs, total: result.total, session: req.session } );
      result.docs.forEach(function(doc){
	console.log('emitting '+doc.guid);
	app.emit('lasdoc', doc);
      });

    }
  });

  res.end();

}



