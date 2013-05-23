jQuery(function($){

  $('#clickForStats').hide();

  var dupLookup = {};

  //var doctypes = ['las', 'sgy', 'shp', 'ras'];
  $.post('/ep_doc_types', function(data){
    console.log(data.typeList);
    epTypeList = data.typeList;
  });
  console.log(epTypeList);

  //TODO: rename stats to differentiate EP vs projects
  epTypeList.forEach(function(doctype){
    $.post('/stats', {doctype: doctype}, function(data){
      
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
