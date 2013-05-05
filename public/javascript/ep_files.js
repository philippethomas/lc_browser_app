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





  /** populate the previous crawls array */
  var prevCrawls = [];
  $('#crawlSetup').click(function(d){
    var arg = { crawlType: "ep_files" };
    $.post('/ajaxPreviousCrawls', arg, function(data){
      prevCrawls = data.prevCrawls;
    });
  })

  /** click a prior crawl and auto-populate the form */
  $('#previousCrawlList li').click(function(){
    var i = $(this).index();
    var c = prevCrawls[i];
    if (c !== undefined){
      populateForm('#ep_crawl_form',c);
    }
  });

  /*
  $('#prevCrawlToggle').dblclick(function(){
    location.reload(true);
    $('#crawlSetup').click()
  });
  */




  $.post('/stats', {doctype: 'las'}, function(data){
    console.log('============');
    console.log(data);
    //$('#lasStats .title').text(data.stats.labels);
    console.log('============');
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
  
  $('#previousCrawlList').append(li);
};


