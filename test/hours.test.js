require('dotenv').config();
const hours = require('../src/hours.js');
const log = require('logchalk');
const time = require('../src/time.js');
const fs = require('fs');

async function testHour(hour, date){
   return 
   log.info(result);
}

testHours('20200115', 7)

async function testHours(date, num){
   var failures = 0;
   const hrs = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins"];
   output = [];

   for (let i=0; i<num; i++){
      for(let h of hrs){
         let result = await hours.getHour(h, date).catch(log.err);
         if(!result) failures++;
         else if(!checkHour(result, date)) failures++;
         else
            output.push(result);
      }
      
      date = time.subDay(date);
   }
   if(failures)
      log.err('failures: '+failures);
   else
      log.success('no failures :-)');

   const filename = './hours.json'
   fs.writeFile(filename, JSON.stringify(output), (err)=>{
      if(!err) log.success(`${output.length} offices written to ${filename}`);
   });
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
