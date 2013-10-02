#!/usr/bin/env node --use_strict


var program = require('commander');
var util = require('util');
require('./models/elasticsearcher');


program
.version('0.0.1')





//----------init
program
.command('init')
.description('(Re)initialize the spatial index')
.action(
    function(){
      //TODO: these defaults might need tweaking via the installer...
      var ES = new ElasticSearcher({ host: 'localhost', port: 9200 });

      ES.initIndex('loc', function(err, result){ 
        if (err) {
          util.puts(util.inspect(err));
        } else {
          util.puts(result[0]+' --- '+result[1]);
        }
      });

    }
    );


//----------count
/*
program
.command('count')
.description('Show current document counts per index')
.action(
    function(){
      ES = new ElasticSearcher({ host:program.es_host, port:program.es_port });
      epfDoctypes.forEach(function(doctype){
        ES.countIndex(doctype, function(err, result){ 
          if (err) {
            util.puts(util.inspect(err));
          } else {
            util.puts(doctype+'_idx count: '+result);
          }
        });
      });
    }
    );
*/


program.parse(process.argv);


