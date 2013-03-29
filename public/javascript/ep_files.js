jQuery(function($){


  
  $('#ep_crawl_form').submit(function(e){

    $('#ep_files_accord a.accordion-toggle').click();

    $('#ep_list').empty();

    var $this = $(this);
    $.post(
      $this.attr('action'),
      $this.serialize(),
      function(data){},
      'json'
    );

    e.preventDefault();

    /*
    var form = e.currentTarget;
    $.ajax({
      url: form.action,
      type: 'POST',
      data: $(form).serialize(),
      success: function(){
        console.log("::::::::::::::::::::::::::::");
	console.log('success!!!!!');
      },
      error: function(){
      }

    });

    e.preventDefault();
    */

  });
  



});
