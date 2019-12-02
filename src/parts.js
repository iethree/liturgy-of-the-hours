//office.js

const bible = require('./bible.js');
const md = require('markdown-it')({html: true});
const random = require('random-seed');
const log = require('logchalk');
const _ = require('lodash');

var nedb = require('nedb');
var db = new nedb({filename: './data/parts.db', autoload: true});

module.exports = {getRandomPart, getRandomParts, getAllParts, showAllParts, getPartList, addTag, removeTag};

/**
 * promise wrapper for database queries
 * @param {Object} query mongoDB style query 
 * @returns {Promise} resolves to array of results
 */
async function find(query){
	return new Promise((resolve, reject)=>{
		db.find(query, (err, results)=>{
			if(err || !results)
				reject(err);
			else
				resolve(results);
		});
	});
}


/**
 * get an array of random parts and return a promise
 * @param {Array} queries array of queries 
 * @param {String} seed random seed
 * @returns {Promise} that resolves to an array of parts
 */
async function getRandomParts(queries, seed){
	
	var promises = queries.map(q=>{
		if(q.part=="bible") // bible queries
			return bible.get(q.passage).catch(log.err);
		else // part queries
			return getRandomPart(q, seed).catch(log.err);
	});

	return Promise.all(promises);
}

//get one part and return a promise
async function getRandomPart(query, seed){

	var results = await getAllParts(query).catch(log.err);
	var theone = getOneFrom(results, seed);

	if(theone && theone.text){
		log.success("part found: "+theone.part);
		return Promise.resolve({
			id: theone._id,
			part: theone.part,
			title : theone.title,
			subtitle : theone.subtitle,
			text : processText(theone.text)
		});
	}
	else
		return Promise.reject('part not found for ',query);
}

async function getAllParts(query){
	
	let results = await find(query).catch(log.err);

	if(!results.length)
		return Promise.reject('no parts found for ',query);
	else
		return Promise.resolve(results);
}

async function showAllParts(query){
	let results = await getAllParts(query).catch(log.err);

	if (!results)
		return Prommise.reject('no parts found for ',query);

	results = results.map(p=>{
		p.text = processText(p.text);
		return p;
	});
	return Promise.resolve(results);
}

//process custom indents and markdown
function processText(text){

	let output = text;

	//bold indent lines
	output = output.replace(/>\*\*(.*\S)/gi, '>**$1**');

	//italic indent lines
	output = output.replace(/>\*(\w.*\S)/gi, '>*$1*');

	//add whitespace to EOL
	output = output.replace(/\r\n/gi, '\s\s\r\n');

	//plain indent
	output = output.replace(/>(.*)/gi, '<span class="indent"> $1 </span>');

	return md.render(output);
}

//get a random part from multiple matching parts
function getOneFrom(several, seed){
		if(Array.isArray(several))
			return several[getRandomInt(several.length, seed)];
		else if(several)
			return several;
		else
			return false;
}

//to put in some static text if wanted
function staticPart(text){
	return new Promise(function(resolve, reject){
		if(text)
			resolve({text: md.render(text.replace(/>/g, "&nbsp;&nbsp;&nbsp;&nbsp;"))});
		else
			reject(false);
	});
}

Object.assign(String.prototype, {

	contains(text){
		//case insensitive includes
		return this.toLowerCase().includes(text.toLowerCase()); 
	}
});

//list of unique part types
async function getPartList(){
	let results = await find({}).catch(log.err);
	let types = results.map(i=>i.part);

	let uniqueTypes = _.uniq(types);
	uniqueTypes = uniqueTypes.filter(i=>i);
	return Promise.resolve(uniqueTypes);
}

async function update(id, operation){

	 return new Promise((resolve, reject)=>{
		db.update({_id: id}, operation, (err, result)=>{
			if(result)   
				resolve(true);
			else if(err) 
				reject(err);
			else	
				reject("part not updated: "+id);
		});
	 });
}

async function addTag(body){
	log.info ('add', body.field, body.tag);
	
	if(body.field === 'times' || body.field === 'themes'){
		let r = await update(body.id, {$addToSet: {[body.field]: body.tag }}).catch(log.err);
		if(r) return Promise.resolve(true);
	}
	
	return Promise.reject("tag not added");
}

async function removeTag(body){
	log.info ('remove', body.field, body.tag);

	if(body.field === 'times' || body.field === 'themes'){
		let r = await update(body.id, {$pull: {[body.field]: body.tag }}).catch(log.err);
		if(r) return Promise.resolve(true);
	}
	
	return Promise.reject("tag not added");
}

//seeded random integer generator so that everyone gets the same thing at the same time
function getRandomInt(max, seedImport) { //max is exclusive

  seed = seedImport.toLowerCase();
  gen = random(seed);
  return gen(max);
}
