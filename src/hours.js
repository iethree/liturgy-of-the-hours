//hours.js

const office = require('./office.js');
const moment = require('moment');
const md = require('markdown-it')({html: true});

const partQueries = {

	lauds: function(date){ //praise
		return [
			{part: 'intro', times: 'morning' },
			{part: 'bible', passage: getPsalm('praise', date)},
			{part: 'prayer', themes: {$nin:['end', 'petition']}, times: {$nin:['evening', 'night']}},
			{part: 'acclamation', season: { $in: [office.findSeason(date), 'any'] }},
			{part: 'prayer', themes: 'end', times: {$nin:['evening', 'night']}},
		];
	},

	terce: function(date){ //intercession/petition
		return [
			{part: 'preface', season: { $in: [office.findSeason(date), 'any'] } },
			{part: 'canticle'},
			{part:'prayer', themes: 'petition'},
			{title: /lord's prayer/i},
			{themes: 'end', times: {$nin:['evening', 'night']}},
		];
	},

	sext: function(date){ //wisdom
		return [
			{part: 'preface', season: { $in: [office.findSeason(date), 'any'] } },
			{part: 'bible', passage: getPsalm('ascent', date)},
			{part: 'collect', title: office.getWeek(date)},
			{part: 'creed'},
			{themes: 'end', times: {$nin:['evening', 'night']}}
		];
	},

	none: function(date){ //lesson?
		return [
			{part: 'preface', season: { $in: [office.findSeason(date), 'any'] } },
			{part: 'bible', passage: getLectionary(date)[1]},
			{themes: 'end', times: {$nin:['evening', 'night', 'morning']}},
		];
	},

	vespers: function(date){ //thanksgiving
		return [
			{part: 'intro', times: 'evening' },
			{part: 'bible', passage: getPsalm('thanks', date)},
			{part: 'collect', themes: {$nin:['daily', 'saint']}},
			{part: 'prayer', title: /general thanksgiving/i},
			{themes: 'end', times: {$nin:['morning']}},
		];
	},

	compline: function(date){ //penitence

		if(moment(date).format("dd")=="Th") //great litany on thursdays
			return [
				{part: 'intro', times: 'evening' },
				{part: 'great litany'},
				{themes: 'end', times: 'evening'},
			];

		return [
			{part: 'intro', times: 'evening' },
			{part: 'confession'},
			{part: 'litany'},
			{part: 'prayer', title: /suffrage/i},
			{part: 'prayer', times: 'evening', themes: 'end'},
		];
	},

	matins: function(date){
		return [ //rest
			{part: 'intro', times: 'evening' },
			{part: 'canticle'},
			{part: 'prayer', times: {$nin:['morning']}},
			{part: 'prayer', times: 'evening', themes: 'end'},
		];
	},

	lectionary: function(date){
		return [
			{part: 'bible', passage: getLectionary(date)[0]},
			{part: 'bible', passage: getLectionary(date)[1]},
			{part: 'bible', passage: getLectionary(date)[2]},
		];
	},

	morning: function(date){ 
		return [
			{part: 'bible', passage: getPsalm('morning', date)},
			{part: 'prayer', times: {$in:['morning']} },
		];
	},

	midday: function(date){ 
		return [
			{part: 'bible', passage: getPsalm('ascent', date)},
			{part: 'collect', title: office.getWeek(date)},
		];
	},

	evening: function(date){
		return [
			{part: 'bible', passage: getPsalm('evening', date)},
			{part: 'prayer', times: {$in:['evening', 'night']} },
		];
	},
	random: function(date){
		return [
			{part: 'prayer' }
		];
	},
};

//index
exports.getHour = function(hour, date, callback){

	hour = hour.toLowerCase();
	queries = partQueries[hour](date);

	office.getParts(queries, date+hour).then(function(results){

		var validResults=[];

		for (i=0; i<results.length; i++){

			if(results[i])
				validResults.push(results[i]);
		}

		callback({
			title: hour.charAt(0).toUpperCase() + hour.substr(1),
			seasonTitle: office.getWeek(date),
			season: office.findSeason(date),
			date: moment(date).format("MMMM D"),
			parts: validResults
		});

	}).catch(function(err){
		console.log("get parts error:"+err);
	});
}

//testcode
//exports.getHour('terce', '20181016', function(result){ console.log(result); } );


exports.findNow = function(){
	var hour = moment().format('k');

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

function getPsalm(type, date){
	console.log('getpsalm', type, date);
	var psalms = {

		thanks:
		["65", "67", "75", "107", "124", "136", "18", "21", "30", "32",
		"34", "40:1-11", "66:13-20", "92", "108", "116", "118", "138", "8", "105", "106",
		"135", "136", "11", "16", "23", "27", "62", "63", "91", "121", "125", "131"],

		praise:
		["8", "19:1-6", "33", "66:1-12", "67", "95", "100", "103", "104", "111",
		"113", "114", "117", "145", "146", "147", "148", "149", "150", "1",
		"36", "37", "49", "73", "112", "127", "128", "133", "19:7-14", "50", "2"],

		ascent:
		["119.1-8", "119.9-16", "119.17-24", "119.25-32", "119.33-40", "119.41-48", "119.49-56",
		"119.57-64", "119.65-72", "119.73-80", "119.81-88", "119.89-96", "119.97-104", "119.105-112",
		"119.113-120", "119.121-128", "119.129-136", "119.137-144", "119.145-152", "119.153-160",
		"119.161-168", "119.169-176", "121", "122", "123, 124", "125, 126", "127", "128", "129",
		"130", "131", "133"],
		
		morning:
		["1", "2", "3", "4", "5", "6", "8", "11", "12", "13",
		"14", "15", "16", "20", "23", "24", "27", "28", "29", "30", "41",
		"42", "43", "46", "47", "50", "51", "52", "53", "54", "60", "61", "62"],
		
		evening:
		["63", "64", "65", "67", "70", "75", "76", "82", "85", "87",
		"92", "93", "95", "96", "97", "98", "99", "100", "101", "105", "106",
		"108", "110", "111", "112", "113", "114", "117", "120", "121", "122", "123", "124"]
	}


	index = moment(date).format("D")-1;
	if(psalms[type] && psalms[type][index])
		return "psalm"+psalms[type][index];
	else
		return "psalm1";
}

function getLectionary(date){

	year = "one"; //need to implement logic for figuring out the year

	try{
		var today= lectionary.dailyOfficeLectionary[office.getWeek(date).toLowerCase()][moment(date).format('dddd').toLowerCase()][year];
	}
	catch(e){
		return ['psalm 1', 'psalm 1', 'psalm 1'];
	}
	return today;
}
