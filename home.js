var humanize = require('humanize');
var nimble = require('nimble');
var util = require('util');

exports.index = function(req, res){
  var ep_type_list = require('lc_file_crawlers/epDocTemplates.js').typeList;
  res.render('home/index', { 
    title: 'LogicalCat Home',
    ep_type_list: ep_type_list
  });
};


exports.setWorkStatus = function(req, res){
  working = req.body.working; //global var set in app
  res.send ({ working: working });
};

exports.getWorkStatus = function(req, res){
  res.send ({ working: working });
};



/** returns a single crawl object to populate the crawl form */
exports.getCrawlDoc = function(req, res){
  var idx = 'lc_app_idx';
  var query = 'guid:'+req.body.guid;
  var from = 0;
  var size = 1;
  
  AppES.doSearch(idx, from, size, query, function(error, result){
    if(error){
      util.debug(error);
      res.end();
    }else{
      res.send({ crawl: result.docs[0] });
    }
  });

};



/** called via ajax to populate file stats stuff */
exports.stats = function(req, res){
  var doctype = req.body.doctype; 
  var labels = ['(global)']; // <-- inject fake label to get global stats
  var funcs = [];
  var globalStats = [];
  var labeledStats = [];


  nimble.series([

      //define the labels
      function(cb){
	AppES.labelsForDoctype(doctype, function(error, result){
	  if(error){
	    util.debug(error);
	  }else{
	    labels = labels.concat(result.labels);
	    cb();
	  }
	});
      },

      //define functions to get stats per each label
      function(callback){

	labels.forEach(function(label){

	  var func = function(cb){
	    AppES.fileStats(doctype, label, function(error, result){
	      if(error){
		util.debug(error);
	      }else{
		if (result.totalCount === 0){ return }; //short circuit if blank

		result['ctimeMin'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['ctimeMin']));
		result['ctimeMax'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['ctimeMax']));

		result['mtimeMin'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['mtimeMin']));
		result['mtimeMax'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['mtimeMax']));

		result['atimeMin'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['atimeMin']));
		result['atimeMax'] = humanize.date('Y-M-d h:i:s A',
		  new Date(result['atimeMax']));

		result['totalSize'] = humanize.filesize(result['totalSize']);

		if (result['label'] === '(global)') {
		  globalStats.push(result);
		} else {
		  labeledStats.push(result);
		}
		cb();
	      }
	    });
	  }

	  funcs.push(func)
	});

	callback();

      },

      //run all the funcs in parallel, send compilation
      function(cb){
	nimble.parallel(funcs, function(){
	  res.send( { labeledStats: labeledStats, globalStats: globalStats } );
	  cb();
	});
      }


  ]);



}
