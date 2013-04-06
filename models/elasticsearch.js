var ElasticSearchClient = require('elasticsearchclient');
var createHash = require('crypto').createHash;
var nimble = require('nimble');


var ES_OPTIONS = {
  host: 'localhost',
  port: 9200
};

var ESClient = new ElasticSearchClient(ES_OPTIONS);

var LC_APP_MAP = { "lc_app":{ "properties":{
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
    "saved":  {"type":"date"}
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
//delete and recreate the specified index with mappings (lc_app_idx)
function indexInit(callback){

  var msg = '<pre>(Re)initializing index: lc_app_idx\r\n';
  msg += '(check the server\'s log if the page hangs.)\r\n';
  nimble.series([

      function(callback){

	indexDrop('lc_app_idx');
	msg += 'Deleted lc_app_idx...';
	callback();

      },

      function(callback){
	indexCreate('lc_app_idx', LC_APP_MAP);
	msg += 'Created lc_app_idx.\r\n';
	callback();
      }

      ]);

  msg += 'All Done!</pre>';

  callback(null, msg);

}


//----------
function indexCreate(idxName, idxMapping){
  var createCall = ESClient.createIndex(idxName,{"mappings":idxMapping});
  createCall.exec(function(err, data){
    if(err){
      console.error(err);
    }else{
      data = JSON.parse(data);
      if(data.ok){
	console.log('Created index: '+idxName);
      }else{
	console.error(data);
      }
    }
  });
}


//----------
function indexDrop(idxName){
  var deleteCall = ESClient.deleteIndex(idxName);
  deleteCall.exec(function(err, data){
    if(err){
      console.error(err);
    }else{
      data = JSON.parse(data);
      if(data.ok){
	console.log('Deleted index for: '+idxName);
      }else if(data.status === 404){
	console.log('Index not found: '+idxName);
      }else{
	console.error(data);
      }
    }
  });
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


//----------
// For regular docs, the index is simply the doctype+'_idx'
// However, crawls are special "docs" and all get stored in the lc_app_idx
function writeDoc(doc, callback){

  var idxName = doc.doctype + '_idx';

  if (doc.doctype === 'ep_files_crawl' || 
      doc.doctype === 'petra_crawl' || 
      doc.doctype === 'discovery_crawl' || 
      doc.doctype === 'kingdom_crawl'){
    idxName = 'lc_app_idx';
  }
  
  var cmd = ESClient.index(idxName, doc.doctype, doc, doc.guid);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{
      data = JSON.parse(data);
      if(data.ok){
	callback(null, data);
      }else{
	callback(data);
      }
    }
  });
}

//----------
// test in REST Console: 
// http://localhost:9200/lc_app_idx/_search?doctype:ep_files_crawl
//
function previousCrawls(doctype, callback){
  var qryObj = {
    "query" : { "term" : { "doctype" : doctype } },
    "sort" : [ { "saved" : {"order" : "desc"} } ]
  };

  var cmd = ESClient.search('lc_app_idx', doctype, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	console.log('Cannot retrieve previous crawls (probably none exist)')
        callback(null,[])
      }else{
	var crawls = [];
	data.hits.hits.forEach(function(hit){
	  crawls.push(hit._source);
	});
	callback(null, crawls);
      }
    }
  });

}


exports.guidify = guidify;
exports.indexInit = indexInit;
exports.indexStatus = indexStatus;
exports.indexMapping = indexMapping;

exports.writeDoc = writeDoc;
exports.previousCrawls = previousCrawls;
