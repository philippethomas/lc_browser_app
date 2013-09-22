jQuery(function($){

  workStatus();

  var modalHeight = $(window).height() * 0.70 + 'px';


  //click a search result table row, get a modal popup. 
  //(also called after pagination so that popups still work)
  //the doctype and guid are stored in the row's id.
  //id="las.76180c8bd920667a8a2229e060a127cf"
  var modalRowTrigger = function(){
    $('table tr').click(function(a){
      var idx_guid = $(this).attr('id').split('.');
      var idx = idx_guid[0]+'_idx';
      var guid = idx_guid[1];

      if (guid === undefined) {
        return
      };
      var arg = { guid: guid, idx: idx };

      $.post('/docDetail', arg, function(data){
	      $('#modalDocDetail #title'  ).html(data.title);
        $('#modalDocDetail #panel'  ).html(data.panel);
        $('#modalDocDetail #list'   ).html(data.list);
        $('#modalDocDetail #singles').html(data.singles);
        $('#modalDocDetail #base'   ).html(data.base);
      });

      $('#modalDocDetail').modal( {show:true, height:modalHeight} );

    });
  }
  modalRowTrigger();



  //export csv? nope. can't do without faking a form and get a specified name
  /*
  $('#csv').click(function(e){
    $.post('/csvExport', function(data){
      var uri = 'data:application/csv;charset=UTF-8,' + 
      encodeURIComponent(data);

      console.log(uri)
      window.open(uri);
    });
  });
  */




  // hijack search event to show spinner, etc.
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
        var r = '<tr id="'+doc.doctype+'.'+doc.guid+'">';
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


