jQuery(function($){

  
  $('#ep_crawl_form').submit(function(e){
    

    //$('#ep_files_accord a.accordion-toggle').click();

    $('#ep_list').empty();

    if( $('#ep_crawl_form').valid() ){

      alert('yep, its valid');
    }else{
      alert('NOPE');
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

    /* AJAX POST USING ajaxForm + Validation */
    //$('#ep_crawl_form').ajaxForm({beforeSubmit: validate});

  });
  





  $('#ep_crawl_form').validate(
    {
      rules: {
	label: { minlength: 1, required: true },
	fw_root: { required: true, required: true },
	es_url: { minlength: 2, required: true, url: true },
	work_dir: { minlength: 2, required: true }
      },
      highlight: function(element) {
	$(element).closest('.control-group').removeClass('success').addClass('error');
      },
      success: function(element) {
	element
	  //.text('OK!').addClass('valid')
	  //.addClass('valid')
	  .closest('.control-group').removeClass('error').addClass('success');
      }
    }
  );
  


});
