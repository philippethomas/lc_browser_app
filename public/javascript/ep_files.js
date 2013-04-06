jQuery(function($){


  // custom windows path and url validators for crawler forms
  jQuery.validator.addMethod("isWindowsPath",
    function(value, element) {
    return /^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/.test( element.value );
  }, "Use a Windows path (UNC or drive letter).");
  
  jQuery.validator.addMethod("isURL",
    function(value, element) {
    return /(http|https).*\d*/i.test( element.value );
  }, "Usually like: 'http://server:9200'.");

  // 1. validation happens client-side
  // 2. prevent page reload when submitting crawl form
  // 3. toggle (hide) crawl form on submit
  // 4. add crawldata to the prevCrawls array
  $('#ep_crawl_form').submit(function(e){
    $('#ep_list').empty();
    if( $('#ep_crawl_form').valid() ){

      $('#crawlSetup').click()
      
      var $this = $(this);

      placeholderCrawl($this.serializeArray());

      $.post(
	$this.attr('action'),
	$this.serialize(),
	function(data){},
	'json'
      );
    }

    e.preventDefault();
  });
  

  // validation rules for jquery validation plugin
  // commented out wonky 'OK!' label stuff
  $('#ep_crawl_form').validate(
    {
      rules: {
	label:    { minlength: 1, required: true },
	fw_root:  { isWindowsPath: 2, required: true },
	es_url:   { isURL: 2, required: true },
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
  $('#previousCrawls li').click(function(){
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
// append a new row in the list just to show user something got saved
function placeholderCrawl(a){
  /*
  adapted from http://benalman.com/projects/jquery-misc-plugins/#serializeobject
  var obj = {};
  $.each(a, function(i,o){
    var n = o.name,
    v = o.value;

  obj[n] = obj[n] === undefined ? v
    : $.isArray( obj[n] ) ? obj[n].concat( v )
    : [ obj[n], v ];
  });

  obj.saved = 'pending (refresh page)';
  prevCrawls.push(obj);
  console.log(obj);
  console.log(prevCrawls);
  */
  var li = '<li><a href="#"> <code>'+ a[0].value +'</code><span> </span><span class="mono">'+a[1].value+'</span><span> </span><span class="small-orange">(refresh page for saved crawls)</span></a></li>'
  $('#previousCrawls').append(li);

};




