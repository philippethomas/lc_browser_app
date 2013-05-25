jQuery(function($){

  

  var dupLookup = {};

  // seems a bit nuts, but these stats may take a long time to gather on 
  // very large systems. It's better to call via ajax.
  $.post('/epDoctypes', function(data){
    data.doctypes.forEach(function(doctype){
      $.post('/epStats', {doctype: doctype}, function(data){
	
	if (data.globalStats.length > 0) { $('#statsBox').show(); }

	data.globalStats.forEach(function(x){
	  var s = '<tr class="'+doctype+' global">'
	  s += '<td>'+doctype.toUpperCase()+'</td>';
	  s += '<td>'+x['label']+'</td>';
	  s += '<td>'+x['totalCount']+' files</td>';
	  s += '<td>'+x['totalSize']+'</td>';
	  s += '<td>'+x['mtimeMin']+'</td>';
	  s += '<td>'+x['mtimeMax']+'</td>';

	  if (x['dups'].length > 0) {
	    var plur = (x['dups'].length > 1) ? 'duplications' : 'duplication';
	    dupButton = '<a id="dupz_'+doctype+
	    '" class="btn btn-mini btn-danger" href="#">'+
	      x['dups'].length+' file '+plur+'</a>';

	  dupLookup[doctype] = {
	    query: x['dups'].join(' OR '), 
	    idx: doctype+'_idx'
	  }
	  s += '<td>'+dupButton+'</td>'; 

	  } else {
	    s += '<td>(none)</td>';
	  }

	  $('#statsTable tbody').append(s);



	});

	//slightly janky! send duplicate reports to search table
	$('#dupz_'+doctype).click(function(){
	  var d = dupLookup[doctype];
	  $('#search :selected').val(d.idx);
	  $('#search input').val(d.query)
	  $('#search').submit();
	});


	data.labeledStats.forEach(function(x){
	  var s = '<tr class="'+doctype+'">'
	  s += '<td>'+doctype.toUpperCase()+'</td>';
	  s += '<td>'+x['label']+'</td>';
	  s += '<td>'+x['totalCount']+' files</td>';
	  s += '<td>'+x['totalSize']+'</td>';
	  s += '<td>'+x['mtimeMin']+'</td>';
	  s += '<td>'+x['mtimeMax']+'</td>';
	  s += '<td></td>';
	  $('#statsTable tbody').append(s);

	});

      });

    });

  });


});
