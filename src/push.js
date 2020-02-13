const webPush = require('web-push');
const log = require('logchalk');

const nedb = require('nedb');
var db = new nedb({filename: __dirname+'/../data/subscriptions.db', autoload: true});

module.exports = {subscribe, unsubscribe}

function subscribe(sub){
   if(!sub.subscription.endpoint)
      return false;
   log.info('sub', getBrowser(sub.subscription.endpoint), sub.settings.id);
   db.insert(sub, (err)=>{
      if(err) log.err(err);
      else send(sub.subscription, "Successfully Subscribed!")
   });
}

function unsubscribe(sub){
   if(!sub.endpoint)
      return false;
   
   db.remove({endpoint: sub.endpoint}, (err)=>{
      if(err) log.err(err);
      log.info('unsub', getBrowser(sub.endpoint));
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