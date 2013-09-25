jQuery(function($){

  workStatus();

  var modalHeight = $(window).height() * 0.70 + 'px';


  //click a search result table row, get a modal popup. 
  //(also called after pagination so that popups still work)
  //the doctype and guid are stored in the row's id.
  //id="las.76180c8bd920667a8a2229e060a127cf"
  var modalRowTrigger = function(){
    $('table tr').click(function(a){
      var idx_guid = $(this).attr('id').split('.');
      var idx = idx_guid[0]+'_idx';
      var guid = idx_guid[1];

      if (guid === undefined) {
        return
      };
      var arg = { guid: guid, idx: idx };

      $.post('/docDetail', arg, function(data){

	      $('#modalDocDetail #title'  ).html(data.title);
        $('#modalDocDetail #list'   ).html(data.list);
        $('#modalDocDetail #singles').html(data.singles);
        $('#modalDocDetail #base'   ).html(data.base);
      });

      $('#modalDocDetail').modal( {show:true, height:modalHeight} );

    });
  }
  modalRowTrigger();





  
/*
  function mapper(geo_loc){

    console.log(geo_loc.coordinates);
    console.log($('#r_map').height());

    var freshURL = 'http://{s}.tile.cloudmade.com/ac00b8ed30954bc3a49fb59af4d62820/997/256/{z}/{x}/{y}.png';

    var cloudmadeAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery &copy <a href="http://cloudmade.com">CloudMade</a>';

    var cloudmadeOptions = { maxzoom: 18, attribution: cloudmadeAttribution }
    var fresh = new L.TileLayer(freshURL, cloudmadeOptions)
  
    $('map').height(300);

    var map = new L.Map('map', {
      zoom: 10,
      layers: [fresh]
    });

    var center = geo_loc.coordinates.reverse();
    map.setView(center, 13);
    
  

    //var marker = L.marker([51.5, -0.09]).addTo(map);

    //var circle = L.circle([51.508, -0.11], 500, {
    //  color: 'red',
    //  fillColor: '#f03',
    //  fillOpacity: 0.5
    //}).addTo(map);
  }
*/







  //export csv? nope. can't do without faking a form and get a specified name
  /*
  $('#csv').click(function(e){
    $.post('/csvExport', function(data){
      var uri = 'data:application/csv;charset=UTF-8,' + 
      encodeURIComponent(data);

      console.log(uri)
      window.open(uri);
    });
  });
  */




  // hijack search event to show spinner, etc.
  $('#search').submit( function(e){
    $('#querySpinner').show(); // gets hidden on rendering the search index page
    e.preventDefault();
    this.submit();
  });


  // reload table via ajax pagination
  $('#pager').on("page", function(event, num){
    $('#querySpinner').show();

    var perPage = 10; //should match what's in controller

    var newFrom = (num * perPage) - perPage;

    var pageData = { from: newFrom };

    $.post('/ajaxSearch', pageData, function(data){

      var showFrom = newFrom + 1;
      var showEnd = showFrom - 1  + data.docs.length;

      if (data.docs.length === 1){
        $('#summary').text('Showing '+ showEnd + ' of ' + data.total);
      } else if (data.docs.length < perPage) {

	      //show all if on the last page has fewer than perPage...
        var end = data.docs.length;
        if (( data.total - showFrom) < perPage){
	        end = data.total;
	      }

        $('#summary').text('Showing '+ showFrom + ' through ' + 
	        end + ' of ' + data.total);

      } else {
        $('#summary').text('Showing '+ showFrom + ' through ' + 
	        showEnd + ' of ' + data.total);
      }

      $('#results tr').remove();

      // table header 
      var h = '<tr>';
      data.showFields.forEach(function(key){
	      h += '<th>'+ key +'</th>';
      });
      h += '</tr>';
      $('#results tbody').append(h);


      // table rows
      data.docs.forEach(function(doc){
        var r = '<tr id="'+doc.doctype+'.'+doc.guid+'">';
        data.realFields.forEach(function(key){ r += '<td>'+doc[key]+'</td>' });
        r += '</tr>'
	      $('#results tbody').append(r);


      });

      mapPoints(data.docs);

      modalRowTrigger();

    });


    $('#querySpinner').hide();

  });

  //window.onbeforeunload = function(){ console.log('did anything happen')};





});


var mapPoints = function(docs){

  var theme = 'http://{s}.tile.cloudmade.com/ac00b8ed30954bc3a49fb59af4d62820/997/256/{z}/{x}/{y}.png';

  var attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery &copy <a href="http://cloudmade.com">CloudMade</a>';

  var cloudOpts = { maxzoom: 18, attribution: attribution }
  var tiles = new L.TileLayer(theme, cloudOpts)
  
  var map = null;
  var map = new L.Map('map', {
    zoom: 10,
    layers: [tiles]
  });




  var markers = L.markerClusterGroup();
  docs.forEach(function(doc){
    if (doc.geo_loc) {
      var p = doc.geo_loc.coordinates;
      //a case for making an "identifier" field in the template
      var title = doc.uwi;
			var marker = L.marker(new L.LatLng(p[1], p[0]), { title: title });
			marker.bindPopup(title);
			markers.addLayer(marker);
    }
  });




  //map.setView(center, 13);

  map.addLayer(markers);

  map.fitBounds(markers.getBounds());

  
  /*
  var points = [];
  docs.forEach(function(doc){
    if (doc.geo_loc) {
      points.push(doc.geo_loc.coordinates.reverse());
    }
  });
  console.log(points);
  */
}
