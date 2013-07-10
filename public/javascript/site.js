jQuery(function($){
  
  // current page
  var loc = document.location.pathname.replace(/\//,'');

  
  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');


  var socket = io.connect('http://localhost');

  /*
  $.post('/epDoctypes', function(data){
    data.doctypes.forEach(function(t){
      console.log('------------------------------------'+t);
      socket.on(t+'doc', function(doc){
        var s = '<div class="'+doc.doctype+'bg progress-box" title="'+
        doc.basename+'"></div>'
        $('#epf_work_box').prepend(s);
      });
    });
  });
  */


  socket.on('parsedDoc', function(msg){
    var s = '<div class="'+msg.doctype+'bg progress-box" title="'+
    msg.basename+'"></div>'
    $('#epf_work_box').prepend(s);
  });


  socket.on('workStart', function(n){
    console.log('received a workStart event!');
    $.post('/setWorkStatus', {working: 'yes'},  function(data){
      if (data.working != 'yes') { console.error('problem setting work status'); }
      workStatus();
    });
  });


  socket.on('workStop', function(n){
    console.log('received a workStop event!');
    $.post('/setWorkStatus', {working: 'no'},  function(data){
      if (data.working != 'no') { console.error('problem setting work status'); }
      workStatus();
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

 





});


/** workSpinner depends on the global 'working' variable, which workStatus
 * checks any time a new page loads to see if it should still be visible. 
 * This is unlike querySpinner which uses more traditional local vars.
 * TODO: change ids to make this work globally
 */
function workStatus(){
  $.post('/getWorkStatus', function(data){
    if (data.working === 'yes') {
      $('#workSpinner').show();
      $('#epf_work_box').show();
    } else if (data.working === 'no') {
      $('#workSpinner').hide();
      //$('#epf_work_box').hide();
    }
  });

};


function populateForm(frm, data) {   

  $(frm).find('input[type=checkbox]:checked').removeAttr('checked')

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
        $ctrl.each(function(){
          if($(this).attr('value') == value) {  
            $(this).attr("checked",value); 
          }
        });   
        break;  
    }  
    });  
}

