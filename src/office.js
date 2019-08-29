//office.js

var bible = require('./bible.js');
var calendar = require('./calendar.js');
var moment = require('moment');
var md = require('markdown-it')({html: true});
var random = require('random-seed');

var nedb = require('nedb');
var db = new nedb({filename: 'data/parts.json', autoload: true});

//get an array of parts and return a promise
exports.getParts = function (queries, seed){

	return new Promise(function(resolve, reject){

		var promises = [];

		//make an array of promises
		for(cnt=0; cnt<queries.length; cnt++){

			if(queries[cnt].part=="bible") //get bible queries
				promises.push(bible.get(queries[cnt].passage));
			else //get part queries
				promises.push(getPart(queries[cnt], seed));
		}

		//when all the promises resolve, resolve this master promise
		Promise.all(promises).then(function(results){

			resolve(results);

		}).catch(function(){

			console.log("promise.all error");
		});
	}).catch(errormsg);
}

//get one part and return a promise
function getPart(query, seed){

	return new Promise(function(resolve, reject){

		db.find(query, function(err, results){

			if(results.length){

				var theone = getOneFrom(results, seed);

				if(theone.text){
					console.log("part found: "+theone.part);
					resolve({
						id: theone._id,
						part: theone.part,
						title : theone.title,
						subtitle : theone.subtitle,
						text : processText(theone.text)
					});
				}
			}
			else{
				console.log("not found", query);
				resolve({text: "..."});
			}
		});

	}).catch(errormsg);
}


exports.getById = function(id){

	return new Promise(function(resolve, reject){


		Part.findOne({_id:id}, function(err, result){

			if(result){
				console.log("part found");
				resolve(result);
			}
			else{
				console.log("not found");
				resolve({text: "..."});
			}
		});

	}).catch(errormsg);
}

//process custom indents and markdown
function processText(text){

	output = text;

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
		if(Array.isArray(several)){

			var one = several[getRandomInt(0, several.length-1, seed)];

			return one;
		}
		else if(several){

			return several;
		}
		else
			return false;
}

//to put in some static text if wanted
function staticPart(text){
	return new Promise(function(resolve, reject){

		if(text)
			resolve({text: md.render(text.replace(/>/g, "&nbsp;&nbsp;&nbsp;&nbsp;"))});
		else
			reject;

	}).catch(errormsg);
}

//alias
function findSeason(source){return exports.findSeason(source);}

exports.findSeason= function(date){
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

exports.getWeek=function(date){	return getWeek(date); }

function getWeek(date){

	date = date || moment().format("YYYYMMDD");

	if(!calendar[date]){ //if there's no collect for today

		for(cnt=1; cnt<8; cnt++){ //search for last valid collect 1 day at a time

			date = moment(date).subtract(1, 'd').format("YYYYMMDD");

			if(calendar[date])
				break;
		}
	}
	return (calendar[date]);
}

Object.assign(String.prototype, {

	contains(text){

		if (this.toLowerCase().indexOf(text.toLowerCase())>-1) //case insensitive
			return true;
		else
			return false;
	}
});

//list of parts
exports.getPartList = function(callback){

	var conn = mongoose.connect('mongodb://localhost/office');
	conn.then(function(){

		Part.distinct('part', function(err, result){


			//list of parts
			callback(result.sort());

		});

	}).catch(errormsg);

}

//dump all of a given part
exports.getPartDump = function(part, callback){
	var conn = mongoose.connect('mongodb://localhost/office');

	conn.then(function(){

		Part.find({part: part}, function(err, result){

			//dump of parts
			for(var cnt=0; cnt<result.length; cnt++){

				if(result[cnt].text)
					result[cnt].text = processText(result[cnt].text);
			}

			callback(result);
		});

	}).catch(errormsg);
}

exports.dumpAll = function(part, callback){
	var conn = mongoose.connect('mongodb://localhost/office');

	conn.then(function(){

		Part.find({}, function(err, result){

			//dump of parts
			callback(result);
		});

	}).catch(errormsg);
}

//handle add/edit/delete functions
exports.dbOps=function(operation, data, callback){

	if(operation=="savetags"){

		console.log("savetags");

		var command = {$set: {
			themes: data.themes,
			season: data.season,
			times: data.times
		}};

		editPart(data.id, command, callback);
	}
	else if(operation=="updateall"){

		console.log("update all");

		var command = {$set: {
			part: data.part,
			title: data.title,
			subtitle: data.subtitle,
			source: data.source,
			themes: data.themes,
			season: data.season,
			times: data.times,
			text: data.text
		}};

		if (data.id =="new"){
			createPart(command.$set, callback);
		}
		else{
			editPart(data.id, command, callback);
		}
	}
	else if(operation=="delete"){
		deletePart(data.id, callback);
	}
	else
		return false;

}

function editPart(id, command, callback){
	var conn = mongoose.connect('mongodb://localhost/office');

	conn.then(function(){
		Part.findByIdAndUpdate(id, command,
		function(err, result){

			// mongoose.disconnect(function(err){
				// console.log("mongo disconnected");
			// });

			if(!err)
				callback(true);
			else
				callback(err);

		});

	}).catch(errormsg);
}

function createPart(data, callback){
	var conn = mongoose.connect('mongodb://localhost/office');

	conn.then(function(){
		Part.create(data, function(err){

			// mongoose.disconnect(function(err){
				// console.log("mongo disconnected");
			// });

			if(!err)
				callback(true);
			else
				callback(err);
		});
	}).catch(errormsg);
}

function deletePart(id, callback){
	var conn = mongoose.connect('mongodb://localhost/office');

	conn.then(function(){
		Part.deleteOne({_id:id}, function(err){

			// mongoose.disconnect(function(err){
				// console.log("mongo disconnected");
			// });

			if(!err)
				callback(true);
			else
				callback(err);
		});
	}).catch(errormsg);
}

function errormsg(err){	console.log("error: "+err);}

//seeded random integer generator so that everyone gets the same thing at the same time
function getRandomInt(min, max, seedImport) { //max is inclusive

  seed = seedImport.toLowerCase();
  gen = random(seed);

  return gen(max+1);
}
