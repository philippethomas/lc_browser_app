
exports.index = function(req, res){


  var filter = req.body.searchFilter;
  var text = req.body.searchText; 
  console.log(filter+'    '+text);
  



  AppES.search('las', text, function(error, result){
    if(error){
      console.log('---------------ERRRRRRRRR');
      console.log(error);
      res.send(error);
    }else{
      console.log('---------------------');
      //console.log(result);

      res.render('search', { 
	title: 'Search Results',
	searchResults: result
      });

    }
  });


};
