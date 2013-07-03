var async = require('async');
var ElasticSearchClient = require('elasticsearchclient');
var util = require('util');


ElasticSearcher = function(opts){

  ESClient = new ElasticSearchClient({ host: opts.host, port: opts.port });

  /** @constant {Array} */
  LC_APP_MAP = { "lc_app":{ "properties":{
    "guid":       {"type":"string", "index":"not_analyzed"},
      "doctype":  {"type":"string"},
      "ep_label":    {"type":"string"},
      "ep_es_host":  {"type":"string"},
      "ep_es_port":  {"type":"string"},
      "ep_fw_root":  {"type":"string"},
      "ep_work_dir": {"type":"string"},
      "ep_write_csv":{"type":"string"},
      "ep_write_es": {"type":"string"},
      "ep_zip_las":  {"type":"string"},
      "ep_shp_feat": {"type":"string"},
      "ep_ras_clip": {"type":"string"},
      "ep_find_LAS": {"type":"string"},
      "ep_find_SHP": {"type":"string"},
      "ep_find_SGY": {"type":"string"},
      "ep_find_RAS": {"type":"string"},
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
  async.series([

      function(cb){
	self.indexDrop('lc_app_idx');
	msg += 'Deleted lc_app_idx...';
	cb();
      },

      function(cb){
	self.indexCreate('lc_app_idx', LC_APP_MAP);
	msg += 'Created lc_app_idx.\r\n';
	cb();
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
 *
 * http://localhost:9200/lc_app_idx/_search?doctype:ep_files_crawl
 *
 * @param {String} crawlType [ep_files, petra, discovery, kingdom]
 * @return {String} 
 */
ElasticSearcher.prototype.previousCrawls = function(crawlType, callback){
  var self = this;
  switch(crawlType){
    case 'ep_files':
      crawlQuery = 'doctype:ep_files_crawl';
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
      util.debug('Sorry, did not recognize type: '+crawlType);
      return;
  }

  self.doSearch('lc_app_idx', 0, 10, crawlQuery, function(error, result){
    if(error){
      util.debug(error);
      callback(error);
    }else{
      callback(null,{ previous: result.docs });
    }
  });
}



/** use label '(global)'  to collect all stats--that set gets displayed first */
ElasticSearcher.prototype.fileStats = function(doctype, label, callback){
  var self = this;

  var qs = (label === '(global)') ? 'doctype:'+doctype : 
    'doctype:'+doctype+' AND label:'+ label;

  var qryObj = {
    "query" : { "query_string" : { 
      "query" : qs },
    },
    "facets" : { 
      "mtimeStats" : { "statistical" : {"field":"mtime"} } ,
      "sizeStats" : { "statistical" : {"field":"size"} } ,
      "dupChecksums" : { "terms" : {"field":"checksum"} } 
    }
  };


  var cmd = ESClient.search(doctype+'_idx', qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{

      data = JSON.parse(data);
      if (data.error){
	util.debug(data.error);
	return callback(data.error,[]);
      }else{
	var totalCount = data.hits.total;

  dups = [];
  data.facets.dupChecksums.terms.forEach(function(x){
    if (x.count > 1) { dups.push(x.term) }
  });

  var mtimeMin = data.facets.mtimeStats.min; 
  var mtimeMax = data.facets.mtimeStats.max; 

        
	var totalSize = data.facets.sizeStats.total;

	var o = {
	  label: label,
	  totalCount: totalCount,
	  totalSize: totalSize,
	  dups: dups,
	  mtimeMin: mtimeMin,
	  mtimeMax: mtimeMax,
	}

	callback(null, o);

      }
    }
  });
}





/** this script_field syntax accounts for labels that might have spaces */
ElasticSearcher.prototype.labelsForDoctype = function(doctype, callback){
  var qryObj = {
    "query" : { "match_all" : { } },
    "facets" : { "labels" : { "terms" : {
      "script_field": "_source[\'label\']"
    } } },
  };
  var idx = doctype+'_idx';
  var cmd = ESClient.search(idx, qryObj);
  cmd.exec(function(err, data){
    if(err){
      callback(error);
    }else{
      data = JSON.parse(data);
      if (data.error){
        util.debug(data.error);
        return callback(data.error,[]);
      }else{

        var labels = [];
        data.facets.labels.terms.forEach(function(x){
          labels.push(x.term)
        })

        return callback(null, { labels: labels });
      }
    }
  });

}






//----------
//
ElasticSearcher.prototype.doSearch = function(indices, from, size, query, callback){
  

  var qryObj = {
    "from":from,
    "size":size,
    "query" : { "query_string" : { "query" : query, "default_operator": "AND" } },
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
