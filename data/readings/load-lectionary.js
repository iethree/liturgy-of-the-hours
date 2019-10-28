//load daily office lectionary

const fs = require('fs');
const log = require('logchalk');
const _ = require('lodash');

var nedb = require('nedb');
var lectionary = new nedb({filename: '../lectionary.db', autoload: true});
var calendar = new nedb({filename: '../calendar.db', autoload: true});
var calendarData = require('../calendar.js');

function readLectionaryData(){
   fs.readFile('./dol-year-1.min.json',      loadData);
   fs.readFile('./dol-year-2.min.json',      loadData);
   fs.readFile('./dol-holy-days.min.json',   loadData);
}
function readCalendarData(){
   //fs.readFile("../calendar.json", loadCalendarData)
   loadCalendarData(false, calendarData);
}

function loadData(err, data){
   if(err) log.err(err);
   data = JSON.parse(data);

   lectionary.insert(data, (err, result)=>{
      if(err) log.err(err);
      log.info(result);
   });
}

async function weekList(){
   var all = await find({}).catch(log.err);
   var weeks = [];

   for (let i of all){
      if(i.week && !weeks.includes(i.week))
         weeks.push(i.week);
   }
   weeks = weeks.sort();
   log.info(weeks);
   return weeks;
}

function loadCalendarData(err, data){
   if(err) log.err(err);
   //log.info(data.toString());
   //data = JSON.parse(data.toString()).catch(log.err);
   log.info(data);

   var finalData = [];

   for(let i in data){
      finalData.push({date: i, name: data[i]});
   }

   calendar.insert(finalData, (err, result)=>{
      if(err) log.err(err);
      log.info(result);
   });
}


async function transformWeeks(){
   var all = await find({}).catch(log.err);
   var weeks = [];
   for(let i of all){
      if(!i.week) continue;

      let n = /\d/.exec(i.week);
      if(n) n = n[0];
      else n = null;
      let w = null;
      

      if (i.week.includes("Advent"))
         w = "Advent";
      else if (i.week.includes("Lent"))
         w = "Lent";
      else if (i.week.includes("Christmas"))
         w = "Christmas", n=""; 
      else if (i.week.includes("Epiphany")){
         w = "Epiphany";
         if(i.week.includes("Last")) n = "Last";
         if(i.week.includes("The Epiphany")) n = "";
      }
      else if (i.week.includes("Easter")){
         w = "Easter";
         if(i.week.includes("Easter Week")) n = 1;
      }
      else continue;
      if(n) w = w+" "+n;
      lectionary.update({_id: i._id}, {$set: {week: w}});
   }
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
