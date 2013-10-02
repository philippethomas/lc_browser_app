var async = require('async');
var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');


ElasticSearcher = function(opts){
  ESClient = new ElasticSearchClient({ host: opts.host, port: opts.port });
};




ElasticSearcher.prototype.doSearch = function(indices, from, size, query, callback){

  var qryObj = {
    "from": from,
    "size": size,
    "query": { "query_string": { "query": query, "default_operator": "AND" } },
    "sort": [ { "crawled": {"order": "desc"} } ]
  };

  var total = 0;
  var docs = [];
  ESClient.search(indices, qryObj)

    .on('error', function(error) {
      return callback(error);
    })

  .on('data', function(data) {
    data = JSON.parse(data);
    if (data.error){
      return callback(data.error);
    }else{
      total = data.hits.total;
      data.hits.hits.forEach(function(hit){
        docs.push(hit._source);
      });
    }
  })

  .on('done', function(){
    return callback(null, { total: total, docs: docs });
  }).exec()

}









// spatial mappings ////////////////////////////////////////////////////////////

var spatialESMapping = { 

  "uwi":{ "properties":{
    "source":        {"type":"string"},
    "updated":       {"type":"date"},
    "uwi":           {"type":"string"},
    "lat":           {"type":"float", "index":"not_analyzed"},
    "lon":           {"type":"float", "index":"not_analyzed"},
    "geo_loc":       {"type":"geo_point"}
  }},

  "box":{ "properties":{
    "source":        {"type":"string"},
    "updated":       {"type":"date"},
    "uwi":           {"type":"string"},
    "lat":           {"type":"float", "index":"not_analyzed"},
    "lon":           {"type":"float", "index":"not_analyzed"},
    "geo_loc":       {"type":"geo_shape"}
  }}


}




// index maintenance ///////////////////////////////////////////////////////////

/**
 * 
 *
 */
ElasticSearcher.prototype.deleteIndex = function(doctype, callback){
  var idxName =  doctype+'_idx';

  ESClient.deleteIndex(idxName)
    .on('data', function(data) {
      data = JSON.parse(data);
      if(data.ok){
        callback(null, 'Deleted index: '+idxName);
      } else if (data.status === 404) {
        callback(null, 'Index did not exist: '+idxName);
      } else {
        callback(data);
      }
    }).exec()
}


/**
 * 
 *
 */
ElasticSearcher.prototype.createIndex = function(doctype, idxMapping, callback){
  var idxName = doctype+'_idx';

  ESClient.createIndex(idxName,{"mappings":idxMapping})
    .on('data', function(data) {
      data = JSON.parse(data);
      if(data.ok){
        callback(null, 'Created index: '+idxName);
      }else{
        callback(data);
      }
    }).exec()
}


/**
 *
 *
 */
ElasticSearcher.prototype.initIndex = function(doctype, callback){

  var idxMapping = spatialESMapping;
  var self = this;

  async.series([

      function(cb){
        self.deleteIndex(doctype, function(err, result){
          if (err) { 
            cb(err);
          } else {
            cb(null, result);
          }
        });
      },

      function(cb){
        self.createIndex(doctype, idxMapping, function(err, result){
          if (err) { 
            cb(err);
          } else {
            cb(null, result);
          }
        });
      }

  ], function(error, result){
    if (error) {
      return callback(error);
    } else {
      return callback(null, result);
    }

  });
}


















module.exports = ElasticSearcher;
