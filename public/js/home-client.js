var swRegistration, alarms; //globals

const VAPIDPUBLIC='BDGjlxI-5G_q0k910Oez3eCAKlk9CV0t3yY1y4ypeh041Rv4Wgi-EwSpsVvUc4b4m7-dv6tfj6ClyGNTSAxQ3xQ';
const DEFAULT_ALARMS = {
	Morning: 	{hr: "07", min: "00", enabled: false}, 
	Noon: 		{hr: "12", min: "00", enabled: false}, 
	Evening: 	{hr: "18", min: "00", enabled: false},
	Lauds: 		{hr: "07", min: "00", enabled: false},
	Terce: 		{hr: "10", min: "00", enabled: false},
	Sext: 		{hr: "12", min: "00", enabled: false},
	None: 		{hr: "15", min: "00", enabled: false},
	Vespers: 	{hr: "18", min: "00", enabled: false},
	Compline: 	{hr: "21", min: "00", enabled: false},
	Matins: 		{hr: "22", min: "00", enabled: false},
};

const TZ_OFFSET_HOURS = new Date().getTimezoneOffset()/60;

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js').then(r=>swRegistration=r);
}

//load id into localstorage if this is a first visit
getId();
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


makeButtons();

//get current season/color from server and cache locally
function getColor(){
	fetch('/season')
	.then(r=>r.text())
	.then(s=>{
		drawColor(s);
		localStorage.setItem('season', s);
	});
}

//apply color to colorable elements
function drawColor(season){
	season = season.toLowerCase();
	document.querySelector('h1').classList.add(season); //title
	document.querySelector('.active').classList.add(season); //active button
	document.getElementById('cache-status').classList.add(season); //progress bar
	document.getElementById('about').classList.add(season); //about button
	document.getElementById('notify').classList.add(season); //about button
	document.getElementById('version').classList.add(season); //toggle button
}

//check views today
function loadVisitedToday(){	
	if (localStorage.today 
		&& localStorage.offices
		&& dateFns.isToday(localStorage.today))//if viewed data is there for today
			return localStorage.offices.split(',');
	else
		return [];
}

//read version from localStorage, default to lite
function loadVersion(){
	if(localStorage.version)
		return localStorage.version;
	else{
		localStorage.setItem('version','lite');
		return "lite";
	}
}

//check if there's a query string to change version, always return current version
function checkVersion(){
	let queryString = window.location.search;
	let urlParams = new URLSearchParams(queryString);
	let v = urlParams.get('v');
	if(v) {
		setVersion(v);
		window.history.pushState("object or string", "Liturgy of the Hours", "/");
	}
	return loadVersion();
}

//set version to lite or full, default to lite
function setVersion(v){
	v = v.toLowerCase();
	let set = v==='full' ? 'full' : 'lite';
	localStorage.setItem('version', set);
	return set;
}

//toggle version and redraw buttons
function toggleVersion(){
	if(checkVersion()==='lite')
		setVersion('full');
	else
		setVersion('lite');

	makeButtons();
}

//make buttons
function makeButtons(){
	var date = new Date;
	document.getElementById("date").innerHTML = dateFns.format(date, 'MMMM D');
	var today = dateFns.format(date, 'YYYYMMDD');
	
	var offices = {
		full: ['Lauds', 'Terce', 'Sext', 'None', 'Vespers', 'Compline', 'Matins', 'Lectionary'],
		lite: ['Morning', 'Noon', 'Evening']
	};
	var version = checkVersion();

	var visited = loadVisitedToday();
	var buttons = '';	

	for(let o of offices[version])
		buttons+=makeButton(o, today, visited.includes(o));
	
	//add random button at the end
	buttons += `<a id='random' href = '/hour/random/' class='button'><i class='fas fa-random'></i> </a> <br>`;

	document.getElementById('version').innerHTML = version==='lite'?'full':'lite';

	document.getElementById("buttonList").innerHTML = buttons;
	highlight(version);
	if(localStorage.season) //check season cache
		drawColor(localStorage.season)
	getColor();
}

