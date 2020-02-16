const webPush = require('web-push');
const log = require('logchalk');
const schedule = require('node-schedule')

const nedb = require('nedb');
var db = new nedb({filename: __dirname+'/../data/subscriptions.db', autoload: true});

module.exports = {subscribe, unsubscribe, setAlarms}

schedule.scheduleJob('*/1 * * * *', async ()=>{
   let now = new Date();
   log.info('checking for alarms:', now.getHours()+":"+now.getMinutes());
   
   let notifications = await findUsersToNotify( now.getUTCHours(), now.getUTCMinutes() );
   if(notifications.length)
      for(let n of notifications){
         send(n.subscription, n.alarm);
      }
});

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
   log.info('sending notification:',msg)
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

// find users to notify for a given hour and minute
// just loops through everything, not very efficient or scalable
function findUsersToNotify(h, m){
   return new Promise((resolve, reject)=>{
      let usersToNotify = [];
      db.find({alarms: {$exists: true}}, (err, results)=>{
         if(err) reject(err);
         else{
            for (let s of results){ //for each subscription
               for (let a in s.alarms){ //for each alarm
                  if(s.alarms[a].enabled && s.alarms[a].hr==h && s.alarms[a].min==m){
                     log.info('found alarm for', a, s.id)
                     usersToNotify.push({ subscription: s.subscription, alarm: a });
                  }
               }
            }
            resolve(usersToNotify);
         }
      })
   });
}