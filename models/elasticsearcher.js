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
      "crawled":  {"type":"date"}
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


//get previousCrawls and latest index contents for this particular type
// http://localhost:9200/lc_app_idx/_search?doctype:ep_files_crawl
//
ElasticSearcher.prototype.priorCrawlsAndDocs = function(crawlType, callback){
  var self = this;

  var crawlIndices;
  var crawlQuery;
  var docIndices;
  var docQuery;

  switch(crawlType){
    case 'ep_files':
      crawlIndices = 'lc_app_idx';
      crawlQuery = 'doctype:ep_files_crawl';
      docIndices = 'las_idx,shp_idx,sgy_idx,img_idx'
      docQuery = 'doctype:las OR doctype:shp OR doctype:sgy OR doctype:img';
      break;
    case 'petra':
      query = 'pet_project';
      break;
    case 'discovery':
      query = 'ggx_project';
      break;
    case 'kingdom':
      query = 'tks_project';
      break;
    default:
      console.log('Sorry, did not recognize type: '+type);
      return;
  }


  self.doSearch(crawlIndices, 0, 10, crawlQuery, function(error, result){
    if(error){
      console.log(error);
      callback(error);
    }else{
      ////
      var previousCrawls = result.docs;

      self.doSearch(docIndices, 0, 20, docQuery, function(error, result){
	if(error){
	  callback(error);
	}else{
	  ////
	  callback(null,{ searchResults: result.docs, previousCrawls: previousCrawls });
	}
      });


    }
  });
}




























//----------
// doctypes: one or more doctypes separated by comma: 'las,
//
ElasticSearcher.prototype.doSearch = function(indices, from, size, query, callback){
  
  //var indices = nimble.map(idxTypes.split(','), function(x){
  //  return (x+'_idx').trim()
  //}).join(',');

  var qryObj = {
    "from":from,
    "size":size,
    "query" : { "query_string" : { "query" : query, "default_operator": "AND" } },
    "sort" : [ { "crawled" : {"order" : "desc"} } ]
  };

  //===
  console.log(qryObj);
  //===

  var cmd = ESClient.search(indices, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	console.log(data.error);
        callback(data.error,[]);
      }else{
	var docs = [];
	var total = data.hits.total;
	data.hits.hits.forEach(function(hit){
	  docs.push(hit._source);
	});
	callback(null, { total: total, docs: docs });
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

