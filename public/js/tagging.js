//tagging.js


$('.input').on('keydown', function(e){
	
	
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
	dataID = $(this).parent().parent().attr('dataid');
	
	//get the boxes of tags
	tagboxes = $(this).parent().parent().find('.tagbox');
	alltags = $(this).parent().parent().find('.tag');
	
	//separate out the 3 sets of tags
	var taglist={
		themes: extractTagText($(tagboxes).filter('.themes').children('.tag')), 
		season: extractTagText($(tagboxes).filter('.season').children('.tag')), 
		times: extractTagText($(tagboxes).filter('.times').children('.tag'))
	};
	
	
	console.log(dataID+": "+JSON.stringify(taglist));
	
	$.ajax({
		url: '/db/saveTags',
		type: 'POST',
		data: {id: dataID, themes: taglist.themes, season: taglist.season, times: taglist.times}
		success: function(results){
			$(alltags).removeClass('is-warning').addClass('is-success');
		},
		error: function(){
			console.log("failed to save tags");
			$(alltags).removeClass('is-warning').addClass('is-danger');
		}
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

// }