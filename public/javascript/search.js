jQuery(function($){

  workStatus();

  var modalHeight = $(window).height() * 0.70 + 'px';

  //click a search result table row, get a modal popup. 
  //(also called after pagination so that popups still work)
  //the doctype and guid are stored in the row's id.
  //id="las.76180c8bd920667a8a2229e060a127cf"
  var modalRowTrigger = function(){
    $('#results tbody tr').click(function(a){
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
    $('.navbar-nav button').remove(); //the run crawl button briefly visible?
    $('#workSpinner').show(); 
    e.preventDefault();
    var size = resultRowCount();
    $(this).append('<input type="hidden" id="size" name="size" value="'+ size +'"/>');
    this.submit();
  });



  var perPage = resultRowCount();


  // reload table via ajax pagination
  $('#pager').on("page", function(event, num){

    //NOPE. defining perPage in the on("page" action gets screwy if the user 
    //resizes the window while progressing through pages. There is no simple 
    //way to reinitialize #pager from within this on("page" action.
    
    //var perPage = resultRowCount();

    var newFrom = (num * perPage) - perPage;

    var pageData = { from: newFrom };

    $('#workSpinner').show();
    $.post('/ajaxSearch', pageData, function(data){

      var showFrom = newFrom + 1;
      var showEnd = showFrom - 1  + data.rows.length;

      if (data.rows.length === 1){
        $('#summary').text(showEnd + ' of ' + data.total);
      } else if (data.rows.length < perPage) {

	      //show all if on the last page has fewer than perPage...
        var end = data.rows.length;
        if (( data.total - showFrom) < perPage){
	        end = data.total;
	      }
        $('#summary').html(showFrom +' &#10511; '+ end +' of '+ data.total);

      } else {
        $('#summary').html(showFrom +' &#10511; ' + showEnd +' of '+ data.total);
      }

      mappedItems = {} //defined on index
      
      $('#results tbody tr').remove();
      data.rows.forEach(function(r){
	      $('#results tbody').append(r);
      });

      //only try to map if locations are present
      var mappable = false;
      for (var key in data.locsPerDoc) {
        var mc = data.locsPerDoc[key].locations.length;
        if (mc > 0) {
          mappable = true;
        }
      }

      if (mappable) {
        showMap();
        mapResults(data.locsPerDoc);
      } else {
        hideMap();
        pointMarkers.clearLayers();
        polyMarkers.clearLayers();
      }

      modalRowTrigger();

    }).then(function(){
      $('#workSpinner').hide();
    });



  });




});


var showMap = function(){
  $('#no_map').hide();
  $('#map').fadeIn();
}

var hideMap = function(){
  $('#map').hide();
  $('#no_map').fadeIn();
}



/**
/* dynamically pick the number of rows (i.e. size for ElasticSearch) based
/* on the window height. This affects the pager too!
/* navbar+padding = 70, searchSummaryBox ~ 70, tr = 31
*/
var resultRowCount = function(){
  var slop = 225;
  var windowHeight = $(window).height();
  var size = Math.floor((windowHeight - slop)/31);
  size = (size < 1) ? 1 : size; //in case the window is too small for even one
  return size
}


/**
 * pointMarkers (MarkerClusterGroup) and polyMarkers (FeatureGroup) are defined 
 * on search/index. Not sure if it's a bug, but trying to put them in a "combo"
 * FeatureGroup and then add that to the map causes tiles to vanish (?)
 */
var mapResults = function(locsPerDoc){
  pointMarkers.clearLayers();
  polyMarkers.clearLayers();

  locsPerDoc.forEach(function(set) {

    var locations = [];
    set.locations.forEach(function(loc){

      if (loc.type === 'point') {

        var p = loc.coordinates;
        var title = loc.title;

        var marker = L.circle(new L.LatLng(p.lat, p.lon), 100, {
          color: '#428bca',
          opacity: 0.6,
          fillColor: '#428bca',
          fillOpacity: 0.3,
          title: title
        })

        marker.bindPopup(title);
        pointMarkers.addLayer(marker);

        locations.push(marker);

      } else if (loc.type === 'box') {

        var p = loc.coordinates;
        var title = loc.title;

        var sw = new L.LatLng(loc.sw_lat, loc.sw_lon);
        var ne = new L.LatLng(loc.ne_lat, loc.ne_lon);
        var bounds = new L.LatLngBounds(sw, ne);
        var rect = L.rectangle(bounds, {color: "#428bca", weight: 2})
        rect.bindPopup(title);
        polyMarkers.addLayer(rect);

        locations.push(rect)

      }
    })
    mappedItems[set.id] = locations;

  });

  var combo = new L.FeatureGroup();
  combo.addLayer(pointMarkers);
  combo.addLayer(polyMarkers);

  map.addLayer(pointMarkers);
  map.addLayer(polyMarkers);
  //note, we don't actually add combo to the map--just use to get bounds
  map.fitBounds(combo.getBounds());

  highlighter();
}



var highlighter = function(){

  //mark mappable list items with a little globe
  for(var key in mappedItems){
    if (mappedItems[key].length > 0) {
      $('#results tr#'+key).find('span.mappit').addClass('glyphicon glyphicon-globe')
    }
  }

  //show/hide shapes based on table row hovers
  $('#results tr').mouseover(function(){
    var id = $(this).attr('id');
    for(var key in mappedItems) {
      if (id === key) {
        mappedItems[key].forEach(function(shape){ showIt(shape); });
      } else {
        mappedItems[key].forEach(function(shape){ fadeIt(shape); });
      }
    }
  });

  //switched from markers to circles. uncomment shadow stuff if using markers.
  //remove marker shadows on entering #results (too messy if 200+ markers)
  /*
  $('#results').mouseenter(function(){
    $('.leaflet-marker-shadow').hide();
  });
  */

  //restore opacity and shadows when mouse leaves the results list
  $('#results').mouseleave(function(){
    for(var key in mappedItems) {
      mappedItems[key].forEach(function(shape){ showIt(shape); });
    }
    //$('.leaflet-marker-shadow').show();
  });
}

// _latlng implies point  |  _latlngs implies polygon
// if using regular markers, use setOpacity; if using circle, same as polygon
var fadeIt = function(o){
  if (o._latlng) {
    //o.setOpacity(0.05);
    o.setStyle({opacity:'0.1', fillOpacity:'0.05'});
  } else if (o._latlngs) {
    o.setStyle({opacity:'0.1', fillOpacity:'0.05'});
  }
}
var showIt = function(o){
  if (o._latlng) {
    //o.setOpacity(1.0);
    o.setStyle({opacity:'0.6', fillOpacity:'0.3'});
  } else if (o._latlngs) {
    o.setStyle({opacity:'0.6', fillOpacity:'0.3'});
  }
}
