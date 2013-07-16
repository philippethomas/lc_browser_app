var ep_filesScanner = require('lc_epf_crawlers/scanner.js');
var path = require('path');
var fs = require('fs');
var S = require('string');
var util = require('util');
var scanner = require('lc_epf_crawlers/scanner.js');
var humanize = require('humanize');

/**
 *
 */
exports.search = function(req, res){

  var idx = req.body.idx;
  var query = req.body.query; 
  var from = req.body.from || 0;
  var size = req.body.size || 10; // this should match the perPage var in $

  //remember session for csv export and pagination
  req.session.idx = idx;
  req.session.query = query;
  req.session.from = from;
  req.session.size = size;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
    }else{

      result.docs.forEach(function(doc){
        humanizeFields(doc);
      });

      res.render('search', { 
        title: 'Search',
        docs: result.docs,
        total: result.total,
        size: size,
        idx: idx,
        query: query
      });
    }

  });
}



/**
 * TODO make a showFields-type list of keys if defaults are unloved
 */
exports.ajaxGetDoc = function(req, res){

  var epfDocTemplates = require('./app').epfDocTemplates;
  var ep_type_list = require('lc_epf_crawlers/epfDocTemplates.js').typeList;

  var ep_idx_list = [] 
  ep_type_list.forEach(function(x){
    ep_idx_list.push(x+'_idx');
  })
  var query = 'guid:'+req.body.guid;
  var from = 0;
  var size = 1;

  AppES.doSearch(ep_idx_list.join(','), from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{

      result.docs.forEach(function(doc){
        humanizeFields(doc);
      });

      var body = '<dl class="dl-horizontal">';
      var doc = result.docs[0];
      var keys = getTemplate(doc.doctype).allFields;

      keys.forEach(function(k){
        var val = (doc[k] === undefined) ? '' : doc[k];
        if (k === 'cloud') {
          body += '<dt>'+k+'</dt>'
        body += '<dd>...</dd>'

        if (doc['doctype'] === 'ras') {
          body += '<div class="well center">';
          body += '<img src="data:image/png;base64,'+val+'"/>';
          body += '</div>';
        } else {

          body += '<pre>'+val+'</pre>'
        }

        } else {
          body += '<dt>'+k+'</dt>'
        body += '<dd>'+val+'</dd>'
        }
      });
      body += '</dl>';

      var title = doc.basename;

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

  var idx = req.body.idx || req.session.idx;
  var query = req.body.query || req.session.query; 
  var from = req.body.from || req.session.from; // usually from the pager
  var size = req.body.size || req.session.size;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      var t = getTemplate(result.docs[0].doctype).tableFields;

      result.docs.forEach(function(doc){
        humanizeFields(doc);
      });

      res.send( { 
        docs: result.docs, 
        total: result.total, 
        realFields: t.realFields,
        showFields: t.showFields
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
  var size = 10000;


  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{

      var header = getTemplate(result.docs[0].doctype).allFields;
      var csvString = header.join(',')+'\r\n';

      result.docs.forEach(function(doc){
        csvString += scanner.csvRowString(doc);
      });

      res.attachment('export.csv');
      res.send(csvString);

    }
  });

}


function humanizeFields(doc){
  if (doc['atime']) {
    doc['atime'] = humanize.date('Y-M-d h:i:s A', new Date(doc['atime'])); 
  }
  if (doc['ctime']) {
    doc['ctime'] = humanize.date('Y-M-d h:i:s A', new Date(doc['ctime'])); 
  }
  if (doc['mtime']) {
    doc['mtime'] = humanize.date('Y-M-d h:i:s A', new Date(doc['mtime'])); 
  }
  if (doc['crawled']) {
    doc['crawled'] = humanize.date('Y-M-d h:i:s A', new Date(doc['crawled'])); 
  }
  if (doc['size']) {
    doc['size'] = humanize.filesize(doc['size']);
  }
  return doc;
}
