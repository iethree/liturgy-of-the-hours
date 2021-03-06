//bible.js
require('dotenv').config();
var request = require('request');
var nedb = require('nedb');
var db = new nedb({filename: '../data/passages.db', autoload: true});
const log = require('logchalk');

module.exports = {get};

async function get(query){
	return new Promise(async(resolve, reject)=>{
		let result = await getPassage(query).catch(log.warn);

		if(result){ //if it's in the db, send it back
			resolve(result);
			return;
		} 
			
		//check the ESV
		result = await getESV(query).catch(log.err);

		if(result){ //if found from ESV, save to db, and resulove
			resolve(result);
			updateDB(query, result);
			return;
		}

		reject(false);
	});
}

async function getPassage(query){
	return new Promise((resolve, reject)=>{
		//check the database first
		db.findOne({queries: query},function(err, result){

			if(result){
				log.success("found in db: "+result.title);

				resolve({
					title: result.title,
					text: result.text
				});
			}
			else //if can't find in DB
				reject('not found in db');
		});
	});
}

function updateDB(query, passage){
	//check to see if canonical name exists in DB
	db.findOne({title: passage.title}, function(err, result){

		if(result){
			log.info("pushing '"+query+"' into query list for "+result.title);

			//add the query to the query list for that passage
			db.update({title: passage.title}, {$push: {queries: query} }, {} );
		}
		else{
			//save new db entry
			db.insert({
				title: passage.title,
				text: passage.text,
				queries: [passage.title, query],
				views: 1
			},
			function(err,newPassage){

				if (err)
					log.err(err);
				else
					log.info("new passage saved to db: "+passage.title);
			});
		}
	});
}

async function getESV(query, options){

	return new Promise((resolve, reject)=>{
		query = query
			.replace(/–/g,'-')
			.replace(/\(\[/g,',')
			.replace(/\)\]/g,'');


		log.info("getting data from ESV for: "+query)

		options = options || {
		  url: 'https://api.esv.org/v3/passage/html/?q='+query+'&wrapping-div=true&div-classes=esv-text&include-footnotes=false&include-audio-link=false',
		  headers: {
			Accept: 'application/json',
			Authorization: process.env.ESV_KEY
		  }
		};
	
		request(options, (error, response, body)=>{
			if(error || !body){
				reject('no response from ESV');
				return;
			}
				
			body = JSON.parse(body);
	
			if(body.canonical=="" || !body.passages)//if no result
				reject(body);
			else{
				resolve({
					title: body.canonical,
					text: body.passages.join(' ')
				});
			}
		});
	});
}