function makeButton(title, date, checked){
	let check = checked ? '<i class="fas fa-check done-check"></i>' : '';
	return `<a id='${title}' href = '/hour/${title}/${date}/' class='button is-block'>${title} ${check}</a><br>`
}

//highlight button with correct time
function highlight(version){
	var time = findNow(version);
	document.getElementById(time).classList.add('active');
}

function findNow(version){
	var hour = dateFns.format(new Date, 'H');
	if(version==='lite'){
		if(hour >= 3 && hour < 11)
			return "Morning";
		if(hour < 16)
			return "Noon";
		else
			return "Evening";
	}

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

//modal handler 
['.modal-background', '.modal-close'].forEach((i)=>{
	document.querySelector(i).addEventListener('click', toggleModal);	
});

function showExplanation(){

	let explanation = `<div class="content">
		<h3>About</h3>
		<p>The Book of Common Prayer is <em>common</em> in two senses. First, in that it is aimed at the common man - it is not a book just for religious professionals - or even the very pious.  Second, it is common in that it is meant to be used by people together - we are meant to have our prayers in common. </p><p> For more than a few reasons, the daily offices in the book of common prayer are less common than they once were. It is less feasible for each of us to make our way to the village church a few times a day to pray together. We have also been shaped by a world of technology and bite-size information that carves our time into many small chunks, rather than few large ones. We can bemoan this change, and perhaps we should fight it, but the fact remains that God meets us where we are, even if we are attention-deficit. <p> Drawing on the ancient monastic tradition of attending many prayer services throughout the day, this liturgy of the hours is divided into seven short (3-5 minute) prayer services.
	</div>`;
	document.getElementById('modal-content').innerHTML=explanation;
	toggleModal();
}

function clicker(){console.log('click')}

function configure_notifications(){
	if ('Notification' in window) {
		Notification.requestPermission(status => {
			if (status === 'granted')
				showNotificationSettings();
			else
				showBlockedNotice();
		 });
	 }
	else
		setModal("Sorry, your browser does not support web push notifications, you're probably using an Apple device. ☹️");
}


function showNotificationEnable(){	
	setModal(
		`<div class="has-text-centered">
		<button class="button" onClick="enableNotifications()">Enable Notifications</button>
		</div>`
	);
}
	
function showBlockedNotice(){
	setModal(
		`<div class="has-text-left">
		<i class="fas fa-exclamation-triangle"></i> &nbsp;
		You have blocked notifications from this site. Please <a href="https://www.google.com/search?q=how+to+enable+browser+notifications"> enable them in your browser's settings </a> to use this feature.
		</div>`
		);
}
		
function showNotificationSettings(){
	if (localStorage.alarms)
		alarms = JSON.parse(localStorage.alarms);
	else
		alarms = DEFAULT_ALARMS;
	
	swRegistration.pushManager.getSubscription()
	.then(subscription => {
		let subButton;
		if (subscription == null)
			setModal(`<div class="has-text-centered"><button class="button is-primary" onclick="subscribe()"> Subscribe to Notifications </button></div>`)
		else
			setModal(
				`<div>
					<h3>Notification Settings</h3>
					${showAlarmSettings()}

					<div class="buttons is-right"> 
						<button id="save" class="button ${localStorage.season}" onclick="saveAlarms()">Save</button>
						<button class="button" onclick="unsubscribe()"> Unsubscribe </button>
					</div>
				</div>
				`
			);
	});		
}
			
function subscribe(){
	console.log('subbing')

	swRegistration.pushManager.subscribe({
		applicationServerKey: urlB64ToUint8Array(VAPIDPUBLIC),
		userVisibleOnly: true
	})
	.then(subscription => {
		console.log('User is subscribed:', subscription);
		serverSubscribe(subscription);
		showNotificationSettings();
	})
	.catch(err => {
		if (Notification.permission === 'denied') {
			console.warn('Permission for notifications was denied');
		} else {
			console.error('Failed to subscribe the user: ', err);
		}
	});
}

function unsubscribe(){
	swRegistration.pushManager.getSubscription()
	.then(subscription => {
		if (subscription) {
			serverUnsubscribe(localStorage.id);
			return subscription.unsubscribe();
		}
	})
	.catch(err => {
		console.log('Error unsubscribing', err);
	})
	.then(() => {
		console.log('User is unsubscribed');
		showNotificationSettings();
	});
}

function testNotification(){
	if (Notification.permission == 'granted') {
		navigator.serviceWorker.getRegistration().then(reg => {
		  reg.showNotification('Test Notification Received!');
		});
	 }
}

function serverSubscribe(sub){

	fetch('/subscribe', {
		method: "POST",
		headers:{ "Content-Type": 'application/json'},
		body: JSON.stringify({
			id: localStorage.id,
			alarms: UTC(alarms),
			subscription: sub
		})
	});
}

function serverUnsubscribe(id){
	fetch('/unsubscribe', {
		method: "POST",
		headers:{ "Content-Type": 'text/plain'},
		body: id
	})
}

function toggleModal(){
	document.querySelector('.modal').classList.toggle('is-active');
}

function showModal(){
	if(!document.querySelector('.modal').classList.contains('is-active'))
		toggleModal();
}

function setModal(content){
	document.getElementById('modal-content').innerHTML=content;
	showModal();
}

function urlB64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
	  .replace(/\-/g, '+')
	  .replace(/_/g, '/');
 
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
 
	for (let i = 0; i < rawData.length; ++i) {
	  outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
 }

 //sets an alarm in UTC given a local time
function showAlarmSettings(){
	let offices = localStorage.version==='full' ? FULL_OFFICES : LITE_OFFICES;
	
	let sliders = '';
	offices.forEach(o=>{
		sliders+=alarmChooser(o, alarms[o]);
	});
	return sliders;
}

function alarmChooser(label, val){
	
	//only show input if val is enabled

	return `
		<div class="alarm-input" id="alarm-input-${label}">
			<label class="checkbox alarm-label">
				<input type="checkbox" name="check_${label}" onclick="checkboxclick(event)" ${val.enabled ? "checked" : ""}>
				${label}
			</label>
			<input class="input is-small ${!val.enabled ? "hidden" : ""}" type="time" name="alarm_${label}" id="alarm_${label}"
			value="${val.hr}:${val.min}" step="900" 
			pattern="[0-1]{1}[0-9]{1}:(00|15|30|45){1}"
			title="please enter a time in quarter-hour increments (7:00, 7:15, 7:30, 7:45, etc.)"
			onchange="alarmchange(event)"> </input>
		</div>
	`;
}

function alarmchange(e){
	let office = e.target.name.replace('alarm_','');
	let [h,m] = e.target.value.split(':');
	alarms[office].hr = h;
	alarms[office].min = m;

	console.log(alarms[office]);
}

function checkboxclick(e){
	let office = e.target.name.replace('check_','');
	alarms[office].enabled = !alarms[office].enabled; //toggle value
	console.log(alarms[office]);
	//redraw
	document.getElementById('alarm-input-'+office).outerHTML = alarmChooser(office, alarms[office]);
}

//save to localStorage and server
function saveAlarms(){
	localStorage.setItem('alarms', JSON.stringify(alarms));
	document.getElementById('save').classList.add('is-loading')

	fetch('/alarms', {
		method: "POST",
		headers:{ "Content-Type": 'application/json'},
		body: JSON.stringify({id: localStorage.id, alarms: UTC(alarms)})
	})
	.then(()=>{
		let saveButton = document.getElementById('save')
		saveButton.classList.remove('is-loading');
		saveButton.innerHTML="Saved!";

		setTimeout(()=>{
			toggleModal();
			saveButton.innerHTML = "Save";
		}, 500);
	});
}

//change alarms to UTC before sending to server
function UTC(alarms){
	for(let t in alarms){
		let newhr = Number(alarms[t].hr)+TZ_OFFSET_HOURS;
		if(newhr>23) newhr-=24;
		alarms[t].hr=newhr;
	}
		
	return alarms;
}