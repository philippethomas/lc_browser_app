var async = require('async');
var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');
var http = require('http');


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




/**
 * Collect uwis from docs if present. Search loc_idx for matches and then
 * add lat/lon back to original docs. A single query_string using the OR 
 * operator is probably better than doing a single call for every UWI--
 * particularly for zones and formations.
 *
 * TODO: The size parameter might need some tweaking
 */
ElasticSearcher.prototype.addLocations = function(docs, callback){

  var uwis = [];
  quwi = []

  docs.forEach(function(doc){
    if (doc.uwis) {
      uwis = uwis.concat(doc.uwis)
    } else if (doc.uwi) {
      uwis.push(doc.uwi)
    }
  });

  uwis.forEach(function(uwi){
    if (uwi.match(/\d/)) {
      quwi.push('\"'+uwi+'\"');
    } else {
      quwi.push(uwi);
    }
  });

  //if (quwi.length === 0) {
  //  callback(null, docs)
  //}



  var qryObj = {
    "from": 0,
    "size": 50000,
    "query": { "query_string": {
      "fields": ["uwi"],
      "query": quwi.join(' '),
      "default_operator":"OR"
    }}
  }

  var total = 0;
  var locs = [];

  ESClient.search('loc_idx', qryObj)

    .on('error', function(error) {
      return callback(error);
    })

  .on('data', function(data) {
    data = JSON.parse(data);
    if (data.error){
      return callback(data.error);
    }else{
      //total = data.hits.total;
      data.hits.hits.forEach(function(hit){
        locs.push(hit._source);
      });
    }
  })

  .on('done', function(){

    var locsPerDoc = [];

    docs.forEach(function(doc){

      var set = { id: doc.doctype+'-'+doc.guid, locations: [] };

      //if there is a single doc.uwi (wll, ras, las, etc.)
      if (doc.uwi) {

        var p = locs.filter(function(o){
          return (o.uwi === doc.uwi);
        });
        if (p.length > 0) {
          var loc = {
            coordinates:  p[0].location.coordinates,
            loc_class: doc.doctype+'-'+doc.guid, //matches the badge id
            title: doc.uwi
          }
          set.locations.push(loc);
        }

      //if this doc may have many uwis (frm, zon)
      } else if (doc.uwis && doc.uwis.length > 0) {

        doc.uwis.forEach(function(uwi){
          var p = locs.filter(function(o){
            return (o.uwi === uwi);
          });
          if (p.length > 0) {
            loc = {
              coordinates:  p[0].location.coordinates,
              loc_class: doc.doctype+'-'+doc.guid,
              title: doc.name
            }
            set.locations.push(loc);
          }
        });

      }

      locsPerDoc.push(set);

    });
    return callback(null, locsPerDoc);
  }).exec()


}








// spatial mappings ////////////////////////////////////////////////////////////

//loc_idx stores a single kind of doc, a "loc" geopoint.
var spatialESMapping = { "loc":{ "properties":{
    "guid":          {"type":"string"},
    "doctype":       {"type":"string"},
    "source":        {"type":"string"},
    "updated":       {"type":"date"},
    "uwi":           {"type":"string", "index":"not_analyzed"},
    "lat":           {"type":"float", "index":"not_analyzed"},
    "lon":           {"type":"float", "index":"not_analyzed"},
    "location":      {"type":"geo_point"}
}}}




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




/**
 * the ESClient count wasn't working, and this is more direct...
 *
 */
ElasticSearcher.prototype.countIndex = function(doctype, callback){
  var idxName = doctype+'_idx';
  var self = this;

  var options = {
    hostname: 'localhost',
    port: '9200',
    path: '/'+idxName+'/_count',
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data = JSON.parse(chunk);
      //util.puts(idxName+': '+data.count)
      return callback(null, data.count)
    });
  });

  req.on('error', function(e) {
    callback('problem with request: '+e.message)
  });

  req.end();
}  














module.exports = ElasticSearcher;
