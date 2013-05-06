jQuery(function($){


  /** validator for ep_files form */
  jQuery.validator.addMethod("isWindowsPath",
    function(value, element) {
    return /^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/.test( element.value );
  }, "Use a Windows path (UNC or drive letter).");


  /** 
   * validation rules for jquery validation plugin
   * (commented out wonky 'OK!' label stuff)
   */
  $('#ep_crawl_form').validate(
    {
      rules: {
	label:    { minlength: 1, required: true },
	fw_root:  { isWindowsPath: 2, required: true },
	es_host:  { required: true },
	es_port:  { required: true },
	work_dir: { isWindowsPath: true, required: true },
        img_size: { min: 1, number: true, required: true },
        shp_feat: { min: 1, number: true, required: true }
      },
      highlight: function(element) {
	$(element).closest('.control-group').removeClass('success').addClass('error');
      },
      success: function(element) {
	element
	  //.text('OK!').addClass('valid')
	  .closest('.control-group').removeClass('error').addClass('success');
      }
    }
  );


  /**
   * finally...run a crawl!
   * (see the socket.io methods in app to see how events are handled)
   */
  $('#ep_crawl_form').submit(function(e){
    e.preventDefault();
    $('#ep_list').empty();
    if( $('#ep_crawl_form').valid() ){
      $('#crawlSetup').click()
      var $this = $(this);
      placeholderCrawl($this.serializeArray());
      $.post('/ep_files_crawl', $this.serialize() , function(data, status, jqXHR){
        //console.log(status);
      });
    }
  });





  
  /** click a prior crawl to auto-populate the form */
  $('#previousCrawlList li a').click(function(e){
    var guid = $(this).attr('guid')
    $.post('/getCrawlDoc', {guid: guid}, function(data){
      populateForm('#ep_crawl_form',data.crawl);
    });
  });




  /*
  $('#prevCrawlToggle').dblclick(function(){
    location.reload(true);
    $('#crawlSetup').click()
  });
  */





  /** DRY THIS UP DRY THIS UP DRY THIS CRAP UP */
  $.post('/stats', {doctype: 'las'}, function(data){

    var s = ''
    data.stats.forEach(function(x,i){


      var dupsLink = '(none)'
      if (x['dups'].length > 0){
	dupsLink = x['dups'].length+ '<a id="dup_"'+i+' href="#"> (click)</a>';
	/*
	var args = {
	  from: 0,
          size: 10,
          idx: doctype+'_idx',
	  query: x['dups'].join(' OR ')
	}
	*/


      }

	
      console.log(x.dups)
      


      s += '<div class="well white">';
      s += '<pre class="center labelSummary">'+x.label+'</pre>';
      s += '<br>'
      s += '<b>total count:</b>'
      s += '<span class="pull-right">'+x['totalCount']+' files</span><br>'
      s += '<b>total size:</b>'
      s += '<span class="pull-right">'+x['totalSize']+'</span><br>'
      s += '<b>duplicates:</b>'
      s += '<span class="pull-right">'+dupsLink+'</span><br>'
      s += '<dl>';
      s += '<dt>create MIN</dt><dd class="mono">'+x['ctimeMin']+'</dd>'
      s += '<dt>create MAX</dt><dd class="mono">'+x['ctimeMax']+'</dd>'
      s += '<dt>modify MIN</dt><dd class="mono">'+x['mtimeMin']+'</dd>'
      s += '<dt>modify MAX</dt><dd class="mono">'+x['mtimeMax']+'</dd>'
      s += '<dt>access MIN</dt><dd class="mono">'+x['atimeMin']+'</dd>'
      s += '<dt>access MAX</dt><dd class="mono">'+x['atimeMax']+'</dd>'
      s += '</dl>';
      s += '</div>';
    });

    $('#lasStats .content').html(s);


  });



  


});



/** append a new row in the list to show user something got saved */
function placeholderCrawl(a){
  var li = '<li><a href="#">'+ 
    '<span class="small-orange">(refresh for saved crawls)</span>'+
    '<span> ... </span>'+
    '<code>'+ a[0].value +'</code>'+
    '<span> ... </span>'+
    '<span class="mono">' + a[1].value +'</span>'+
    '</a></li>';
  
  $('#previousCrawlList').prepend(li);
};


