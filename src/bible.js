//bible.js
require('dotenv').config();
var request = require('request');
var nedb = require('nedb');
var db = new nedb({filename: 'data/passages.db', autoload: true});
var provDB = new nedb({filename: 'data/proverbs.db', autoload: true});
const log = require('./log');

module.exports = {get, randomProverb};

async function get(query){
	log.debug('bible get');

	return new Promise(async(resolve, reject)=>{


		let result = await getPassage(query).catch(log.warn);

		if(result) //if it's in the db, send it back
			resolve(result);
		else{ //check the ESV
			result = await getESV(query)

			if(result){ //if found from ESV, save to db, and resulove
				resolve(result);
				updateDB(query, result);
			}
			else
				resolve({title: "Bible", text: "no results for: "+query, next:"/", prev: "/"});
		}
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
					text: result.text,
					next: result.next,
					prev: result.prev
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
				next: passage.next,
				prev: passage.prev,
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

async function randomProverb(){ //get a random proverb
	return new Promise((resolve, reject)=>{

		var options={ //number of verses in each chapter
			1:33,
			2:22,
			3:35,
			4:27,
			5:23,
			6:35,
			7:27,
			8:36,
			9:18,
			10:32,
			11:31,
			12:28,
			13:25,
			14:35,
			15:33,
			16:33,
			17:28,
			18:24,
			19:28,
			20:30,
			21:31,
			22:29,
			23:35,
			24:34,
			25:28,
			26:28,
			27:27,
			28:28,
			29:27,
			30:33,
			31:9 //leave out the wife of noble character part, since it's not very aphoristic
		};
		var ch = getRandomInt(1, 31+1); //random chapter
		var vs = getRandomInt(1, options[ch]+1); //random verse

		if (ch<10)
			ch = "0"+ch;
		if (vs<10)
			vs = "0"+vs;

		var query = "200"+ch+"0"+vs;

		//check DB for query
		provDB.findOne({query: query}, async (err, result)=> {

			if(result){ //if in db
				log.info('found proverb in db')
				resolve(result);
			}
			else{ //query esv api for verse

				var options = {
				url: 'https://api.esv.org/v3/passage/text/?q='+query+'&include-passage-references=false&include-first-verse-numbers=false&include-verse-numbers=false&include-footnotes=false&include-footnote-body=false&include-passage-horizontal-lines=false&include-heading-horizontal-lines=false&include-headings=false&include-selahs=false&indent-paragraphs=0&indent-poetry=false&indent-poetry-lines=0&indent-psalm-doxology=0',
				headers: { Accept: 'application/json', Authorization: process.env.ESV_KEY }
				};

				let result = await getESV(query, options).catch(log.err);

				if(!result)//if no result
					reject(false);
				else{
					var cleanText = result.text.replace('\n',' ');
					cleanText = cleanText.replace('(ESV)','');

					var output = {
						title: result.title,
						text: cleanText,
						query: query
					};

					//send back result
					resolve(output);

					log.info("saving to DB: "+output.title)
					provDB.insert(output);
				}

			}
		});
	});
}
//exports.randomProverb(function(result){ console.log(result); }); //test

async function getESV(query, options){
	log.debug('getting ESV', query)
	return new Promise((resolve, reject)=>{
		log.info("getting data from ESV for: "+query)

		options = options || {
		  url: 'https://api.esv.org/v3/passage/html/?q='+query+'&wrapping-div=true&div-classes=esv-text&include-footnotes=false&include-audio-link=false',
		  headers: {
			Accept: 'application/json',
			Authorization: process.env.ESV_KEY
		  }
		};
	
		request(options, (error, response, body)=>{
			body = JSON.parse(body);
	
			if(body.canonical=="")//if no result
				reject(false);
			else{
				resolve({
					title: body.canonical,
					text: body.passages.join(' '),
					next: body.passage_meta[0].next_chapter.join('-'),
					prev: body.passage_meta[0].prev_chapter.join('-'),
				});
			}
		});
	});
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
