var util = require('util');


exports.index = function(req, res){

  var a = require('./package.json');
  var crawlers = [];
  var idxGroup = {};

  /**
   * for each crawler type, add some info from package.json and get the 
   * previously defined doctype/index names from its template to group
   * indexes by crawler type.
   */
  if (hasEPF){ 
    var x = require('./node_modules/lc_epf_crawlers/package.json')
    idxGroup['epf'] = [];
    var template = require('lc_epf_crawlers/epf_doc_templates');
    for (k in template.humanTypeNames){
      idxGroup['epf'].push(k+'_idx')
    }
    crawlers.push({
      longName: template.longName,
      type: 'epf',
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url,
      wiki: x.wiki.url
    });
  }
  if (hasDOX){ 
    var x = require('./node_modules/lc_dox_crawlers/package.json')
    idxGroup['dox'] = [];
    var template = require('lc_dox_crawlers/dox_doc_templates');
    for (k in template.humanTypeNames){
      idxGroup['dox'].push(k+'_idx')
    }
    crawlers.push({
      longName: template.longName,
      type: 'dox',
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url,
      wiki: x.wiki.url
    });
  }
  if (hasPET){ 
    var x = require('./node_modules/lc_dox_crawlers/package.json')
    idxGroup['pet'] = [];
    var template = require('lc_pet_crawlers/pet_doc_templates');
    for (k in template.humanTypeNames){
      idxGroup['pet'].push(k+'_idx')
    }
    crawlers.push({
      longName: template.longName,
      type: 'pet',
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url,
      wiki: x.wiki.url
    });
  }
  if (hasGGX){ 
    var x = require('./node_modules/lc_ggx_crawlers/package.json')
    idxGroup['ggx'] = [];
    var template = require('lc_ggx_crawlers/ggx_doc_templates');
    for (k in template.humanTypeNames){
      idxGroup['ggx'].push(k+'_idx')
    }
    crawlers.push({
      longName: template.longName,
      type: 'ggx',
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url,
      wiki: x.wiki.url
    });
  }
  if (hasTKS){ 
    var x = require('./node_modules/lc_tks_crawlers/package.json')
    idxGroup['tks'] = [];
    var template = require('lc_tks_crawlers/tks_doc_templates');
    for (k in template.humanTypeNames){
      idxGroup['tks'].push(k+'_idx')
    }
    crawlers.push({
      longName: template.longName,
      type: 'tks',
      name: x.name,
      vers: x.version,
      desc: x.description,
      bugs: x.bugs.url,
      wiki: x.wiki.url
    });
  }

  //collect the local loc's index too
  idxGroup['loc'] = ['loc_idx'];

  AppES.globalStats(idxGroup, function(err, result){
    if (err) {
      //render err like if missing path
    } else {

      loc_stat = result['loc'][0];

      //add the array of index counts/sizes to crawlers object
      crawlers.filter(function(c){ 
        for (type in result) {
          if (c.type === type) {
            c['indexes'] = result[type]
          }
        }
      });

      res.render('home/index', { 
        title: 'LogicalCat Home',
        app_name: a.name,
        app_vers: a.version,
        app_desc: a.description,
        app_bugs: a.bugs.url,
        app_wiki: a.wiki.url,
        loc_stat: loc_stat,
        crawlers: crawlers
      });

    }
  });
  
};


/**
 *
 */
exports.initLocs = function(req, res){
  AppES.initIndex('loc', function(error, result){ 
    if (error) {
      util.puts(util.inspect(error));
    } else {
      res.send(result[0]+' --- '+result[1]);
    }
  });
}


exports.setWorkStatus = function(req, res){
  working = req.body.working; 
  res.send ({ working: working });
};

exports.getWorkStatus = function(req, res){
  res.send ({ working: working });
};


