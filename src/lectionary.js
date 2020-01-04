const time = require('./time.js');
const log = require('logchalk');
const rcl = require('../../daily-office');
const parts = require('./parts.js');
const calendar = require('../data/calendar.js');

module.exports = {getLectionary};

async function getLectionary(date){
   var year  = getYear(date);
   var [shortWeek, longWeek] = getWeek(date);
   var dow = time.format.dow(date);

   //check for exact date
   var todaysLectionary = await rcl.get({day: time.format.md(date)}).catch(()=>{}); 

   if(!todaysLectionary)//otherwise, check for week and day
      todaysLectionary = await rcl.get({year: year, week: longWeek, day: dow}).catch(log.err);
   
   if(!todaysLectionary) //otherwise check for title
      todaysLectionary = await rcl.get({year: year, title: longWeek}).catch(log.err);


   if(!todaysLectionary) 
      return Promise.reject("failed to find lectionary for: "+date+" "+shortWeek+" "+ dow);

   todaysLectionary.shortWeek = shortWeek;
   let collect = await parts.getCollect({$in:[shortWeek, longWeek, todaysLectionary.title]}).catch(()=>{});
   todaysLectionary.collect = collect ? collect : null;

   return todaysLectionary;
}

function getYear(date){
   if(time.isBetween(date, '2018-12-2', '2019-11-30'))
      return "Year One";
   if(time.isBetween(date, '2019-12-1', '2020-11-28'))
      return "Year Two";
   if(time.isBetween(date, '2020-11-29', '2021-11-27'))
      return "Year One";
   if(time.isBetween(date, '2021-11-28', '2022-11-27'))
      return "Year Two";
      
   return "Year One";
}

function getWeek(date){
	let day = time.format.numerical(date);
	
	for(cnt=0; cnt<7; cnt++){ //search for last valid title 1 day at a time
		if(calendar[day]){
         if(calendar[day]==="Ascension Day"){
            day = time.subDay(day); 
            continue;
         }
		   return [calendar[day], getLongWeek(calendar[day])];
      }
		day = time.subDay(day); 
   }
   
	throw new Error("no week found for " + date);
}

function getLongWeek(shortWeek){
   if (shortWeek==="Ash Wednesday")
      return "Ash Wednesday and Following";
   if (shortWeek==="Trinity Sunday")
      return "The First Sunday after Pentecost: Trinity Sunday";
   
   
   let match = /(lent|easter|christmas|advent|epiphany) (\d|last)/i.exec(shortWeek);
   if(match)
      return `Week of ${match[2]} ${match[1]}`;
   else
      return shortWeek;
}

function getShortWeek(longWeek){
   let match = /Week of (\d|last) (lent|easter|christmas|advent|epiphany)/i.exec(longWeek);
   if(match)
      return `${match[2]} ${match[1]}`; 
   else
      return longWeek;
}

function getCurrentOfficeName(){
	var hour = datefns.format(new Date(), 'H');

	if(hour >= 4 && hour < 8)
		return "Lauds";
		if(hour >= 8 && hour < 11)
		return "Terce";
	if(hour >= 11 && hour < 14)
	return "Sext";
	if(hour >= 14 && hour < 16)
	return "None";
	if(hour >= 16 && hour < 20)
	return "Vespers";
	if(hour >= 20 && hour < 24)
	return "Compline";
	else
	return "Matins";
}
