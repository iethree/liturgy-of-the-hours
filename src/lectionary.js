const time = require('./time.js');
const nedb = require('nedb');
const log = require('logchalk');
const _ = require('lodash');
const lectionary = new nedb({filename: '../data/lectionary.db', autoload: true});

module.exports = {psalms, lessons, title};
/**
 * returns 3-4 lesson references
 * @param {number} date  YYYYMMDD
 */
async function lessons(date){

   var result = await getLectionary(date).catch(log.err);

   if(result && result.lessons)
      return Promise.resolve(getValues(result.lessons));
	else
		return Promise.reject("no lectionary found");
}

/**
 * returns all the psalms for the day
 * @param {number} date YYYYMMDD 
 */
async function psalms(date){
   var result  = await getLectionary(date).catch(log.err);
   if(result && result.psalms)
      return Promise.resolve(getValues(result.psalms));
	else
		return Promise.reject("no psalms found");
}

async function title(date){
   var result = await getLectionary(date).catch(log.err);

   if(result && result.title)
      return result.title;
	else
		return "Untitled";
}

async function getLectionary(date){
   var year  = "Year Two"; //need to implement logic for figuring out the year
   var exact = time.format.md(date);

   //check for exact date
   var todaysLectionary = await find({day: exact}).catch(()=>{}); 
   if(todaysLectionary) return todaysLectionary;

   //otherwise, check for week and day
   var week  = time.getWeek(date);
   var dow   = time.format.dow(date);
   
   todaysLectionary = await find({year: year, week: week, day: dow}).catch(log.err);
   if(todaysLectionary) return todaysLectionary;
   else return Promise.reject("failed to find lectionary: "+week+" "+ dow);
}

/**
 * promise wrapper for database queries
 * @param {Object} query mongoDB style query 
 * @returns {Promise} resolves to array of results
 */
async function find(query){
	return new Promise((resolve, reject)=>{
		lectionary.findOne(query, (err, result)=>{
			if(err || !result)
				reject(err || "no lectionary found ");
			else
				resolve(result);
		});
	});
}

function getValues(obj){
   if(obj.morning || obj.evening)
      return [..._.flatMap(obj.morning),..._.flatMap(obj.evening)];
   return _.flatMap(obj);
}