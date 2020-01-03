const rcl = require('../../daily-office');
const lectionary = require('../src/lectionary.js')
const time = require('../src/time.js');
const log = require('logchalk');

// getWeekTest();
function getWeekTest(){
   var [x,y] = lectionary.getWeek('20200101');
   console.log(x, y)
}

lectionaryTest('20201231', 365);
async function lectionaryTest(date, num){
   let failures = 0;
   for (let i=0; i<num; i++){
      let result = await lectionary.getLectionary(date).catch(log.warn);
      if(!result) failures++;
      date = time.subDay(date);
   }
   log.err('failures: ', failures, "/", num);
}

function translateTest(){
   rcl.get({}).then((r)=>{
      var seasons = [];
      var weeks = [];
      var shortWeeks = [];
      var titles = [];
   
      for (let i of r){
         if(seasons.indexOf(i.season)==-1)
            seasons.push(i.season)
         if(weeks.indexOf(i.week)===-1)
            weeks.push(i.week)
         if(i.title && titles.indexOf(i.title)===-1)
            titles.push(i.title)
      }
   
      for (let i in lectionary.calendar){
         if(shortWeeks.indexOf(lectionary.calendar[i])===-1)
            shortWeeks.push(lectionary.calendar[i]);
      }
   
      //console.log('seasons', seasons.length);
      for (let i in shortWeeks){
         shortWeeks[i] = [shortWeeks[i], lectionary.getLongWeek(shortWeeks[i])];
      }
      console.table(shortWeeks)
   
      for (let i in weeks){
         weeks[i] = [weeks[i], lectionary.getShortWeek(weeks[i])];
      }
      console.table(weeks)
      //console.log('titles', titles.length);
   })
}
