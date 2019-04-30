//twitter bot
require('dotenv').config();
var request = require('request');
var moment = require('moment');
var schedule = require('node-schedule');
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

//scheduled prayer reminders
var prayerSchedule = new schedule.RecurrenceRule();
        prayerSchedule.hour = [6,10,12,15,18,21];
        prayerSchedule.minute = 7;

var prayerReminder = schedule.scheduleJob(prayerSchedule, callToPrayer);

function callToPrayer(){
	
	var hour = moment().format('k');
	var time = "";

	if(hour >= 4 && hour < 8)
			time = "Lauds";
	if(hour >= 8 && hour < 11)
			time = "Terce";
	if(hour >= 11 && hour < 14)
			time = "Sext";
	if(hour >= 14 && hour < 16)
			time = "None";
	if(hour >= 16 && hour < 20)
			time = "Vespers";
	if(hour >= 20 && hour < 24)
			time = "Compline";

	var message = "Call to Prayer: "+time+"\n https://prayer.infopanel.org/hour/"+time;

	tweetPublic(message);
}

function tweetPublic(message){
	
	client.post('statuses/update', {status: message },  function(error, tweet, response){
	  if(error){
		console.log(error);
	  }
	  console.log("Tweet: "+tweet.text);
	});
}