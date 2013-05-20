jQuery(function($){


  var dupLookup = {};
  /** populate doctype-specific file stat summaries */
  ['las','sgy','ras','shp'].forEach(function(doctype){

    $.post('/stats', {doctype: doctype}, function(data){

      data.stats.forEach(function(x,i){

	s = '<div class="well white">';
	s += '<pre class="center labelSummary">'+x.label+'</pre>';
	s += '<br>';
	s += '<b>total count:</b>';
	s += '<span class="pull-right">'+x['totalCount']+' files</span><br>';
	s += '<b>total size:</b>';
	s += '<span class="pull-right">'+x['totalSize']+'</span><br>';
	s += '<dl>';
	s += '<dt>create MIN</dt><dd class="mono">'+x['ctimeMin']+'</dd>';
	s += '<dt>create MAX</dt><dd class="mono">'+x['ctimeMax']+'</dd>';
	s += '<dt>modify MIN</dt><dd class="mono">'+x['mtimeMin']+'</dd>';
	s += '<dt>modify MAX</dt><dd class="mono">'+x['mtimeMax']+'</dd>';
	s += '<dt>access MIN</dt><dd class="mono">'+x['atimeMin']+'</dd>';
	s += '<dt>access MAX</dt><dd class="mono">'+x['atimeMax']+'</dd>';
	s += '</dl>';
	s += '</div>';

	var dupButton;

	if (x['label'] === '(global)' && x['dups'].length > 0){
	  var plur = (x['dups'].length > 1) ? 'duplications' : 'duplication';
	  dupButton = '<br><br><a id="dupz_'+doctype+
	    '" class="btn btn-small btn-danger" href="#">'+
	    x['dups'].length+' file '+plur+'!</a>';

	  dupLookup[doctype] = {
	    query: x['dups'].join(' OR '), 
	    idx: doctype+'_idx'
	  }
	}

	if (x['label'] === '(global)'){
	  $('#'+doctype+'Stats .globalStats').html(s);
	  $('#'+doctype+'Stats .globalStats .labelSummary').append(dupButton)
	}else{
	  $('#'+doctype+'Stats .labelStats').append(s);
	}

      });


      //slightly janky! send duplicate reports to search table
      $('#dupz_'+doctype).click(function(){
	var d = dupLookup[doctype];
	$('#search :selected').val(d.idx);
	$('#search input').val(d.query)
	$('#search').submit();
      });

    });

  });



});
