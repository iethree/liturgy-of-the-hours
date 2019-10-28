var time = ('./time.js');
const nedb = require('nedb');
const lectionary = new nedb({filename: '../data/lectionary.db', autoload: true});

module.exports = {psalms, lessons, title};
/**
 * returns 3 bible references
 * @param {number} date  YYYYMMDD
 */
async function lessons(date){

   var {lessons}  = await getLectionary(date);

   if(lessons)
      return [lessons.first, lessons.second, lessons.gospel]
	else
		return ['psalm 1', 'psalm 1', 'psalm 1'];
}

/**
 * 
 * @param {*} date 
 */
async function psalms(date){
   var {psalms}  = await getLectionary(date);
   if(psalms)
      return [psalms.morning, psalms.evening];
	else
		return ['psalm 1', 'psalm 1'];
}

async function title(date){
   var {title} = await getLectionary(date);

   if(title)
      return title;
	else
		return "Untitled";
}

async function getLectionary(date){
   var year  = "Year Two"; //need to implement logic for figuring out the year
   var exact = time.format.md(date);

   var todaysLectionary = await find({year: year, day: exact}).catch(log.err); //check for exact date

   if(todaysLectionary) return todaysLectionary;

   var week  = time.getWeek(date);
   var dow   = time.format.dow(date);

   //check for week and day
   todaysLectionary = await find({year: year, week: week, day: dow}).catch(log.err);

   if(todaysLectionary) return todaysLectionary;
}

/**
 * promise wrapper for database queries
 * @param {Object} query mongoDB style query 
 * @returns {Promise} resolves to array of results
 */
async function find(query){
	return new Promise((resolve, reject)=>{
		lectionary.find(query, (err, results)=>{
			if(err || !results || !results.length)
				reject(err || "no lectionary found for "+query);
			else
				resolve(results);
		});
	});
}

