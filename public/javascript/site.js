
jQuery(function($){
  
  // current page
  var loc = document.location.pathname.replace(/\//,'');

  
  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');


  var socket = io.connect('http://localhost');

  socket.on('lasdoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });
  socket.on('sgydoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });
  socket.on('shpdoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });
  socket.on('rasdoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });


  socket.on('walkerStart', function(n){
    console.log('received a walkerStart event!');
    $.post('/setWorkStatus', {working: "yes"},  function(data){
      if (data.working != "yes") { console.log('problem setting work status'); }
      setWalkSpin();
    });
  });
 
  socket.on('walkerStop', function(n){
    console.log('received a walkerStop event!');
    //window.location.replace('/');
    $.post('/setWorkStatus', {working: "no"},  function(data){
      if (data.working != "no") { console.log('problem setting work status'); }
      setWalkSpin();
    });
  });





});


/** walkerSpinner depends on the global 'working' variable, which setWalkSpin 
 * checks any time a new page loads to see if it should still be visible. 
 * This is unlike querySpinner which uses more traditional local vars.
 */
function setWalkSpin(){
  $.post('/getWorkStatus', function(data){
    if (data.working === "yes") {
      $('#walkerSpinner').show();
    } else if (data.working === "no") {
      $('#walkerSpinner').hide();
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

