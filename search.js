var ep_filesScanner = require('lc_file_crawlers/scanner.js');
var nimble = require('nimble');
var path = require('path');
var fs = require('fs');
var S = require('string');
var scanner = require('lc_file_crawlers/scanner.js');

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
      console.log(error);
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


//exports.perPage = function(req, res){
//  res.send("8");
//}


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
      console.log(error);
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


//process docs and return a big csv string. This avoids writing and then having to
//delete a temp file. Check out npm 'tmp' if this is too memory hoggy.
function syncWriteCSV(docs, callback){

  //ep_filesScanner.csvWriteLASHeader(csvPath);

  var bigString = LAS_KEYS.join(',')+'\r\n';

  docs.forEach(function(doc){
    var a = [];

    var bigString = scanner.csvRowString(doc);
    console.log(bigString)

    
  });


  callback(null, bigString)

}


exports.ajaxSearch = function(req, res){

  var idx = req.session.idx;
  var query = req.session.query; 
  var from = req.body.from; // set in the pager
  var size = req.session.size;

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      console.log(error);
      res.end();
    }else{
      res.send( { docs: result.docs, total: result.total } );
    }
  });

}



