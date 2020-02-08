const webPush = require('web-push');
const log = require('logchalk');

const payload = 'Call to Prayer';
const nedb = require('nedb');
var db = new nedb({filename: __dirname+'/../data/subscriptions.db', autoload: true});

module.exports = {subscribe}

function subscribe(sub){
   log.debug(sub);
   db.insert(sub, (err)=>{
      if(err) log.err(err);
      else send(sub, "Successfully Subscribed!")
   });
}

db.findOne({}, (err, sub)=> send(sub, "test message") );

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

