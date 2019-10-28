const datefns = require('date-fns');
const calendar = require('../data/calendar.js');

var format = {
	short: (date)=>{
		date = getDateObject(date);
      return datefns.format(date,'MMMM d');
   },
   numerical: (date)=>{
		date = getDateObject(date);
      return datefns.format(date,'yyyyMMdd');
   },
   dom: (date)=>{
		date = getDateObject(date);
      return datefns.format(date,'d');
   },
   dow: (date)=>{
		date = getDateObject(date);
      return datefns.format(date,'EEEE');
	},
	md: (date)=>{
		date = getDateObject(date);
      return datefns.format(date,'MMM d');
   },
   object: date=>getDateObject(date)
};

function getDateObject(date){
	if(!date)
      return new Date();
   if(date instanceof Date)
	return date;
   
   let parsed = datefns.parseISO(date);
   if(datefns.isValid(parsed))
	return parsed;
   else
	return new Date();
}

function getWeek(date){
	date = getDateObject(date);
	
	if(!calendar[format.numerical(date)]){ //if there's no title for today
	for(cnt=1; cnt<8; cnt++){ //search for last valid title 1 day at a time
		date = datefns.subDays(date, 1);
		if(calendar[format.numerical(date)])
		break;
	}
	}
	return (calendar[format.numerical(date)]);
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

Object.assign(String.prototype, {
	contains(text){
		//case insensitive includes
		return this.toLowerCase().includes(text.toLowerCase()); 
	}
});

module.exports = {getWeek, getSeason, getCurrentOfficeName, format};

