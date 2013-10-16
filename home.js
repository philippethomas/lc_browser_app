var util = require('util');


exports.index = function(req, res){
  var app = require('./package.json');
  var crawlers = [];

  if (hasEPF){ 
    var x = require('./node_modules/lc_epf_crawlers/package.json')
    crawlers.push({
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url
    });
  }
  if (hasDOX){ 
    var x = require('./node_modules/lc_dox_crawlers/package.json')
    crawlers.push({
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url
    });
  }
  if (hasPET){ 
    var x = require('./node_modules/lc_dox_crawlers/package.json')
    crawlers.push({
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url
    });
  }
  if (hasGGX){ 
    var x = require('./node_modules/lc_ggx_crawlers/package.json')
    crawlers.push({
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url
    });
  }
  if (hasTKS){ 
    var x = require('./node_modules/lc_tks_crawlers/package.json')
    crawlers.push({
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url
    });
  }
  
  res.render('home/index', { 
    title: 'LogicalCat Home',
    app_name: app.name,
    app_vers: app.version,
    app_desc: app.description,
    app_bugs: app.bugs.url,
    crawlers: crawlers
  });
};



exports.setWorkStatus = function(req, res){
  working = req.body.working; 
  res.send ({ working: working });
};

exports.getWorkStatus = function(req, res){
  res.send ({ working: working });
};


