const webPush = require('web-push');
const log = require('logchalk');

const nedb = require('nedb');
var db = new nedb({filename: __dirname+'/../data/subscriptions.db', autoload: true});

module.exports = {subscribe, unsubscribe, setAlarms}

function subscribe(sub){
   if(!sub.subscription || !sub.subscription.endpoint)
      return false;
   
   log.info('sub', getBrowser(sub.subscription.endpoint), sub.id);
   db.insert(sub, (err)=>{
      if(err) log.err(err);
      else send(sub.subscription, "Successfully Subscribed!")
   });
}

function unsubscribe(sub){
   if(!sub.endpoint)
      return false;
   
   db.remove({"subscription.endpoint": sub.endpoint}, {}, (err, numRemoved)=>{
      if(err) log.err(err);
      log.warn('removed', numRemoved)
      log.info('unsub', getBrowser(sub.endpoint), sub.endpoint.slice(-6));
   });
}

function send(sub, msg){
   const options = {
      TTL: 60,
      vapidDetails: {
       subject: 'mailto: root@infopanel.org',
       publicKey: process.env.VAPIDPUBLIC,
       privateKey: process.env.VAPIDPRIVATE
     }
    };
    
    webPush.sendNotification(
      sub,
      msg,
      options
    ).catch(log.warn);
}

function getBrowser(str){
	if(str.contains('mozilla'))
		return 'Firefox'
	if(str.contains('googleapis'))
      return 'Chrome';
   else 
      return 'Unknown Browser';
}

function setAlarms(settings){
   db.update({id: settings.id}, { $set: {alarms: settings.alarms} }, (err, numReplaced)=>{
      if(err) log.err(err);
      else log.info('replaced', numReplaced, 'for', settings.id);
   });
}