const rcl = require('../../daily-office');
const lectionary = require('../src/lectionary.js')
const time = require('../src/time.js');

// getWeekTest();
function getWeekTest(){
   var [x,y] = lectionary.getWeek('20200101');
   console.log(x, y)
}

lectionaryTest();
async function lectionaryTest(){
   var date = '20201231';
   for (let i=0; i<10; i++){
      let result = await lectionary.getLectionary(date).catch(console.log);
      date = time.subDay(date);
   }
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
