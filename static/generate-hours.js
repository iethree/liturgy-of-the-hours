const hours = require(__dirname+'/../src/hours.js');
const time = require(__dirname+'/../src/time.js');
const log = require('logchalk');
const fs = require('fs');

const outputFile = __dirname+'/_data/hours.json';

//generate starting today for N days
generateHours(time.format.numerical(new Date()), Number(process.argv[2]) || 7);

/**
 * generates static json of data to use to create static office files
 * 
 * @param {string} date YYYYMMDD starting date
 * @param {number} num integer number of days for which to generate offices
 */
async function generateHours(date, num){
   const hrs = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins", "Morning", "Noon", "Evening"];
   var output = [];

   for (let i=0; i<num; i++){
      for(let h of hrs){
         let result = await hours.getHour(h, date).catch(log.err);
         if(!result) throw new Error(`no office for ${h} on ${date}`);
         output.push(result);
      }      
      date = time.addDay(date);
   }

   fs.writeFile(outputFile, JSON.stringify(output), (err)=>{
      if(!err) log.success(`${output.length} offices written to ${outputFile}`);
   });
}
