//bible-client.js

var recent=[];

var recentlimit = 8;

handleRecent();

function handleRecent(){
	
	console.log("recent");
	
	//load recent searches
	if (localStorage.recent)
		recent = JSON.parse(localStorage.recent);
	
	//if there is valid text displayed, save it
	if($(".extra_text").length)
	{
		var querytext='';
		
		$(".extra_text").filter("h2").each(function(){
			
			 //check for duplicates
				querytext+=$(this).text()+", ";
			
		});
		querytext=querytext.slice(0,-2);
		
		if (recent.indexOf(querytext)<0) //save it if it's new
			recent.unshift(querytext);
		
		if(recent.length>recentlimit)
			recent.pop();
		
		localStorage.setItem("recent",JSON.stringify(recent));
	}
	
	//if there is saved data, and it's a blank page, show recent texts
	if(recent.length && $("#recent")){
		output = '';
		
		for (cnt=0;cnt<recent.length; cnt++){
			output+="<p class='control'><a class='button' href='/bible/"+recent[cnt]+"'>"+recent[cnt]+"</a></p>";
		}

		$("#recent").html(output);
	}
}

$("#search").on( "click", function() { 
	search();
	
});
$('#get').on('keyup', function(e){
		
		if (e.keyCode == 13) { //if user hits enter, search
			search();
		}
});

function search(){
	$("#loader").addClass("loader");
	
	query = $("#get").val();
	window.location.replace("/bible/"+query);
}

