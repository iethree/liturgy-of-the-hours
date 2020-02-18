//hour-client.js
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js');
}

hereNow();

['.modal-background', '.modal-close'].forEach((i)=>{
	document.querySelector(i).addEventListener('click', toggleModal);	
});

function toggleModal(){
	document.querySelector('.modal').classList.toggle('is-active');
}

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
	
	var id = getId();	
	
	//check in to this office and get number of 'active' users
	fetch('/count',{
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({'id': id, 'page': window.location.pathname}),
	})
	.then(r=>r.json())
	.then(r=>{
		console.log(r)
		createCircles(r);
	})
	.catch(console.log);
}

function getId(){
	let id;
	//check if a user ID has been assigned
	if (localStorage.id)
		id = localStorage.id;
	else{ //generate a new ID number
		id = new Date().getTime();
		localStorage.setItem('id', id);
	}
	return id;
}

function saveOffice(options){
	
	var todayOffices=[];
	
	if(options.first){ //first visit of the day
		localStorage.today = new Date(); //set date
	}
	else if(localStorage.offices){
		todayOffices = localStorage.offices.split(',');
	}
	
	let thisOffice = document.getElementById("heading").getAttribute('office');
	
	if(!todayOffices.includes(thisOffice)){
		todayOffices.push(thisOffice);
		localStorage.offices = todayOffices;
	} //if it isn't already stored, store it
}

function createCircles(counts){
	
	let pulsing = '<div class="ring-container"><div class="circle"></div><div class="ringring"></div></div>';
	let circle = '<div class="ring-container"><div class="circle"></div></div>';
	
	let circles = ''
	
	for(let cnt=0; cnt<counts.now; cnt++)
		circles+=pulsing;
	
	for(let cnt=0; cnt<counts.recent; cnt++)
		circles+=circle;
	
	document.querySelector('.circles').innerHTML = circles;
}

//modal handler 
['.modal-background', '.modal-close', '.circles' ].forEach((i)=>{
	document.querySelector(i).addEventListener('click', toggleModal);	
});

function toggleModal(){
	document.querySelector('.modal').classList.toggle('is-active');
}