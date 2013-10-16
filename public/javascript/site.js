jQuery(function($){


  
  // current page
  var loc = document.location.pathname.replace(/\//,'');

  $('#workSpinner').hide();

  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');

  var socket = io.connect('http://localhost');

  socket.on('workStart', function(n){
    $('.navbar-nav li.crawler').each(function(i,n){
      $(n).addClass('disabled');
    });
    $.post('/setWorkStatus', {working: 'yes'},  function(data){
      if (data.working != 'yes') {
        console.error('problem setting work status');
      }
      workStatus();
    });
  });

  socket.on('workStop', function(data){
    $('.navbar-nav li.crawler').each(function(i,n){
      $(n).removeClass('disabled');
    });
    $.post('/setWorkStatus', {working: 'no'},  function(data){
      if (data.working != 'no') {
        console.error('problem setting work status');
      }
      workStatus();
      //location.reload(true);
    });
  });

  //socket.on('showHit', function(path){
  //  console.log('received a showHit event!');
  //  var s = '<li>'+path+'</li>';
  //  $('#epf_work_box').prepend(s);
  //});

  //socket.on('clearHits', function(){
  //  console.log('received an clearHits event!');
  //  $('#epf_work_box').empty();
  //})



  //rename dropdown button and set idx to match selection
  //hidden idx input is a self-inflicted problem for not using a select input
  $('#searchFilterList li a').click(function(x){
    //var caret = '<span>&nbsp;</span><span class="caret"></span>';
    var i = $(this).attr('idx');
    var v = $(this).attr('value');
    var btn = $("#searchFilterInput:first-child");
    btn.attr('value', v);
    btn.attr('idx', i);
    //$('#idx').attr('value', i); //set the selected hidden input too
    $('form#search #idx').attr('value', i); // the only one that counts!
  })








  //var map = L.map('map').setView([51.505, -0.09], 13);

  /*
  var redAlertURL = 'http://{s}.tile.cloudmade.com/ac00b8ed30954bc3a49fb59af4d62820/8/256/{z}/{x}/{y}.png';
  var freshURL = 'http://{s}.tile.cloudmade.com/ac00b8ed30954bc3a49fb59af4d62820/997/256/{z}/{x}/{y}.png';

  var cloudmadeAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>';

  var cloudmadeOptions = { maxzoom: 18, attribution: cloudmadeAttribution }
  var redAlert = new L.TileLayer(redAlertURL, cloudmadeOptions)
  var fresh = new L.TileLayer(freshURL, cloudmadeOptions)
  

  var map = new L.Map('map', {
    zoom: 10,
    layers: [redAlert,fresh]
  });

  map.setView([43.505, -106.09], 13)
  

  var marker = L.marker([51.5, -0.09]).addTo(map);

  var circle = L.circle([51.508, -0.11], 500, {
    color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5
  }).addTo(map);
  
  */
  



});


/** 
 * workSpinner depends on the global 'working' variable, which workStatus
 * checks any time a new page loads to see if it should still be visible. 
 */
function workStatus(){
  console.log('site.js workStatus got called....')
  $.get('/getWorkStatus', function(data){
    if (data.working === 'yes') {
      $('#workSpinner').show();
    } else if (data.working === 'no') {
      $('#workSpinner').hide();
    }
  });
};


function populateForm(frm, data) {   

  $(frm).find('input[type="checkbox"]:checked').prop('checked', false);

  $.each(data, function(key, value){  
    var $ctrl = $('[name='+key+']', frm);  
    switch($ctrl.attr("type"))  
    {  
      case "text" :   
      case "hidden":  
      case "textarea":  
        $ctrl.val(value);   
        break;   
      case "radio" : 
      case "checkbox":   
        $ctrl.prop('checked', true)
      break;  
    }  
  });  
}

