//hours.js

const parts = require('./parts.js');
const lectionary = require('./lectionary.js');
const time = require('./time');
const log = require('logchalk');

module.exports = {getHour};

const partQueries = {

	lauds: function(lectionary){ //praise
		return [
			{part: 'intro', times: 'morning' },
			{part: 'bible', passage: "Psalm "+(lectionary.psalms.morning ? lectionary.psalms.morning[0] : 1)},
			{part: 'prayer', themes: {$nin:['end', 'petition']}, times: {$nin:['evening', 'night']}},
			{part: 'prayer', themes: 'end', times: {$nin:['evening', 'night']}},
		];
	},

	terce: function(lectionary){ //intercession/petition
		return [
			{part: 'preface', season: { $in: [lectionary.season, 'any'] } },
			{part: 'canticle'},
			{part:'prayer', themes: 'petition'},
			{title: /lord's prayer/i},
			{themes: 'end', times: {$nin:['evening', 'night']}},
		];
	},

	sext: function(lectionary){ //wisdom
		return [
			{part: 'preface', season: { $in: [lectionary.season, 'any'] } },
			{part: 'bible', passage: getPsalm('ascent', lectionary.date)},
			{_id: lectionary.collect._id},
			{part: 'creed'},
			{themes: 'end', times: {$nin:['evening', 'night']}}
		];
	},

	none: function(lectionary){ //lesson?
		return [
			{part: 'preface', season: { $in: [lectionary.season, 'any'] } },
			{part: 'bible', passage: (lectionary.lessons[1] || "1 Tim 2")},
			{themes: 'end'},
		];
	},

	vespers: function(lectionary){ //thanksgiving
		return [
			{part: 'intro', times: 'evening' },
			{part: 'bible', passage: "Psalm "+(lectionary.psalms.evening ? lectionary.psalms.evening[0] : 100) },
			{part: 'collect', themes: {$nin:['daily', 'saint']}},
			{part: 'prayer', title: /general thanksgiving/i},
			{themes: 'end', times: {$nin:['morning']}},
		];
	},

	compline: function(lectionary){ //penitence

		if(lectionary.day==="Thursday") //great litany on thursdays
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

	matins: function(lectionary){
		return [ //rest
			{part: 'intro', times: 'evening' },
			{part: 'canticle'},
			{part: 'prayer', times: {$nin:['morning']}},
			{part: 'prayer', times: 'evening', themes: 'end'},
		];
	},

	lectionary: function(lectionary){
		let all = [];
		for(let i of flatten(lectionary.lessons, lectionary.psalms))
			all.push({part: 'bible', passage: i});
		return all;
	},

	morning: function(lectionary){ 
		let dom = /(\d+)/.exec(lectionary.date)[1];
		if(!dom) dom = 1;

		return [
			{part: 'bible', passage: getPsalm('morning', dom)},
			{part: 'prayer',  $or: [
				{times: {$in:['morning', 'any']} },
				{themes:{$in:['petition'] }}
			] } ,
		];
	},

	midday: function(lectionary){ 
		let dom = /(\d+)/.exec(lectionary.date)[1];
		if(!dom) dom = 1;

		return [
			{part: 'bible', passage: getPsalm('ascent', dom)},
			{part: 'collect', title: time.getWeek(date)},
		];
	},

	evening: function(lectionary){
		let dom = /(\d+)/.exec(lectionary.date)[1];
		if(!dom) dom = 1;

		return [
			{part: 'bible', passage: getPsalm('evening', dom)},
			{part: 'prayer',  $or: [
				{times: {$in:['evening', 'night']} },
				{themes:{$in:['thanks', 'praise', 'hope', 'rest'] }}
			] } ,
		];
	},
	random: function(date){
		return [
			{ }
		];
	},
};

//index
async function getHour(hour, date){
	log.info('getHour', hour, date);

	hour = hour.toLowerCase();
	if(!partQueries[hour])
		return Promise.reject("hour not found");
	
	var today = await lectionary.getLectionary(date);
	
	let queries = partQueries[hour](today);

	if(hour==="random")
		var hourParts = await parts.getRandomParts(queries, "random"+getRandomInt(1,999))
		.catch(log.err);
	else
		var hourParts = await parts.getRandomParts(queries, date+hour)
		.catch(log.err);
	
	return Promise.resolve({
		hour: hour.charAt(0).toUpperCase() + hour.substr(1),
		title: today.shortWeek,
		season: today.season,
		date: today.date,
		parts: hourParts
	});
}

function getPsalm(type, dom){
	
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
	};

	index = Number(dom)-1;

	if(psalms[type] && psalms[type][index])
		return "psalm"+psalms[type][index];
	else
		return "psalm1";
}

function flatten(lessons, psalms){
	let ps = [];
	if(psalms.morning)
		ps = [...ps, ...psalms.morning];
	if(psalms.evening)
		ps = [...ps, ...psalms.evening];
	
	ps = ps.map(p=>"Psalm "+p);
	return [...lessons, ...ps];
}
function getRandomInt(min, max) { //max is inclusive
	return Math.random() * (max - min) + min;
 }
