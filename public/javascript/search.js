jQuery(function($){

  //var perX = parseInt($.ajax({
  //  type: 'GET',
  //  url: '/perPage',
  //  async: false
  //}).responseText);

  /*
  $('#csv').submit( function(e){
    $('#spinner').show(); 
    e.preventDefault();

    $.post('/csvExport', {}, function(data){

      console.log(data);
    })
    .done(function(){
      $('#csv').unbind('submit').submit();
    });

    return false;
  });
  */








  $('#search').submit( function(e){
    $('#spinner').show(); // gets hidden on rendering the index page
    $('#crawlSetup').hide();
    e.preventDefault();
    this.submit();
  });



  $('#pager').on("page", function(event, num){
    $('#spinner').show();

    var perPage = 10; //should match what's in controller

    var newFrom = (num * perPage) - perPage;

    var pageData = {
      from: newFrom
    };

    $.post('/ajaxSearch', pageData, function(data){

      var showFrom = newFrom + 1;
      var showEnd = showFrom - 1  + data.docs.length;

      if (data.docs.length === 1){
        $('#summary').text('Showing '+ showEnd + ' of ' + data.total);
      }else if (data.docs.length < perPage){
        $('#summary').text('Showing '+ showFrom + ' through ' + data.docs.length + ' of ' + data.total);
      }else{
        $('#summary').text('Showing '+ showFrom + ' through ' + showEnd + ' of ' + data.total);
      }

      replaceSearchResults(data.docs);

    });

    $('#spinner').hide();

  });


});


function replaceSearchResults(docs){
  $('#results tr').remove();

  $('#results tbody').append('<tr> <th>label</th> <th>path</th> <th>identifier</th> <th>details</th>')

  docs.forEach( function(doc){
    var row = '<tr id="'+doc.guid+'" class='+doc.doctype+'>'+
    '<td>'+doc.label+'</td>'+
    '<td>'+doc.fullpath+'</td>'+
    '<td>'+doc.uwi+'</td>'+
    '<td>'+doc.curves+'</td>'+
    '</tr>'
    $('#results tbody').append(row);
  });

}






