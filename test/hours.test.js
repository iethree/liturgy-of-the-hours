const hours = require('../src/hours.js');
const log = require('logchalk');
const time = require('../src/time.js');

async function testHour(hour, date){
   return 
   log.info(result);
}

testHours('20200108', 7)

async function testHours(date, num){
   var failures = 0;
   const hrs = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins"];

   for (let i=0; i<num; i++){
      for(let h of hrs){
         let result = await hours.getHour(h, date).catch(log.err);
         if(!result) failures++;
         else if(!checkHour(result, date)) failures++;
      }
      
      date = time.subDay(date);
   }
   if(failures)
      log.err('failures: '+failures);
   else
      log.success('no failures :-)');
}


function checkHour(hour, date){
   if( !(hour.hour &&
         hour.title &&
         hour.season &&
         hour.date &&
         hour.parts)){

      log.err('something missing on '+date+" "+hour.hour)
      return false;
   }
            
   
   for(let i of hour.parts) //check that each part has text
      if(!i.text){
         log.err(`No text for ${hour.hour}:${hour.title} on ${hour.date}`)
         return false;
      }

   return true;

}
