jQuery(function($){
  
  // current page
  var loc = document.location.pathname.replace(/\//,'');

  $('#workSpinner').hide();
  $('#querySpinner').hide();

  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');

  var socket = io.connect('http://localhost');

  socket.on('workStart', function(n){
    console.log('received a workStart event!');
    $.post('/setWorkStatus', {working: 'yes'},  function(data){
      if (data.working != 'yes') {
        console.error('problem setting work status');
      }
      workStatus();
    });
  });

  socket.on('workStop', function(data){
    console.log('received a workStop event!  '+data);
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
  //hidden idx input is a self-infliced problem for not using a select input
  $('#searchFilterList li a').click(function(x){
    var caret = '<span>&nbsp;</span><span class="caret"></span>';
    var i = $(this).attr('idx');
    var v = $(this).attr('value');
    var btn = $("#searchFilterInput:first-child");
    btn.attr('value', v);
    btn.attr('idx', i);
    $('#idx').attr('value', i); //set the selected button
  })
      

});


/** workSpinner depends on the global 'working' variable, which workStatus
 * checks any time a new page loads to see if it should still be visible. 
 * This is unlike querySpinner which uses more traditional local vars.
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

