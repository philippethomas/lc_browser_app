jQuery(function($){

  // current page
  var loc = document.location.pathname.replace(/\//,'');


  // show/hide crawlSetup button with appropriate route
  if (loc === ""){
    $('#crawlSetup').hide();
  }else{
    $('#crawlSetup').show();
    $('#crawlSetup').attr('data-parent','#'+loc+'_accordion')
    $('#crawlSetup').attr('href','#'+loc+'_collapse')
  }
  
  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');



  // socket emissions "router"
  var socket = io.connect('http://localhost');

  socket.on('lasdoc', function(data){
    $('#ep_list').prepend('<li>'+data.crawled+' --- '+data.fullpath+'</li>');
  });

  //socket.on('ziplasdoc', function(data){
  //  $('#ep_list').prepend('<li>'+data.crawled+' --- '+data.fullpath+'</li>');
  //});

  

});


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

