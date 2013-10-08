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

    /**
    /* dynamically pick the number of rows (i.e. size for ElasticSearch) based
    /* on the window height. This affects the pager too!
    /* navbar+padding = 70, searchSummaryBox ~ 70, listItem = 24
     */
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


});




/**
 * 2013-9-25: using a layerGroup to hold the markers layer caused the
 * leaflet-tile-container to get visibility=hidden after an ajax reload
 * if group.clearLayers() was called...???
 * workaround: just use the markergroup's own clearLayers method 
 */
var mapPoints = function(locsPerDoc){
  markers.clearLayers();

  locsPerDoc.forEach(function(set) {
    set.locations.forEach(function(loc){
      var p = loc.coordinates;
      var title = loc.title;
			var marker = L.marker(new L.LatLng(p.lat, p.lon), 
        { title: loc.loc_class });
			marker.bindPopup(title);
		  markers.addLayer(marker);
    })
  });

  map.addLayer(markers)
  map.fitBounds(markers.getBounds());
  setHoverFade();
}


  /**
   * For documents with one or more UWI fields...
   * 1. The loc_idx index contains uwi/lat-lon pairs
   * 2. If a doc has one or more uwis, look up the lat-lons and as the markers
   * 3. Hijack markers title attribute to be doctype-guid (there is no addClass
   *   for markers, and creating a bunch of dynamic layers is overkill)
   * 4. Each #results li field's id is also doctype-guid. This allows us to 
   *   hide/show markers when hovering on a list item.
   * 5. We also add a glyphicon to the badge/list to indicate which list items 
   *   should be mapped.
   */
var setHoverFade = function(){
  //add a globe icon to the result list row if its content is mappable
  $('#results li').each(function(x){
    var id = $(this).attr('id')
    var hits = $('.leaflet-marker-icon[title='+id+']'); 
    if (hits.length > 0) {
      var span = $(this).find('span.mappit').addClass('glyphicon glyphicon-globe')
    }
  })

  //fade in/out markers on hover over list item
  $('#results li').hover(
    function(){
      var id = $(this).attr('id')
      $('.leaflet-marker-icon[title!='+id+']').addClass('faded')
      $('.leaflet-marker-icon[title='+id+']').removeClass('faded')
    }, 
    function(){
      var id = $(this).attr('id')
      $('.leaflet-marker-icon[title!='+id+']').addClass('faded')
      $('.leaflet-marker-icon[title='+id+']').removeClass('faded')
    });
  

  //remove all marker shadows (they make markers too hard to see >200ish)
  $('#results').mouseenter(function(){
    $('.leaflet-marker-shadow').hide();
    
  });

  //remove all fades and restore shadows when mouse leaves the results list
  $('#results').mouseleave(function(){
    $('.leaflet-marker-shadow').removeClass('faded')
    $('.leaflet-marker-icon').removeClass('faded')
    $('.leaflet-marker-shadow').show();
  });
}
