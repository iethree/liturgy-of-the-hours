const webPush = require('web-push');
const log = require('logchalk');
const schedule = require('node-schedule');

const nedb = require('nedb');
var sub_db = new nedb({filename: __dirname+'/../data/subscriptions.db', autoload: true});
var alarm_db = new nedb({filename: __dirname+'/../data/alarms.db', autoload: true});

module.exports = {subscribe, unsubscribe, setAlarms}

/**
 * check every minute for users to notify
 */
schedule.scheduleJob('*/1 * * * *', async()=>{
   let now = new Date();
   
   let notifications = await findUsersToNotify( now.getUTCHours(), now.getUTCMinutes() );
   if(notifications.length)
      for(let n of notifications){
         log.info(`Notifying: ${now.getHours()}:${now.getMinutes()} - ${n.title} - ${n.id}`);
         send(await getSubFromId(n.id).catch(log.warn), n.title);
      }
});

function subscribe({subscription, alarms, id}){
   if(!subscription || !subscription.endpoint)
      return false;
   
   log.info('sub', getBrowser(subscription.endpoint), id);

   sub_db.update({id}, {subscription, id}, {upsert: true}, (err, numReplaced)=>{
      if(err || !numReplaced) log.err(err || "no update made");
      else {
         send(subscription, "Successfully Subscribed!");
         setAlarms({id, alarms});
      }
   });
}

function getSubFromId(id){
   return new Promise((resolve, reject)=>{
      sub_db.findOne({id: id}, (err, result)=>{
         if(err || !result)
            reject('no subscription found for id', id);
         else
            resolve(result.subscription);
      });
   });
}

function unsubscribe(id){
   
   sub_db.remove({id}, {multi: true}, (err, numRemoved)=>{
      if(err) log.err(err);
      log.warn('removed sub', numRemoved, id)
   });
   alarm_db.remove({id}, {multi: true}, (err, numRemoved)=>{
      if(err) log.err(err);
      log.warn('removed alarms', numRemoved, id)
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

function setAlarms({alarms, id}){

   // filter down to enabled alarms
   let records = {saved: []};
   for (let i in alarms){
      let alarm = alarms[i];
      if(alarm.enabled){ //replace/upsert enabled alarms
         records.saved.push(i);
         alarm_db.update(
            {id: id, title: i}, 
            {$set: {id: id, title: i, hr: Number(alarm.hr), min: Number(alarm.min)} }, 
            {upsert: true}, 
            (err, numReplaced)=>{
            if(err) log.err(err);
         });
      }
      else{ //delete disabled alarms
         alarm_db.remove( {id: id, title: i}, (err, numRemoved)=>{
            if(err) log.err(err);
         });
      }
   }
   log.info('alarms for:', id, 'saved:', records.saved.join(','));

}

// find users to notify for a given hour and minute
// just loops through everything, not very efficient or scalable
function findUsersToNotify(h, m){
   return new Promise((resolve, reject)=>{
      alarm_db.find({hr: h, min: m}, (err, results)=>{
         if(err) reject(err);
         else    resolve(results);
      });
   });
}