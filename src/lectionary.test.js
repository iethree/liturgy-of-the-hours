//lectionary test
const lectionary = require('./lectionary');
const log = require('logchalk');
const datefns = require('date-fns');


const NUM = 400;

async function test(num){
   var valid = 0;
   for (let cnt = 0; cnt<num; cnt++){
      let dt = datefns.addDays(new Date, cnt);
      let r = await lectionary.psalms(dt).catch(e=>log.err(dt, e));
      if(r)
         valid++;
   }
   return valid;
}

test(NUM).then((valid)=>{
   if(valid==NUM)
      log.success("success: "+valid);
   if(valid!==NUM)
      log.err(`expected: ${NUM}, got ${valid}`);
})


