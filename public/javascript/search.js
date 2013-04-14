jQuery(function($){

  /*
  $('#search').submit(function(){
    console.log('search got focus');
    location.href = "/search"
  });
  */

  //$('#search').click(function(e){
  //$('#dumb').click(function(e){
  $('#search').submit(function(e){
    console.log('search form submitted');
    $('.block-content').hide();
    $('.block-search').show();
    $('#crawlSetup').hide();
    $('ul.nav li').removeClass('active');

    //show search content
    //hide crawl setup button
    //deselect navbar item
    
    e.preventDefault();

    //spinner show

    var formData = $(this).serialize();
      
    //$.post('/ajaxSearch', $(this).serialize() , function(data){
    $.post('/ajaxSearch', formData , function(data){
      console.log(data);
      $('#results').append(data.docs[0].guid);

      $('#pager').bootpag({
	total: data.total/2
      }).on("page", function(event, num){
	console.log('=============='+num);
      });

      //spinner hide
    }); 

      
  });








});


