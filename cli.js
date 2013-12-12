#!/usr/bin/env node --use_strict

var ElasticSearcher = require('./models/elasticsearcher');
var program = require('commander');
var logger = require('./logging');


program
.version('0.0.1')


////////////////////////////////////////////////////////////////////////////////

var config = require('./config.json')
var es = new ElasticSearcher({host:config.es_host, port:config.es_port});


//----------init
program
.command('init')
.description('(Re)initialize the spatial index')
.action(
    function(){
      es.initIndex('loc', function(err, result){ 
        if (err) {
          logger.error(err, {stack:err.stack, src:'init'});
        } else {
          logger.info(result[0]+' --- '+result[1]);
        }
      });

    }
    );


//----------count
program
.command('count')
.description('Show current document counts per index')
.action(
    function(){
      es.countIndex('loc', function(err, result){ 
        if (err) {
          logger.error(err, {stack:err.stack, src:'count'});
        } else {
          logger.info('loc_idx count: '+result);
        }
      });
    }
    );


program.parse(process.argv);


