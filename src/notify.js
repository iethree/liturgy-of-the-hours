//notify.js
require('dotenv').config();

const nedb = require('nedb');
const db = new nedb({filename: '../data/users.json', autoload: true});

const moment = require('moment');
const request = require('request');
const schedule = require('node-schedule');

const webpush = require('web-push');

//scheduled prayer reminders
var prayerSchedule = new schedule.RecurrenceRule();
        prayerSchedule.hour = [6,9,12,15,18,21];
        prayerSchedule.minute = 7;

var prayerReminder = schedule.scheduleJob(prayerSchedule, sendNotifications);

//setInterval(checkSend, 60*60*1000);
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setGCMAPIKey(process.env.GCMAPIKEY);

webpush.setVapidDetails(
  'mailto:root@infopanel.org',
  process.env.VAPIDPUBLIC,//public
  process.env.VAPIDPRIVATE //private
);

findNow = function(){
	var hour = moment().format('k');

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

function sendNotifications(){
	time = moment().format('H');

	db.find( {} , function(err, docs){
		console.log("sending "+docs.length+ " notifications");

		for(doc of docs){

			webpush.sendNotification(doc.subscription, 'Call to Prayer: '+findNow())
			.catch(()=>{ unsubscribe(doc); });
		}
	});
}


exports.updateSubscription = function(data, callback){
	data.subscription = JSON.parse(data.subscription);

	//console.log(data.subscription.keys.auth);

	if(data.type == 'sub')
		subscribe(data);
	else if(data.type=='snooze')
		snooze(data)
	else
		unsubscribe(data);

	callback('ok');
}

function subscribe(data){
	db.insert(data, function(err){
		console.log("subscribed "+data.subscription.keys.auth);
		webpush.sendNotification(data.subscription, 'Notifications Enabled')
		.catch(()=>{ console.log('error') });
	});
}

function unsubscribe(data){
	console.log( 'trying to unsub ' + data.subscription.keys.auth);

	db.remove({ "subscription.keys.auth": data.subscription.keys.auth } , {multi:true}, function(err, numRemoved){
		if(err)
			console.log("error ", err);

		console.log("removed "+numRemoved+" from notification db");
	});
}

function snooze(data){
	console.log('snooze');
}
