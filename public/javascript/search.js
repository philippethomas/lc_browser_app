jQuery(function($){

  workStatus();

  var modalHeight = $(window).height() * 0.70 + 'px';


  //click a search result table row, get a modal popup. 
  //(also called after pagination so that popups still work)
  //the doctype and guid are stored in the row's id.
  //id="las.76180c8bd920667a8a2229e060a127cf"
  var modalRowTrigger = function(){
    $('#results li').click(function(a){
      var idx_guid = $(this).attr('id').split('-');
      console.log(idx_guid)
      var idx = idx_guid[0]+'_idx';
      var guid = idx_guid[1];

      if (guid === undefined) {
        return
      };
      var arg = { guid: guid, idx: idx };

      $.post('/docDetail', arg, function(data){

	      $('#modalDocDetail #title'  ).html(data.title);
	      $('#modalDocDetail #l_panel').html(data.l_panel);
	      $('#modalDocDetail #r_panel').html(data.r_panel);
        $('#modalDocDetail #base'   ).html(data.base);
      });

      $('#modalDocDetail').modal( {show:true, height:modalHeight} );

    });
  }
  modalRowTrigger();



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




  // hijack search event to show spinner, calculate row count to return
  $('#search').submit( function(e){
    $('#querySpinner').show(); // gets hidden on rendering the search index page
    e.preventDefault();
    var windowHeight = $(window).height();

    //dynamically pick the number of rows (i.e. size for ElasticSearch) based
    //on the window height. This affects the pager too!
    //navbar+padding = 70, searchSummaryBox ~ 70, listItem = 24
    var size = Math.floor((windowHeight - 180)/24);

    $(this).append('<input type="hidden" id="size" name="size" value="'+ size +'"/>');

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
      var showEnd = showFrom - 1  + data.badges.length;

      if (data.badges.length === 1){
        $('#summary').text(showEnd + ' of ' + data.total);
      } else if (data.badges.length < perPage) {

	      //show all if on the last page has fewer than perPage...
        var end = data.badges.length;
        if (( data.total - showFrom) < perPage){
	        end = data.total;
	      }
        $('#summary').html(showFrom +' &#10511; '+ end +' of '+ data.total);

      } else {
        $('#summary').html(showFrom +' &#10511; ' + showEnd +' of '+ data.total);
      }

      
      $('#results li').remove();
      data.badges.forEach(function(b){
	      $('#results').append(b);
      });

      mapPoints(data.locsPerDoc);
      modalRowTrigger();

    });


    $('#querySpinner').hide();

  });

  //window.onbeforeunload = function(){ console.log('did anything happen')};





  $('#results li').hover(
    function(){
      var id = $(this).attr('id')
      var exc = '.leaflet-marker-icon[title!='+id+']'
      var inc = '.leaflet-marker-icon[title='+id+']'
      $(exc).addClass('faded')
      $(inc).removeClass('faded')
      //$('.leaflet-marker-shadow').addClass('faded')
    }, 
    function(){
      var id = $(this).attr('id')
      var exc = '.leaflet-marker-icon[title!='+id+']'
      var inc = '.leaflet-marker-icon[title='+id+']'
      $(exc).addClass('faded')
      $(inc).removeClass('faded')
      //$('.leaflet-marker-shadow').removeClass('faded')
    });

  
  $('#results').mouseleave(function(){
      $('.leaflet-marker-shadow').removeClass('faded')
      $('.leaflet-marker-icon').removeClass('faded')
    });




});




/**
 * 2013-9-25: using a layerGroup to hold the markers layer caused the
 * leaflet-tile-container to get visibility=hidden after an ajax reload
 * if group.clearLayers() was called...???
 * workaround: just use the markergroup's own clearLayers method 
 */
var mapPoints = function(locsPerDoc){

  markers.clearLayers();
  console.log(locsPerDoc)

  locsPerDoc.forEach(function(set) {

    set.locations.forEach(function(loc){
      var p = loc.coordinates;
      var title = loc.title;
			var marker = L.marker(new L.LatLng(p.lat, p.lon), 
        { title: loc.loc_class });
      

			marker.bindPopup(title);
		  markers.addLayer(marker);

      /*
      markers.on('click', function(d) {
        var marker_title = '#' + d.layer.options.title.toLowerCase();
        if ( $(marker_title) ){
          console.log(marker_title);
        }
      });
      */
      

    })

  });

  map.addLayer(markers)
  map.fitBounds(markers.getBounds());


  /*
  locations.forEach(function(loc){
    if (loc.coordinates) {
      var p = loc.coordinates;
      var title = loc.title;
			var marker = L.marker(new L.LatLng(p.lat, p.lon), { title: title });

			marker.bindPopup(title);
			markers.addLayer(marker);
    } else {
      console.warn('no coordinates for '+loc.loc_id);
    }
  });
  map.addLayer(markers)

  map.fitBounds(markers.getBounds());
  */
}
