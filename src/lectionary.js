const time = require('./time.js');
const log = require('logchalk');
const rcl = require('../../daily-office');
const parts = require('./parts.js');
const calendar = require('../data/calendar.js');

module.exports = {getLectionary};

async function getLectionary(date){
   var year  = "Year Two"; //need to implement logic for figuring out the year
   var exact = time.format.md(date);

   //check for exact date
   var todaysLectionary = await rcl.get({day: exact}).catch(()=>{}); 
   if(!todaysLectionary){
      //otherwise, check for week and day
      var [shortWeek, longWeek] = getWeek(date);
      var dow = time.format.dow(date);
      
      todaysLectionary = await rcl.get({year: year, week: longWeek, day: dow}).catch(log.err);
   }

   if(!todaysLectionary) 
      return Promise.reject("failed to find lectionary: "+shortWeek+" "+ dow);

   todaysLectionary.shortWeek = shortWeek;
   let collect = await parts.getCollect(shortWeek).catch(log.err);
   todaysLectionary.collect = collect ? collect : null;

   return todaysLectionary;
}

function getWeek(date){
	let day = time.format.numerical(date);
	
	for(cnt=0; cnt<7; cnt++){ //search for last valid title 1 day at a time
		if(calendar[day])
		   return [calendar[day], getLongWeek(calendar[day])];
		day = time.subDay(day);
   }
   
	throw new Error("no week found for " + date);
}

function getLongWeek(shortWeek){
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

function getSeason(date){
	source = getWeek(date);
	
	if(source.contains('easter'))
	return 'easter';
	if(source.contains('lent') || source.contains("ash wednesday") || source.contains("palms"))
		return 'lent';
		if(source.contains("holy week"))
		return 'holyweek';
		if(source.contains('advent'))
		return 'advent';
		if(source.contains('christmas'))
		return 'christmas';
	if(source.contains('epiphany') || source.contains('baptism') || source.contains('transfiguration'))
	return 'epiphany';
	if(source.contains('ascension'))
	return 'ascension';
	if(source.contains('pentecost'))
	return 'pentecost';
	else //ordinary time and other
	return 'ordinary';
};

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
