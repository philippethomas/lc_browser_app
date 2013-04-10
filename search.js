
exports.index = function(req, res){

  var idx = req.body.searchFilter;
  var query = req.body.searchText; 

  console.log('filter='+idx+'    text='+query);
  



  AppES.doSearch(idx, 0, 20, query, function(error, result){
    if(error){
      console.log(error);
    }else{
      res.render('search', { 
	title: 'Search Results',
	searchResults: result
      });

    }
  });


};
