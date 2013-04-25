var nimble = require('nimble');
var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');


ElasticSearcher = function(opts){

  ESClient = new ElasticSearchClient({ host: opts.host, port: opts.port });

  /** @constant {Array} */
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


/**
 * Just a wrapper for deleteIndex
 *
 * @param {String} idxName
 */
ElasticSearcher.prototype.indexDrop = function(idxName){
  var deleteCall = ESClient.deleteIndex(idxName);
  deleteCall.exec(function(err, data){
    if (err) {
      util.debug(err);
    } else {
      data = JSON.parse(data);
      if (data.ok) {
	util.puts('Deleted index for: '+idxName);
      } else if (data.status === 404) {
	util.puts('Index not found: '+idxName);
      } else {
	util.debug(data);
      }
    }
  });
}


/**
 * Just a wrapper for createIndex
 *
 * @param {String} idxName
 * @param {Array} idxMapping
 */
ElasticSearcher.prototype.indexCreate = function(idxName, idxMapping){
  var createCall = ESClient.createIndex(idxName,{"mappings":idxMapping});
  createCall.exec(function(err, data){
    if (err) {
      util.debug(err);
    } else {
      data = JSON.parse(data);
      if (data.ok) {
	util.puts('Created index: '+idxName);
      } else {
	util.debug(data);
      }
    }
  });
}


/**
 * Delete and recreate the specified index with appropriate mappings
 *
 * @param {String} idxName
 */
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


/**
 * Status from lc_app_idx
 *
 * @return {String} Output from ElasticSearch
 */
ElasticSearcher.prototype.indexStatus = function(callback){
  var statCall = ESClient.status('lc_app_idx');
  statCall.exec(function(error, data){
    data = JSON.parse(data)
    if (error){
      callback(error);
    } else {
      callback(null, data);
    }
  });
};


/**
 * Mapping from lc_app_idx
 *
 * @return {String} Output from ElasticSearch
 */
ElasticSearcher.prototype.indexMapping = function(callback){
  var mapCall = ESClient.getMapping('lc_app_idx', 'lc_app');
  mapCall.exec(function(error, data){
    data = JSON.parse(data)
    if (error) {
      callback(error);
    } else {
      callback(null, data);
    }
  });
}


/**
 * Get previousCrawls and some stats for this particular doctype
 * Previous crawls are displayed on the (hidden) crawl setup form
 * Doctype-specific stats are displayed on the index
 *
 * http://localhost:9200/lc_app_idx/_search?doctype:ep_files_crawl
 *
 * @param {String} crawlType [ep_files, petra, discovery, kingdom]
 * @return {String} 
 */
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
      util.debug('Sorry, did not recognize type: '+type);
      return;
  }


  self.doSearch(crawlIndices, 0, 10, crawlQuery, function(error, result){
    if(error){
      util.debug(error);
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














ElasticSearcher.prototype.doctypes = function(callback){
  var qryObj = {
    "query" : { "match_all" : { } },
    "facets" : { "doctypes" : { "terms" : {"field":"doctype", "all_terms":true} } },
  };
  var cmd = ESClient.search('las_idx,shp_idx,img_idx,sgy_idx', qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	util.debug(data.error);
        callback(data.error,[]);
      }else{
	var doctypes = [];
	
	console.log(data.facets.doctypes.terms);

	callback(null, { doctypes: doctypes });
      }
    }
  });

}






//----------
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
  //console.log(qryObj);
  //===

  var cmd = ESClient.search(indices, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	util.debug(data.error);
        return callback(data.error,[]);
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
/*
ElasticSearcher.prototype.csvSearch = function(indices, from, size, query, callback){
  
  var qryObj = {
    "from":from,
    "size":size,
    "query" : { "query_string" : { "query" : query, "default_operator": "AND" } },
    "facets" : { "doctypes" : { "terms" : {"field":"doctype", "all_terms":true} } },
    "sort" : [ { "crawled" : {"order" : "desc"} } ]
  };

  var cmd = ESClient.search(indices, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	util.debug(data.error);
        return callback(data.error,[]);
      }else{
	var docs = [];

	console.log('=========================');
	console.log(data.facets.doctypes.terms);
	console.log('=========================');

	var total = data.hits.total;
	data.hits.hits.forEach(function(hit){
	  docs.push(hit._source);
	});
	callback(null, { total: total, docs: docs });
      }
    }
  });
}
*/










//----------
/**
 * Write a crawl doc (ep_files_crawl, petra_crawl, etc.) to the lc_app_idx.
 * They are defined in crawl setup forms.
 *
 * @param {Object} crawl
 */
ElasticSearcher.prototype.saveCrawl = function(crawl, callback){
  var cmd = ESClient.index('lc_app_idx', crawl.doctype, crawl, crawl.guid);
  cmd.exec(function(err, data){
    if (err) {
      callback(error);
    } else {
      data = JSON.parse(data);
      if (data.ok) {
	callback(null, data);
      } else {
	callback('ERROR: crawl not saved?!?!?');
      }
    }
  });
}





module.exports = ElasticSearcher;
