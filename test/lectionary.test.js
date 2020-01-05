const rcl = require('../../daily-office');
const lectionary = require('../src/lectionary.js')
const time = require('../src/time.js');
const log = require('logchalk');

// getWeekTest();
function getWeekTest(){
   var [x,y] = lectionary.getWeek('20200101');
   console.log(x, y)
}

lectionaryTest('20201231', 370);
async function lectionaryTest(date, num){
   let failures = 0;
   for (let i=0; i<num; i++){
      let result = await lectionary.getLectionary(date).catch(log.warn);
      result = checkLectionary(result);
      if(!result) failures++;
      date = time.subDay(date);
   }
   if (failures>0) 
      log.err('failures: ', failures, "/", num);
   else 
      log.success('no failures :-)');
}

showLectionary('20200412')
async function showLectionary(date){
   let result = await lectionary.getLectionary(date).catch(log.warn);
   console.log(result);
}


function checkLectionary(l){
   if(!l) return false;
   var requirements = [
      'collect',
      'week',
      'shortWeek',
      'season',
      'lessons',
      'psalms',
      'day'
   ];

   if(totalPsalms(l.psalms)<2)
      log.warn(`less than 2 psalms in ${l.week}, ${l.day}`);
   if(l.lessons.length<2)
      log.warn(`less than 2 lessons in ${l.week}, ${l.day}`);
   // if(!l.psalms.morning)
   //    log.err(`no morning psalm in ${l.week}, ${l.day}`);
   // if(!l.psalms.evening)
   //    log.err(`no evening psalm in ${l.week}, ${l.day}`);
   // if(!l.lessons.first)
   //    log.err(`no first lesson in ${l.week}, ${l.day}`);
   // if(!l.lessons.second)
   //    log.err(`no second lesson in ${l.week}, ${l.day}`);
   // if(!l.lessons.gospel)
   //    log.err(`no gospel lesson in ${l.week}, ${l.day}`);


   for(let i of requirements){
      
      if(!l[i]) {
         log.err(`missing property: ${i} in ${l.week}, ${l.day}`);
         return false;
      }
   }
   return true;
}

function totalPsalms(psalms){
   let e=psalms.evening, m=psalms.morning;
   let cnt=0;
   if(m && m.length)
      cnt+=m.length;
   if(e && e.length)
      cnt+=e.length;
   return cnt;
}

function translateTest(){
   rcl.getMany({}).then((r)=>{
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

//inventory(365);

async function inventory(days){
   var date = '20201231';
   var all = [];
   for (let i=0; i<days; i++){
      let result = await lectionary.getLectionary(date).catch(log.warn);
      if(!result) failures++;
      else all.push(result);
      date = time.subDay(date);
   }

   var seasons = [];
   var weeks = [];
   var shortWeeks = [];
   var titles = [];

   for (let i of all){
      if(seasons.indexOf(i.season)==-1)
         seasons.push(i.season)
      if(weeks.indexOf(i.week)===-1)
         weeks.push(i.week)
      if(i.title && titles.indexOf(i.title)===-1)
         titles.push(i.title)
   }
   console.log('seasons', seasons);
}
