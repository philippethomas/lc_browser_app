jQuery(function($){

  // adjustments for dynamically sized modal dialog
  var modalWidth = $(window).width() * 0.70 + 'px';
  var modalHeight = $(window).height() * 0.70 + 'px';
  var modalLeft = $(window).width() * 0.15 + 'px';
  var modalTop = $(window).height() * 0.15 + 'px';
  var modalBodyHeight = $(window).height() * 0.70 - 130 + 'px';

  $('#modalDocDetail').css(
      { 
	'width': modalWidth,
        'height': modalHeight,
        'max-height': modalHeight,
        'left': modalLeft,
        'top': modalTop,
        'margin': '0 auto' 
      }
  );

  $('#modalDocDetail .modal-body').css(
      { 
	'height': modalBodyHeight, 
	'max-height': modalBodyHeight
      }
  );



  // click a search result table row, get a modal popup
  $('table tr').click(function(a){
    var guid = $(this).attr('id');
    if (guid === undefined) { return };
    var arg = { guid: guid };
    $.post('/ajaxGetDoc', arg, function(data){
      $('#modalDocDetail .modal-body').html(data.body);
      $('#modalDocTitle').text(data.title);
    });
    $('#modalDocDetail').modal('toggle')
  });


  // hijack event just to show spinner while searching
  $('#search').submit( function(e){
    $('#spinner').show(); // gets hidden on rendering the index page
    $('#crawlSetup').hide();
    e.preventDefault();
    this.submit();
  });



  // reload table via ajax pagination
  $('#pager').on("page", function(event, num){
    $('#spinner').show();

    var perPage = 10; //should match what's in controller

    var newFrom = (num * perPage) - perPage;

    var pageData = { from: newFrom };

    $.post('/ajaxSearch', pageData, function(data){

      var showFrom = newFrom + 1;
      var showEnd = showFrom - 1  + data.docs.length;

      if (data.docs.length === 1){
        $('#summary').text('Showing '+ showEnd + ' of ' + data.total);
      } else if (data.docs.length < perPage) {
        $('#summary').text('Showing '+ showFrom + ' through ' + 
	  data.docs.length + ' of ' + data.total);
      } else {
        $('#summary').text('Showing '+ showFrom + ' through ' + 
	  showEnd + ' of ' + data.total);
      }

      $('#results tr').remove();

      // table header 
      var h = '<tr>';
      data.showFields.forEach(function(key){
	h += '<th>'+ key +'</th>';
      });
      h += '</tr>';
      $('#results tbody').append(h);

      // table rows
      data.docs.forEach(function(doc){
	var r = '<tr id="'+doc.id+'" class='+doc.doctype+'>';
	data.realFields.forEach(function(key){ r += '<td>'+doc[key]+'</td>' });
	r += '</tr>'
	$('#results tbody').append(r);
      });

    });

    $('#spinner').hide();

  });


});

