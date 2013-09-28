var path = require('path');
var fs = require('fs');
var S = require('string');
var util = require('util');
var humanize = require('humanize');

/**
 *
 */
exports.search = function(req, res){

  var idx = req.body.idx;
  var query = req.body.query; 
  var from = req.body.from || 0;
  var size = req.body.size || 11; // this should match the perPage var in $

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
 * Retrieve a single doc with formatting that can be applied to a modal popup
 */
exports.docDetail = function(req, res){

  var idx = req.body.idx;
  var query = 'guid:'+req.body.guid;
  var from = 0;
  var size = 1;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      var doc = result.docs[0];

      humanizeFields(doc);

      var dt = getTemplate(doc.doctype).detailer;

      var title = dt.title(doc);
      var l_panel = dt.l_panel(doc);
      var r_panel = dt.r_panel(doc);
      var base = dt.base(doc);

      /*
      var list = '<dl class="dl-horizontal">';
      template.detailList.forEach(function(x){
        list += '<dt>'+ x +'</dt>';
        list += '<dd>'+ styler(doc, x) +'</dd>';
      })
      list += '</dl>';

      var singles = ''
      template.detailSingles.forEach(function(x){
        singles += '<div class="well wrap-text">';
        singles += '<strong>'+ x +'</strong><br>';
        singles += styler(doc, x);
        singles += '</div>';
      });

      var base = styler(doc, template.detailBase);
      */

      res.send( { 
        title: title,
        l_panel: l_panel,
        r_panel: r_panel,
        base: base
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

      var template = getTemplate(result.docs[0].doctype);
      var badges = [];

      result.docs.forEach(function(doc){
        humanizeFields(doc);
        badges.push(template.badge(doc))
      });

      res.send( { 
        docs: result.docs,
        badges: badges, 
        total: result.total
      } );
    }
  });

}


/**
 * Simplest possible CSV file download--it's just a string. This avoids
 * worrying about temp file clean up, but could eat memory.
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
        csvString += csvRowString(doc); //in browser app.js, not scanner(s)
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
