jQuery(function($){


  $('#spinner').hide();
 
  // current page
  var loc = document.location.pathname.replace(/\//,'');


  // show/hide crawlSetup button with appropriate route
  if (loc === '' || loc === 'search'){
    $('#crawlSetup').hide();
  }else{
    $('#crawlSetup').show();
    $('#crawlSetup').attr('data-parent','#'+loc+'_accordion')
    $('#crawlSetup').attr('href','#'+loc+'_collapse')
  }
  
  // navbar link selection
  $('ul.nav > li > a[href="/' + loc + '"]').parent().addClass('active');



  var socket = io.connect('http://localhost');

  socket.on('lasdoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
    //$('#search_results').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });

  socket.on('sgydoc', function(doc){
    $('#ep_list').prepend('<li class="thing">'+doc.crawled+' --- '+doc.fullpath+'</li>');
  });



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

