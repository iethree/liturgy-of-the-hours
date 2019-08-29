//cg-client.js
hereNow();
var id;

function hereNow(){
	
	//log individual office visit locally
	if (localStorage.today && dateFns.isToday(localStorage.today)) //if the saved day is today, it's not the first of the day
		saveOffice(false);
	else
		saveOffice(true);
	
	//check if a user ID has been assigned
	if (localStorage.id)
		id = localStorage.id;
	else{ //generate a new ID number
		id = new Date().getTime();
		localStorage.id = id;
	}
	
	//check in to this office and get number of 'active' users
	
	fetch('/count',{
		method: 'POST',
		headers: {"Content-Type": "application/json" },
		body: JSON.stringify({id: id, page: window.location.pathname})
	})
	.then(r=>r.json())
	.then(r=>createCircles(r));
}

function saveOffice(first){
	
	var todayOffices=[];
	
	if(first){ //first visit of the day
		localStorage.today = new Date(); //set date
	}
	else if(localStorage.offices){
		todayOffices = localStorage.offices.split(',');
	}
	
	thisOffice = document.querySelector("#heading").getAttribute('office');
	
	//if it isn't already stored, store it
	if(todayOffices.indexOf(thisOffice)===-1){
		todayOffices.push(thisOffice);
		localStorage.offices = todayOffices;
	} 
}

function createCircles(counts){
	
	var pulsing = '<div class="ring-container"><div class="circle"></div><div class="ringring"></div></div>';
	var circle = '<div class="ring-container"><div class="circle"></div></div>';
	var divs = '';
	
	for(var cnt=0; cnt<counts.now; cnt++)
		divs+=pulsing;
	for(cnt=0; cnt<counts.recent; cnt++)
		divs+=circle;
	
	document.querySelector('.circles').innerHTML=divs;
}

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', function() {
// 	navigator.serviceWorker.register('/service-worker.js', {updateViaCache: 'none'}).then(function(registration) {
// 	  // Registration was successful
// 	  console.log('ServiceWorker registration successful with scope: ', registration.scope);
// 	}, function(err) {
// 	  // registration failed :(
// 	  console.log('ServiceWorker registration failed: ', err);
// 	});
//   });
// }
