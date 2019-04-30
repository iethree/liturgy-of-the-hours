//full-editor.js

$('.taginput').on('keydown', function(e){
	
	if(e.which == 9 || e.which == 13 || e.which==188 || e.which == 186 || e.which==32){//tab
		//save tag
		e.preventDefault();
		var newtag = $(this).val();
		
		if (newtag.length>0){
			
			newtag = "<span class='tag is-warning'>"+newtag+"<button class='delete is-small'></button></span>";
			
			$(this).siblings('.tagbox').append(newtag);
			
			$(this).val('');
		}
	}		
});

$(document).on('click', '.delete', function(e){
	console.log('delete');
	$(this).parent().remove();
});

$(document).on('click', '.saver', function(e){
	
	//get the docID
	parent = $('.notification');
	
	dataID = $(parent).attr('dataid');
	
	//get the boxes of tags
	tagboxes = $(parent).find('.tagbox');
	alltags = $(parent).find('.tag');
	
	//separate out the 3 sets of tags
	var data={
		id: dataID,
		part: $(parent).find('.Part').val(),
		title: $(parent).find('.Title').val() || '',
		subtitle: $(parent).find('.Subtitle').val() || '',
		source: $(parent).find('.Source').val() || '',
		text: $(parent).find('.textarea').val() || '',
		themes: extractTagText($(tagboxes).filter('.themes').children('.tag')), 
		season: extractTagText($(tagboxes).filter('.season').children('.tag')), 
		times: extractTagText($(tagboxes).filter('.times').children('.tag'))
	};
	
	console.log(dataID+": "+JSON.stringify(data));
	
	$.ajax({
		url: '/db/updateAll',
		type: 'POST',
		data: data,
		success: function(results){
			$(alltags).removeClass('is-warning').addClass('is-success');
			$('.saver').removeClass('is-info').addClass('is-success');
		},
		error: function(){
			console.log("failed to save");
			$(alltags).removeClass('is-warning').addClass('is-danger');
			$('.saver').removeClass('is-info').addClass('is-danger');
		}
	});
});

$(document).on('click', '.deleter', function(e){
	
	//get the docID
	
	parent = $('.notification');
	dataID = $(parent).attr('dataid');

	$.ajax({
		url: '/db/delete',
		type: 'POST',
		data: {id: dataID},
		success: function(results){
			console.log("successfully deleted");
			$('.saver').removeClass('is-info').addClass('is-danger');
		},
		error: function(){ console.log("failed to delete"); }
	});

});

//extract tag text from an arrray of jquery tag objects
function  extractTagText(tagObjects){
	
	var taglist=[];
	
	for(cnt = 0; cnt<tagObjects.length; cnt++){
		
		taglist.push($(tagObjects[cnt]).text());
	}

	return taglist;
}

$(document).on('click', '.modal-background, .modal-content, .modal-close .dont-delete', function(e){
	
	$('.modal').toggleClass('is-active');
	
});

$(".format-help").click(function(e){
	
	var text = 
	`<strong> Formatting Guide </strong>
	<p> *italic text* , **bold text**
	<p> >indented line
	<p> >*indented italic line
	<p> >**indented bold line`;
	
	$('#explanation').html(text);

	$('.modal').toggleClass('is-active');
});

$(".trasher").click(function(e){
	
	var text = 
	`<p class="has-text centered"> are you sure you want to delete this? it cannot be undone. </p>
	<br>
	<div class="has-text-centered"><button class="button is-danger deleter"> Really Delete </button> <button class="button dont-delete">Don't Delete</button></div>`;
	
	$('#explanation').html(text);

	$('.modal').toggleClass('is-active');
});

							
							
							
							

