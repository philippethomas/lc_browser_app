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
  // as a hidden field on form before rendering the search index page
  $('#search').submit( function(e){
    $('#querySpinner').show(); 
    e.preventDefault();
    var size = resultRowCount();
    $(this).append('<input type="hidden" id="size" name="size" value="'+ size +'"/>');
    this.submit();
  });






  // reload table via ajax pagination
  $('#pager').on("page", function(event, num){

    $('#querySpinner').show();

    var perPage = resultRowCount();

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

      mappedItems = {} //defined on index
      
      $('#results li').remove();
      data.badges.forEach(function(b){
	      $('#results').append(b);
      });

      //only try to map if locations are present
      var mappable = false;
      for (var key in data.locsPerDoc) {
        if (data.locsPerDoc[key].locations.length > 0) {
          mappable = true;
        }
      }

      if (mappable) {
        mapResults(data.locsPerDoc);
      }

      //mapResults(data.locsPerDoc);
      modalRowTrigger();

    });


    $('#querySpinner').hide();

  });




});


/**
/* dynamically pick the number of rows (i.e. size for ElasticSearch) based
/* on the window height. This affects the pager too!
/* navbar+padding = 70, searchSummaryBox ~ 70, listItem = 24
*/
var resultRowCount = function(){
  var windowHeight = $(window).height();
  var size = Math.floor((windowHeight - 180)/24);
  return size
}


/**
 * 2013-9-25: using a layerGroup to hold the markers layer caused the
 * leaflet-tile-container to get visibility=hidden after an ajax reload
 * if group.clearLayers() was called...???
 * workaround: just use the markergroup's own clearLayers method 
 */
var mapResults = function(locsPerDoc){
  markers.clearLayers();

  
  locsPerDoc.forEach(function(set) {

    var locations = [];
    set.locations.forEach(function(loc){

      if (loc.type === 'point') {

        var p = loc.coordinates;
        var title = loc.title;
        var marker = L.marker(new L.LatLng(p.lat, p.lon), { title: title });
        marker.bindPopup(title);
        markers.addLayer(marker);

        locations.push(marker);

      } else if (loc.type === 'box') {

        var p = loc.coordinates;
        var title = loc.title;

        var sw = new L.LatLng(loc.sw_lat, loc.sw_lon);
        var ne = new L.LatLng(loc.ne_lat, loc.ne_lon);
        var bounds = new L.LatLngBounds(sw, ne);
        var rect = L.rectangle(bounds, {color: "#428bca", weight: 2})
        rect.bindPopup(title);
        markers.addLayer(rect);

        locations.push(rect)

      }
    })
    mappedItems[set.id] = locations;

  });

  map.addLayer(markers)
  map.fitBounds(markers.getBounds());
  highlighter()
}



var highlighter = function(){

  //mark mappable list items with a little globe
  for(var key in mappedItems){
    if (mappedItems[key].length > 0) {
      $('#results li#'+key).find('span.mappit').addClass('glyphicon glyphicon-globe')
    }
  }

  //show/hide shapes based on badge hovers
  $('#results li').mouseover(function(){
    var id = $(this).attr('id');
    for(var key in mappedItems) {
      if (id === key) {
        mappedItems[key].forEach(function(shape){ showIt(shape); });
      } else {
        mappedItems[key].forEach(function(shape){ fadeIt(shape); });
      }
    }
  });

  //remove marker shadows on entering #results (too messy if 200+ markers)
  $('#results').mouseenter(function(){
    $('.leaflet-marker-shadow').hide();
  });

  //restore opacity and shadows when mouse leaves the results list
  $('#results').mouseleave(function(){
    for(var key in mappedItems) {
      mappedItems[key].forEach(function(shape){ showIt(shape); });
    }
    $('.leaflet-marker-shadow').show();
  });
}

// _latlng implies point  |  _latlngs implies polygon
var fadeIt = function(o){
  if (o._latlng) {
    o.setOpacity(0.05);
  } else if (o._latlngs) {
    o.setStyle({opacity:'0.1', fillOpacity:'0.05'});
  }
}
var showIt = function(o){
  if (o._latlng) {
    o.setOpacity(1.0);
  } else if (o._latlngs) {
    o.setStyle({opacity:'0.6', fillOpacity:'0.3'});
  }
}
