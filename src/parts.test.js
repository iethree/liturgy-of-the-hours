//test parts
const parts = require('./parts');
const hours = require('./hours');
const time = require('./time');
const log = require('./log');
const _ = require('lodash');

const datefns = require('date-fns');

test();

async function test(){
   var now = new Date();
   var results = [];

   for (let cnt=1; cnt<90; cnt++){
      let hr = await hours.getHour('Evening', time.format.numerical( datefns.addDays(now, cnt)))
      .catch(log.err);
      results.push(hr.parts[1].text);
   }
   let u = _.uniq(results);

   log.info(`total: ${results.length}, unique: ${u.length} (${u.length/results.length})`)
}
