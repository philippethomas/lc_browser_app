jQuery(function($){
  
  // current page
  var loc = document.location.pathname.replace(/\//,'');

  
  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');


  var socket = io.connect('http://localhost');

  $.post('/epDoctypes', function(data){
    data.doctypes.forEach(function(t){
      socket.on(t+'doc', function(doc){
	var s = '<div class="'+doc.doctype+'bg progress-box" title="'+
	  doc.basename+'"></div>'
	$('#ep_work_box').prepend(s);
      });
    });
  });



  socket.on('workStart', function(n){
    console.log('received a workStart event!');
    $.post('/setWorkStatus', {working: 'yes'},  function(data){
      if (data.working != 'yes') { console.log('problem setting work status'); }
      workStatus();
    });
  });
 
  socket.on('workStop', function(n){
    console.log('received a workStop event!');
    $.post('/setWorkStatus', {working: 'no'},  function(data){
      if (data.working != 'no') { console.log('problem setting work status'); }
      $('#clickForStats').show();
      workStatus();
    });
  });





});


/** workSpinner depends on the global 'working' variable, which workStatus
 * checks any time a new page loads to see if it should still be visible. 
 * This is unlike querySpinner which uses more traditional local vars.
 */
function workStatus(){
  $.post('/getWorkStatus', function(data){
    if (data.working === 'yes') {
      $('#workSpinner').show();
      $('#ep_work_box').show();
      $('#ep_form_box').hide();
    } else if (data.working === 'no') {
      $('#workSpinner').hide();
      //$('#ep_work_box').hide();
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

