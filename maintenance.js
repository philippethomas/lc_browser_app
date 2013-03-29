var es = require('./models/elasticsearch.js');


exports.indexInit = function(req, res){
  es.indexInit(function(error, result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};

exports.indexStatus = function(req, res){
  es.indexStatus(function(error,result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};


exports.indexMapping = function(req, res){
  es.indexMapping(function(error,result){
    if(error){
      res.send(error);
    }else{
      res.send(result);
    }
  });
};
