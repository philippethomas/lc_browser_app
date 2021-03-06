var async = require('async');
var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');
var http = require('http');


//TODO: memoize this?
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
 * add lat/lon back to original docs. 
 *
 * TODO: expose the hard-coded size limit somewhere?
 *
 */
ElasticSearcher.prototype.addLocations = function(docs, callback){

  var uwis = [];

  docs.forEach(function(doc){
    if (doc.uwis) {
      uwis = uwis.concat(doc.uwis)
    } else if (doc.uwi) {
      uwis.push(doc.uwi)
    }
  });

  var qryObj = {
    "query": {
      "constant_score": {
        "filter": {
          "terms" : {
            "uwi" : uwis,
            "execution" : "bool"
          }
        }
      }
    },
    "from":0,
    "size": 50000
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
              type: 'point',
              coordinates:  p[0].location.coordinates,
              id_tag: doc.doctype+'-'+doc.guid, //matches the badge id
              title: doc.uwi
            }
            set.locations.push(loc);
          }

        //if this doc has many uwis (frm, zon)
        } else if (doc.uwis && doc.uwis.length > 0) {

          doc.uwis.forEach(function(uwi){
            var p = locs.filter(function(o){
              return (o.uwi === uwi);
            });
            if (p.length > 0) {
              loc = {
                type: 'point',
                coordinates:  p[0].location.coordinates,
                id_tag: doc.doctype+'-'+doc.guid,
                //title: doc.name
                title: uwi
              }
              set.locations.push(loc);
            }
          });

        } else if (doc.bounding_box) {
          //switch around the points for leaflet
          var c = doc.bounding_box.coordinates;

          var sw_lat = c[1][1];
          var sw_lon = c[0][0];
          var ne_lat = c[0][1];
          var ne_lon = c[1][0];
          
          loc = {
            type: 'box',
            sw_lat: sw_lat,
            sw_lon: sw_lon,
            ne_lat: ne_lat,
            ne_lon: ne_lon,
            id_tag: doc.doctype+'-'+doc.guid,
            title: doc.name
          }
          set.locations.push(loc);
        }

        locsPerDoc.push(set);

      });
      return callback(null, locsPerDoc);
    }).exec()


}








// spatial mappings ////////////////////////////////////////////////////////////

//loc_idx stores a single kind of doc, a "loc" geopoint.
var spatialESMapping = { 
  
  "loc":{ "properties":{
    "guid":          {"type":"string"},
    "doctype":       {"type":"string"},
    "source":        {"type":"string"},
    "updated":       {"type":"date"},
    "uwi":           {"type":"string", "index":"not_analyzed"},
    "lat":           {"type":"float", "index":"not_analyzed"},
    "lon":           {"type":"float", "index":"not_analyzed"},
    "location":      {"type":"geo_point"}
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


ElasticSearcher.prototype.globalStats = function(idxGroups, callback){

  idxStats = {};
  ESClient.stats('/')
    .on('data', function(data){
      data = JSON.parse(data);

      idxStats.numDocs = data._all.total.docs.count;
      idxStats.idxSize = data._all.total.store.size; 


      //store only the index name from the huge chunk of stats to compare later
      var idx = [];
      for (var i in data.indices){
        idx.push(i)
      }

      //assign indexes and stats per group
      for (g in idxGroups) {
        idxStats[g] = []

        idx.forEach(function(i){

          var index = idxGroups[g].filter(function(x){ return x === i; })[0];
          if (index){
            var docs = data.indices[i].total.docs.count;
            var size = data.indices[i].total.store.size;
            var o = {index: index, docs: docs, size: size}
            idxStats[g].push(o)
          }

        });
      }


    })
    .on('done', function(){
      return callback(null, idxStats);
    }).exec()
  

};



/*
 * revisit this later? count expects a query, but querystring.stringify nulls it
ElasticSearcher.prototype.countIndex = function(doctype, callback){
  var idxName = doctype+'_idx';

  ESClient.count("loc_idx", "loc", "loc")
    .on('data', function(data){
      data = JSON.parse(data);
      console.log(data._shards.failures[0])
      callback(null, data)
    }).exec()
}
*/

/**
 * the ESClient count wasn't working without a query, just do it manually...
 *
 */
ElasticSearcher.prototype.countIndex = function(doctype, callback){
  var idxName = doctype+'_idx';
  var config = require('../config.json')

  var options = {
    hostname: config.es_host,
    port: config.es_port,
    path: '/'+idxName+'/_count',
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data = JSON.parse(chunk);
      return callback(null, data.count)
    });
  });

  req.on('error', function(e) {
    callback('problem with request: '+e.message)
  });

  req.end();
}  


/**
 * Must check health directly. Trying to use elasticsearchclient gets 
 * an uncatchable ECONNREFUSED if ElasticSearch is not running.
 */
ElasticSearcher.prototype.health = function(callback){
  var config = require('../config.json')

  var options = {
    hostname: config.es_host,
    port: config.es_port,
    path: '/_cluster/health',
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data = JSON.parse(chunk);
      return callback(null, data)
    });
  });

  req.on('error', function(e) {
    callback('problem with request: '+e.message)
  });

  req.end();
}  













module.exports = ElasticSearcher;
