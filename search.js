var ep_filesScanner = require('lc_file_crawlers/scanner.js');
var nimble = require('nimble');
var path = require('path');
var fs = require('fs');
var S = require('string');
var util = require('util');
var scanner = require('lc_file_crawlers/scanner.js');


/**
 *
 */
exports.search = function(req, res){

  var idx = req.body.idx;
  var query = req.body.query; 
  var from = req.body.from || 0;
  var size = req.body.size || 10; // this should match the perPage var in $

  req.session.idx = idx;
  req.session.query = query;
  req.session.from = from;
  req.session.size = size;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
    }else{
      res.render('search', { 
	title: 'Search',
	docs: result.docs,
	total: result.total,
	size: size
      });
    }

  });
}


/**
 *
 */
exports.ajaxGetDoc = function(req, res){

  var idx = 'las_idx,shp_idx,sgy_idx,img_idx';
  var query = 'guid:'+req.body.guid;
  var from = 0;
  var size = 1;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      var body = '<dl class="dl-horizontal">';
      var doc = result.docs[0];
      var keys = eval(doc.doctype.toUpperCase() + '_KEYS');

      keys.forEach(function(k){
	if (k === 'cloud') {
	  body += '<dt>'+k+'</dt>'
	  body += '<dd>...</dd>'
	  body += '<pre>'+doc[k]+'</pre>'
	} else {
	  var val = (doc[k] === undefined) ? '' : doc[k];
	  body += '<dt>'+k+'</dt>'
	  body += '<dd>'+val+'</dd>'
	}
      });
      body += '</dl>';
      
      var title = 'Document Details for '+doc.basename;

      res.send( { 
	body: body, 
	title: title 
      } );
    }
  });

}


/**
 *
 */
exports.ajaxSearch = function(req, res){

  var idx = req.session.idx;
  var query = req.session.query; 
  var from = req.body.from; // from the pager
  var size = req.session.size;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      var header = [ 'label', 'fullpath', 'uwi', 'company', 'curves' ];

      res.send( { 
	docs: result.docs, 
	total: result.total, 
	header: header
      } );
    }
  });

}


/**
 * Simplest possible CSV file download--it's just a string. This avoids
 * worrying about temp file clean up, but could eat memory. Also, this will
 * break if the search options allow more than one doctype at a time.
 * (would need to process one file per doctype and send zip like the Rails app)
 */
exports.csvExport = function(req, res){
  var idx = req.session.idx;
  var query = req.session.query; 
  var from = 0;
  var size = 100;


  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{

      var docKeys = result.docs[0].doctype.toUpperCase() + '_KEYS';
      var csvString = eval(docKeys).join(',')+'\r\n';

      result.docs.forEach(function(doc){
        csvString += scanner.csvRowString(doc);
      });
      
      res.attachment('export.csv');
      res.send(csvString);

    }
  });

}
