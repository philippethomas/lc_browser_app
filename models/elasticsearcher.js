var nimble = require('nimble');
var ElasticSearchClient = require('elasticsearchclient');


ElasticSearcher = function(opts){

  ESClient = new ElasticSearchClient({ host: opts.host, port: opts.port });

  LC_APP_MAP = { "lc_app":{ "properties":{
    "guid":       {"type":"string", "index":"not_analyzed"},
      "doctype":  {"type":"string"},
      "label":    {"type":"string"},
      "es_host":  {"type":"string"},
      "es_port":  {"type":"string"},
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
  
};


//----------
//
ElasticSearcher.prototype.indexDrop = function(idxName){
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
ElasticSearcher.prototype.indexCreate = function(idxName, idxMapping){
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
//
ElasticSearcher.prototype.indexInit = function(callback){
  var self = this;

  var msg = '<pre>(Re)initializing index: lc_app_idx\r\n';
  msg += '(check the server\'s log if the page hangs.)\r\n';
  nimble.series([

      function(callback){
	self.indexDrop('lc_app_idx');
	msg += 'Deleted lc_app_idx...';
	callback();
      },

      function(callback){
	self.indexCreate('lc_app_idx', LC_APP_MAP);
	msg += 'Created lc_app_idx.\r\n';
	callback();
      }

      ]);

  msg += 'All Done!</pre>';
  callback(null, msg);

}


//----------
//
ElasticSearcher.prototype.indexStatus = function(callback){
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


//----------
//
ElasticSearcher.prototype.indexMapping = function(callback){
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
// http://localhost:9200/lc_app_idx/_search?doctype:ep_files_crawl
ElasticSearcher.prototype.getPreviousCrawls = function(doctype, callback){
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


//get previousCrawls and current index contents in one (blocking) call




























//----------
//
ElasticSearcher.prototype.search = function(doctype, queryString, callback){
  var idxName = doctype+'_idx';

  var qryObj = {
    "size":2000,
    "query" : { "query_string" : { "query" : queryString, "default_operator": "AND" } },
    "sort" : [ { "crawled" : {"order" : "desc"} } ]
  };


  console.log(qryObj);

  var cmd = ESClient.search(idxName, doctype, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	console.log(data.error);
        callback(data.error,[]);
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





//----------
// For regular docs the index is simply <doctype>_idx. However, stored crawls
// are special "docs" and all get stored in the lc_app_idx
ElasticSearcher.prototype.writeDoc = function(doc, callback){
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




module.exports = ElasticSearcher;

