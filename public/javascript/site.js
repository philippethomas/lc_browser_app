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



  // init locs handler
  $('#initLocs').click(function(e){
    var a = confirm('This will remove all documents in the locations index! '+
      'Are you sure?');
    if (a) {
      $.post('/initLocs', {doctype: 'loc'}, function(data){
        if (data.match(/^Deleted.*Created/)){
          setTimeout(function(){ 
            console.log('pausing a bit to let ElasticSearch recover...');
            location.reload();
          }, 1000);
        } else {
          console.error(err);
        }
      });
    } 
  });


});


/** 
 * workSpinner depends on the global 'working' variable, which workStatus
 * checks any time a new page loads to see if it should still be visible. 
 */
function workStatus(){
  //console.log('site.js workStatus got called....')
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

