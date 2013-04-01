jQuery(function($){


  jQuery.validator.addMethod("isWindowsPath",
    function(value, element) {
    return /^((\\\\[a-zA-Z0-9-]+\\[a-zA-Z0-9`~!@#$%^&(){}'._-]+([ ]+[a-zA-Z0-9`~!@#$%^&(){}'._-]+)*)|([a-zA-Z]:))(\\[^ \\/:*?""<>|]+([ ]+[^ \\/:*?""<>|]+)*)*\\?$/.test( element.value );
  }, "Use a Windows path (UNC or drive letter).");
  
  jQuery.validator.addMethod("isURL",
    function(value, element) {
    return /(http|https).*\d*/.test( element.value );
  }, "Usually like: 'http://server:9200'.");

  
  $('#ep_crawl_form').submit(function(e){


    $('#ep_list').empty();
    if( $('#ep_crawl_form').valid() ){
      $('#ep_files_accord a.accordion-toggle').click();

      /* REGULAR POST TO AVOID PAGE REFRESH */
      var $this = $(this);
      $.post(
	$this.attr('action'),
	$this.serialize(),
	function(data){},
	'json'
      );

    }


    /* REGULAR POST TO AVOID PAGE REFRESH */
    /*
    var $this = $(this);
    $.post(
      $this.attr('action'),
      $this.serialize(),
      function(data){},
      'json'
    );

    e.preventDefault();
    */

    /* AJAX POST
    var form = e.currentTarget;
    $.ajaxForm({
      url: form.action,
      type: 'POST',
      data: $(form).serialize(),
      success: function(x){
        console.log("::::::::::::::::::::::::::::");
	console.log(e);
      },
      error: function(y){
	console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
	console.log(y);
      }

    });
    */

    e.preventDefault();


  });
  

   



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
  


});
