
//check views today

function loadVisitedToday(){
	
	if (localStorage.today && localStorage.offices){ //if viewed data is there
		if(dateFns.isToday(localStorage.today)){ //if data is for today
			
			todayOffices = localStorage.offices.split(',');
			
			for(cnt=0;cnt<todayOffices.length;cnt++){
				
				var check = '<i class="fa fa-check done-check"></i>';
				
				$("a:contains("+todayOffices[cnt]+")").append(check);
			}
		} 
	}
}

//modal handler 
$(document).on('click', '.modal-background, .modal-content, .modal-close', function(e){
	$('.modal').toggleClass('is-active');	
});

//make buttons
function makeButtons(){
	var date = new Date;
	$("#date").html(dateFns.format(date, 'MMMM D'));
	var today = dateFns.format(date, 'YYYYMMDD');
	
	$("#buttonList").append(makeButton('Lauds', today));
	$("#buttonList").append(makeButton('Terce', today));
	$("#buttonList").append(makeButton('Sext', today));
	$("#buttonList").append(makeButton('None', today));
	$("#buttonList").append(makeButton('Vespers', today));
	$("#buttonList").append(makeButton('Compline', today));
	$("#buttonList").append(makeButton('Matins', today));
	$("#buttonList").append(makeButton('Lectionary', today));
	
	loadVisitedToday();
}
makeButtons();
highlight();
function makeButton(title, date){
	
	return "<a id='"+title+"' href = '/hour/"+title+"/"+date+"' class='button is-block'>"+title+"</a><br>"
	
}
//highlight button with correct time
function highlight(){
	var season = $("#buttonList").attr('season');
	var time = findNow();
	
	$("#"+time).addClass(season);
}

function findNow(){
	var hour = dateFns.format(new Date, 'H');
	console.log("hour", hour);

	if(hour >= 4 && hour < 8)
		return "Lauds";
	if(hour >= 8 && hour < 11)
		return "Terce";
	if(hour >= 11 && hour < 14)
		return "Sext";
	if(hour >= 14 && hour < 16)
		return "None";
	if(hour >= 16 && hour < 20)
		return "Vespers";
	if(hour >= 20 && hour < 24)
		return "Compline";
	else
		return "Matins";
}

$("#about").click(function(e){
	
	var text = "<div class='content'><h3>About</h3><p>The Book of Common Prayer is <em>common</em> in two senses. First, in that it is aimed at the common man - it is not a book just for religious professionals - or even the very pious.  Second, it is common in that it is meant to be used by people together - we are meant to have our prayers in common. </p><p> For more than a few reasons, the daily offices in the book of common prayer are less common than they once were. It is less feasible for each of us to make our way to the village church a few times a day to pray together. We have also been shaped by a world of technology and bite-size information that carves our time into many small chunks, rather than few large ones. We can bemoan this change, and perhaps we should fight it, but the fact remains that God meets us where we are, even if we are attention-deficit. <p> Drawing on the ancient monastic tradition of attending many prayer services throughout the day, this liturgy of the hours is divided into seven short (3-5 minute) prayer services, organized roughly around seven themes.</p> <ol> <li> Praise </li> <li> Petition </li> <li> Wisdom </li> <li> Hope </li> <li> Thanksgiving</li> <li> Penitence </li> <li> Rest </li> </ol> </div>";
	
	$('#explanation').html(text);

	$('.modal').toggleClass('is-active');
});
