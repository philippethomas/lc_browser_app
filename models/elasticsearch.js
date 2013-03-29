var ElasticSearchClient = require('elasticsearchclient');
var createHash = require('crypto').createHash;


var ES_OPTIONS = {
  host: 'localhost',
  port: 9200
};

var ESClient = new ElasticSearchClient(ES_OPTIONS);

var LCAPP_MAP = { "lc_app":{ "properties":{
  "guid":       {"type":"string", "index":"not_analyzed"},
    "doctype":  {"type":"string"},
    "label":    {"type":"string"},
    "es_url":   {"type":"string"},
    "fw_root":  {"type":"string"},
    "work_dir": {"type":"string"},
    "write_csv":{"type":"string"},
    "write_es": {"type":"string"},
    "zip_las":  {"type":"string"},
    "shp_feat": {"type":"string"},
    "sgy_deep": {"type":"string"},
    "find_LAS": {"type":"string"},
    "find_SHP": {"type":"string"},
    "find_SGY": {"type":"string"},
    "find_IMG": {"type":"string"},
} } }


//----------
// used to make a sort of natural key as doc id
//
var guidify = function(s){
  var guid = createHash('md5');
  guid.update(s);
  return guid.digest('hex');
}

//----------
//delete and recreate the specified index with mappings
//
function indexInit(callback){
  var idxName = 'lc_app_idx';

  //delete the index
  var killCall = ESClient.deleteIndex(idxName);
  killCall.exec(function(error, data){
    if(error){
      console.error(error);
      callback(error);
    }else{
      data = JSON.parse(data);
      if(data.ok){
	console.log('deleted index for: '+idxName);
      }else{
	console.error(data);
      }
    }
  });

  //create the index with mappings
  var makeCall = ESClient.createIndex(idxName,{"mappings":LCAPP_MAP});
  makeCall.exec(function(error, data){
    if(error){
      console.error(error);
      callback(error);
    }else{
      data = JSON.parse(data);
      if(data.ok){
	console.log('created index for: '+idxName);
      }else{
	console.error(data);
	callback('Problem creating index: '+data);
      }
    }
  });
  callback(null, 'Successfully created index: '+idxName);

}

//----------
//
function indexStatus(callback){
  var statCall = ESClient.status('lc_app_idx');
  statCall.exec(function(error, data){
    
    data = JSON.parse(data)
    if (error){
      callback(error);
    }else{
      callback(null, data);
    }
  });
};

function indexMapping(callback){
  var mapCall = ESClient.getMapping('lc_app_idx', 'lc_app');
  mapCall.exec(function(error, data){
    data = JSON.parse(data)
    if (error){
      callback(error);
    }else{
      callback(null, data);
    }
  });
}

exports.indexInit = indexInit;
exports.indexStatus = indexStatus;
exports.indexMapping = indexMapping;



