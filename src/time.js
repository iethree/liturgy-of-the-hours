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
module.exports = {format, subDay, addDay, isBetween};

/**
 * returns YYYYMMDD formatted date 1 day earlier
 * @param {string|Object} date 
 */
function subDay(date){
	date = getDateObject(date);
	date = datefns.subDays(date, 1);
	return format.numerical(date);
}
/**
 * returns YYYYMMDD formatted date 1 day later
 * @param {string|Object} date 
 */
function addDay(date){
	date = getDateObject(date);
	date = datefns.addDays(date, 1);
	return format.numerical(date);
}

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

//inclusive
function isBetween(x, beg, end){
	x = getDateObject(x);
	beg = getDateObject(beg);
	end = getDateObject(end);
	if(x===beg || x===end) //return true if equal
		return true;
	return (datefns.isAfter(x, beg) && datefns.isBefore(x, end));
}


Object.assign(String.prototype, {
	contains(text){
		//case insensitive includes
		return this.toLowerCase().includes(text.toLowerCase()); 
	}
});


