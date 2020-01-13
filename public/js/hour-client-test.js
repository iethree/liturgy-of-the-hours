//hour-client.js
hereNow();
var id;
delete Hammer.defaults.cssProps.userSelect;

allparts = $('.officetext');

options = {
	recognizers:[
	[Hammer.Tap, {taps: 5}]
]};


$(allparts).hammer(options).bind('tap', function(event){
	//console.log("fire");
	window.location= "/edit/"+$(this).attr('dataid');
});

$(document).on('click', '.modal-background, .modal-content, .modal-close', function(e){
	
	$('.modal').toggleClass('is-active');
	
});

$('.circles').on('click', function(e){
	
	
	$('#explanation').html(	"<p>Pulsing circles represent those here now</p>"+
							"<p>Static circles represent those here recently</p>");
	$('.modal').toggleClass('is-active');
	
	
});


function hereNow(){
	
	//log individual office visit locally
	if (localStorage.today){
		
		if(dateFns.isToday(localStorage.today)) //if the saved day is today, it's  not the first of the day
			saveOffice({first: false});
		else
			saveOffice({first: true});
	}
	else
		saveOffice({first: true});
	
	//check if a user ID has been assigned
	if (localStorage.id)
		id = localStorage.id;
	else{ //generate a new ID number
		id = new Date;
		id = id.getTime();
		localStorage.id = id;
	}
	
	//check in to this office and get number of 'active' users
	
	$.ajax({
		url: '/count',
		type: 'POST',
		data: {'id': id, 'page': window.location.pathname},
		encode: true,
		error: function(){console.log("Error: Something went wrong");}
	})
	.done(function(results){
		
		createCircles(results);
	});
}

function saveOffice(options){
	
	var todayOffices=[];
	
	if(options.first){ //first visit of the day
		localStorage.today = new Date(); //set date
		//cache today's readings
		// if('serviceWorker' in navigator)
			// navigator.serviceWorker.controller.postMessage('cacheToday');
	}
	else if(localStorage.offices){
		todayOffices = localStorage.offices.split(',');
	}
	
	thisOffice = window.location.pathname.replace(/[\/]/g,'').replace(/hour/,'');
	
	if(todayOffices.indexOf(thisOffice)==-1){
		todayOffices.push(thisOffice);
		localStorage.offices = todayOffices;
	} //if it isn't already stored, store it
}

function createCircles(counts){
	
	var pulsing = '<div class="ring-container"><div class="circle"></div><div class="ringring"></div></div>';
	var circle = '<div class="ring-container"><div class="circle"></div></div>';
	
	$('.circles').empty();
	
	for(var cnt=0; cnt<counts.now; cnt++){
		$('.circles').append(pulsing);
	}
	for(cnt=0; cnt<counts.recent; cnt++){
		$('.circles').append(circle);
	}
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
	navigator.serviceWorker.register('/service-worker-test.js', {updateViaCache: 'none'}).then(function(registration) {
	  // Registration was successful
	  console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}, function(err) {
	  // registration failed :(
	  console.log('ServiceWorker registration failed: ', err);
	});
  });
}