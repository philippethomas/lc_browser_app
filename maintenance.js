
exports.indexInit = function(req, res){
  AppES.indexInit(function(error, result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};


exports.indexStatus = function(req, res){
  AppES.indexStatus(function(error,result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};


exports.indexMapping = function(req, res){
  AppES.indexMapping('lc_app_idx', function(error,result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};

