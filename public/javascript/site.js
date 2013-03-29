jQuery(function($){
  
  // navbar link selection
  $('ul.nav > li > a[href="' + document.location.pathname + '"]').parent().addClass('active');


  // socket emissions "router"
  var socket = io.connect('http://localhost');

  socket.on('lasdoc', function(data){
    $('#ep_list').prepend('<li>'+data.crawled+' --- '+data.fullpath+'</li>');
  });

  socket.on('ziplasdoc', function(data){
    $('#ep_list').prepend('<li>'+data.crawled+' --- '+data.fullpath+'</li>');
  });


});
