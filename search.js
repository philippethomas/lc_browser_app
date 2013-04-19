var ep_filesScanner = require('lc_file_crawlers/scanner.js');
var nimble = require('nimble');
var path = require('path');
var fs = require('fs');
var S = require('string');

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


//----------
exports.csvExport = function(req, res){
  var idx = req.session.idx;
  var query = req.session.query; 
  var from = 0;
  var size = 100;

  //AppES.doctypes(function(error, result){
    //console.log(result);
  //});

  //1. wrap a bunch of doSearches for each doctype.
  //2. if there's only one doctype, send the file directly
  //3. if there's more than one, process each each doctype, writing
  //   a temp file for each one
  //4. zip them all up and send
  //5. delete temps 

  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      console.log(error);
      res.end();
    }else{

      //TODO this only works with LAS, expand!!!

      //var workDir = process.env.TMP;
      //var csvPath = path.join(workDir, 'las_'+new Date().getTime()+'.csv');

      syncWriteCSV(result.docs, function(error, result){
	if(error){
	  console.error('Problem writing CSV file: '+error);
	}else{
	  res.attachment('export.csv');
	  res.send(result);
	}
      });


      /*
      nimble.series([

	function(callback){

	  syncWriteCSV(csvPath, result.docs, function(error, result){
	    if(error){
	      console.error('Problem writing CSV file: '+error);
	    }else{
	      console.log('RESULT========='+result);
	      res.attachment('export.csv');
	      res.send(result);
	    }
	  });
	  callback();
	},

	function(callback){
	  fs.unlink(csvPath, function (err) {
	    if (err) throw err;
	    console.log('successfully deleted '+csvPath);
	  });
	  
	  //res.attachment('export.csv');
	  //res.sendfile(csvPath);
	  callback();
	}

	]);
      */


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

    LAS_KEYS.forEach(function(key){
      var val = doc[key];
      if (val === undefined){
	console.log('Error, Undefined document key: '+key);
      }else if (val === null){
	a.push(null);
      }else if (key === 'cloud'){
	a.push('(excluded)');
      }else{
	val = S(val).trim().s;
	val = S(val).replaceAll('"', '""').s ;
	val = '"'+val+'"';
	a.push(val);
      }
    });

    bigString += a.join(',')+'\r\n';

    //var line = a.join(',')+'\r\n';
    //fs.appendFileSync(csvPath, line, 'UTF-8', function (err) {
    //  if (err) throw err;
    //});
    
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



