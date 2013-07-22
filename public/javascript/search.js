jQuery(function($){

  workStatus();

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
    { 'height': modalBodyHeight, 'max-height': modalBodyHeight }
    );


  // click a search result table row, get a modal popup. (also called after
  // pagination so that popups still work
  var modalRowTrigger = function(){
    $('table tr').click(function(a){
      //the doctype and guid are stored in the row's id.
      //id="las.76180c8bd920667a8a2229e060a127cf"
      var idx_guid = $(this).attr('id').split('.');
      var idx = idx_guid[0]+'_idx';
      var guid = idx_guid[1];
      if (guid === undefined) { return };
      var arg = { guid: guid, idx: idx };
      $.post('/ajaxGetDoc', arg, function(data){
	      $('#modalDocDetail .modal-body').html(data.body);
	      $('#modalDocTitle').text(data.title);
      });
      $('#modalDocDetail').modal('toggle')
    });
  }
  modalRowTrigger();


  // hijack event to show spinner, etc.
  $('#search').submit( function(e){
    $('#querySpinner').show(); // gets hidden on rendering the search index page
    e.preventDefault();
    this.submit();
  });


  // reload table via ajax pagination
  $('#pager').on("page", function(event, num){
    $('#querySpinner').show();

    var perPage = 10; //should match what's in controller

    var newFrom = (num * perPage) - perPage;

    var pageData = { from: newFrom };

    $.post('/ajaxSearch', pageData, function(data){

      var showFrom = newFrom + 1;
      var showEnd = showFrom - 1  + data.docs.length;

      if (data.docs.length === 1){
        $('#summary').text('Showing '+ showEnd + ' of ' + data.total);
      } else if (data.docs.length < perPage) {

	//show all if on the last page has fewer than perPage...
        var end = data.docs.length;
        if (( data.total - showFrom) < perPage){
	  end = data.total;
	}

        $('#summary').text('Showing '+ showFrom + ' through ' + 
	  end + ' of ' + data.total);

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
	var r = '<tr id="'+doc.doctype+'.'+doc.guid+'" class='+doc.doctype+'>';
	data.realFields.forEach(function(key){ r += '<td>'+doc[key]+'</td>' });
	r += '</tr>'
	$('#results tbody').append(r);
      });
      modalRowTrigger();

    });


    $('#querySpinner').hide();

  });

  //window.onbeforeunload = function(){ console.log('did anything happen')};

});

