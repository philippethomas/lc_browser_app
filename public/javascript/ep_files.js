jQuery(function($){


  jQuery.validator.addMethod("isWindowsPath",
    function(value, element) {
    return /^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/.test( element.value );
  }, "Use a Windows path (UNC or drive letter).");
 

  // 1. validation happens client-side
  // 2. prevent page reload when submitting crawl form
  // 3. toggle (hide) crawl form on submit
  // 4. add crawldata to the prevCrawls array
  $('#ep_crawl_form').submit(function(e){
    e.preventDefault();
    $('#ep_list').empty();
    if( $('#ep_crawl_form').valid() ){

      $('#crawlSetup').click()
      
      var $this = $(this);

      placeholderCrawl($this.serializeArray());
  
      $.post('/save_and_run', $this.serialize() , function(data, status, jqXHR){
        //console.log(status);
      });

    }

  });
  

  // validation rules for jquery validation plugin
  // commented out wonky 'OK!' label stuff
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
  

  //----------
  // populate crawl form with previous crawl data
  // prev is rendered on the page by the view with data from ES
  $('#previousCrawlList li').click(function(){
    var i = $(this).index();
    var c = prevCrawls[i];
    if (c !== undefined){
      populateForm('#ep_crawl_form',c);
    }
  });


  $('#prevCrawlToggle').dblclick(function(){
    location.reload(true);
    $('#crawlSetup').click()
  });


});



//----------
// append a new row in the list to show user something got saved (if they look)
function placeholderCrawl(a){
  var li = '<li><a href="#"> <code>'+ a[0].value +'</code><span> </span><span class="mono">'+a[1].value+'</span><span> </span><span class="small-orange">(refresh page for saved crawls)</span></a></li>';
  
  $('#previousCrawlList').append(li);
};


