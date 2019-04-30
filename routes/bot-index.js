var express = require('express');
var router = express.Router();

var moment = require('moment');
var crypto = require('crypto');
/* GET home page. */

var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

//twitter bot callback url
//https://bot.infopanel.org/ZBxfn3y1ugCpqR0m
router.post('/ZBxfn3y1ugCpqR0m', function(req, res, next) {
   
	//if(req.body.direct_message_events[0].message_create)
		//console.log("dm: "+req.body.direct_message_events.message_data.text);
	
	if(req.body.direct_message_indicate_typing_events)
		console.log("typing...");
	if(req.body.direct_message_events){
		var msg = {
			id: req.body.direct_message_events[0].id,
			text: req.body.direct_message_events[0].message_create.message_data.text,
			from_id: req.body.direct_message_events[0].message_create.sender_id,
			from_name: req.body.users[req.body.direct_message_events[0].message_create.sender_id].name,
			from_screen_name:req.body.users[req.body.direct_message_events[0].message_create.sender_id].screen_name
		};		
		console.log("dm: "+JSON.stringify(msg, ' '));
	}
	  
	  res.sendStatus(200); 
	  
  
});

//periodic twitter bot authentication
router.get('/ZBxfn3y1ugCpqR0m', function(req, res, next) {
	console.log("CRC authentication for twitter bot");
	//console.log("crc token:"+req.query.crc_token);
	
	var hmac = crypto.createHmac('sha256', process.env.CONSUMER_SECRET).update(req.query.crc_token).digest('base64');
	
	response = {response_token: "sha256="+hmac};

	res.status(200).send(response);

});

function sendMessage(user, message){
	 var msg = {
		event:{
			type: "message_create",
			message_create: {
				target: {recipient_id : user},
				message_data: {text: message}
			}
		}
	 };
	  
	client.post('direct_messages/events/new', msg,  function(error, response){
	  if(error){
		console.log(error);
	  }

	  console.log(response.body);
	});
}

function registerWebhook(){
	
	client.post('account_activity/all/ctpbot/webhooks',  {url: encodeURI("https://bot.infopanel.org/ZBxfn3y1ugCpqR0m")}, function(error, tweet, response){
	  if(error){
		console.log(error);
	  }
	  console.log(response.body);
	});
}
function subscribeWebhook(){
	
	client.post('account_activity/all/ctpbot/subscriptions',  function(error, tweet, response){
	  if(error){
		console.log(error);
	  }
	  console.log(response.body);
	});
}

function checkWebhook(){
	//{id: '997906086278680576'},
	client.get('account_activity/all/ctpbot/webhooks',   function(error, tweet, response){
	  if(error){
		console.log(error);
	  }
	  console.log(response.body);
	});
}
//checkWebhook();
//registerWebhook();
//subscribeWebhook();


module.exports = router;
