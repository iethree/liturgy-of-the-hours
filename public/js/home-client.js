var swRegistration;
const VAPIDPUBLIC='BL-jTe04esa9qJhMDuCCoh6sw8KwicUEGzd0QrrIYJQa_qW-HWLK5_9CPoIm2E8FTXcdNCybnNAAfr-MVx_IAVE'
; //public VAPID key

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js').then(r=>swRegistration=r);
}

//cache logic
const DAYS = 14; // days of offices to keep cached
const OFFICES = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins", "Morning", "Noon", "Evening"];

caches.open('hour-cache').then((cache) =>{
	cache.keys().then( k=> {
		showCacheStatus(k.length/OFFICES.length/DAYS*100);
		let deleteKeys = getOldKeys(k);

		//figure out if the cache is too small and we need extra days
		let additionalDays = DAYS - (k.length / OFFICES.length);

		if(deleteKeys.length+additionalDays===0) //if nothing needs to be cleared/cached, exit
			return;
		
		showCacheStatus( (k.length-deleteKeys.length)/OFFICES.length/DAYS*100);

		let newKeys = generateNewKeys(deleteKeys.length/OFFICES.length + additionalDays); 

		console.log(`Deleting ${deleteKeys.length/OFFICES.length} days of offices `)
		console.log(`Adding ${newKeys.length/OFFICES.length} days of offices `)
		
		for (d of deleteKeys) //delete the old keys
			cache.delete(d);
		
		cache.addAll(newKeys).then(()=>{ //add the new ones
			showCacheStatus( 100 ) ;
		}); 
	});
});

function showCacheStatus(percent){
	percent = Math.round(percent)
	let loaded = Math.round(percent/100*DAYS)
	document.getElementById('cache-status').innerHTML=`
		<progress class="progress" value=${percent} max="100" 
			title="${loaded} of ${DAYS} days downloaded">
		</progress>`;
}

/**
 * returns array of request objects from prior days
 * @param {Object} keys array of Request objects
 */
function getOldKeys(keys){
	var oldKeys = [];
	var today = String(dateFns.format(new Date(), 'YYYYMMDD'));
	
	for (let k of keys){
		let date =  /\d{8}/.exec(k.url);
		if (!today)// if there's no regex match
			continue;
		date = date[0]; //just get the date
		if(date<today)
			oldKeys.push(k);
	}
	return oldKeys;
}

/**
 * generate the number of days of offices in the future that we need to delete in the past
 * @param {Object} keys array of request objects
 * @param {number} num integer number of days to generate
 */
function generateNewKeys(num){
	let newKeys = [];
	let startDate = dateFns.addDays(new Date(), DAYS - num);

	for (let d=0; d<num; d++){ //for each day
		let date = dateFns.format(dateFns.addDays(startDate, d), 'YYYYMMDD');
		
		for (let o of OFFICES)// for each office
			newKeys.push(`/hour/${o}/${date}/`);
	}
	return newKeys;
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

//read version from localStorage
function loadVersion(){
	if(localStorage.version)
		return localStorage.version;
	else{
		localStorage.setItem('version','full');
		return "full";
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
	console.log('configuring');

	if ('Notification' in window) {
		Notification.requestPermission(status => {
			if (status === 'granted')
				showNotificationSettings();
			else
				showBlockedNotice();
		 });
	 }
	else
		setModal("Sorry, your browser does not support notifications");
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
	
	swRegistration.pushManager.getSubscription()
	.then(subscription => {
		isSubscribed = (subscription !== null);
		//updateSubscriptionOnServer(subscription);
		let subButton;
		if (isSubscribed)
			subButton=`<button class="button" onclick="unsubscribe()"> Unsubscribe </button>`;
		else
			subButton=`<button class="button" onclick="subscribe()"> Sign me up! </button>`;
		setModal(
			`<div>
			<h3>Notification Settings</h3>
			${subButton}
			<button class="button" onclick="testNotification()"> Test Notification </button>
			
			</div>
			`
		);
	});		
}
			
function subscribe(){
	swRegistration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlB64ToUint8Array(VAPIDPUBLIC)
		})
		.then(subscription => {
		console.log('User is subscribed:', subscription);
		updateSubscriptionOnServer(subscription);
		isSubscribed = true;
		//updateBtn();
		})
		.catch(err => {
		if (Notification.permission === 'denied') {
			console.warn('Permission for notifications was denied');
		} else {
			console.error('Failed to subscribe the user: ', err);
		}
		//updateBtn();
		});
}

function unsubscribe(){
	swRegistration.pushManager.getSubscription()
	.then(subscription => {
	if (subscription) {
		return subscription.unsubscribe();
	}
	})
	.catch(err => {
		console.log('Error unsubscribing', err);
	})
	.then(() => {
		updateSubscriptionOnServer({payload: null} );
		console.log('User is unsubscribed');
		isSubscribed = false;
		//updateBtn();
	});
}

function testNotification(){
	if (Notification.permission == 'granted') {
		navigator.serviceWorker.getRegistration().then(reg => {
		  reg.showNotification('Test Notification Received!');
		});
	 }
}

function updateSubscriptionOnServer(sub){
	fetch('/subscribe', {
		method: "POST",
		headers:{ "Content-Type": 'application/json'},
		body: JSON.stringify(sub)
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