const bible = require ('./bible.js');
const log   = require('./log.js');

test();

async function test(){
   var psalms=[], lengths = [];
   for(let cnt=1; cnt<150; cnt++)
      psalms.push(await bible.get('psalm'+cnt));
   
   for(psalm in psalms)
     lengths.push({psalm: Number(psalm)+1, len: psalms[Number(psalm)].text.length});

   lengths.sort((a,b)=>a.len-b.len);
   log.info(lengths);
}