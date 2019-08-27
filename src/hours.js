//hours.js

const office = require('./office.js');
const loadJsonFile = require('load-json-file');
const moment = require('moment');
const md = require('markdown-it')({html: true});

(async () => {
    const lectionary = await loadJsonFile('./data/readings/dol-year-1.min.json');
    //=> {foo: true}
})();

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
			{part: 'bible', passage: getPsalm('praise', date)},
			{part: 'prayer', times: 'morning'},
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
			{part: 'bible', passage: getPsalm('thanks', date)},
			{part: 'prayer', times: 'evening'},
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

	var thanksPsalms =
	["65", "67", "75", "107", "124", "136", "18", "21", "30", "32",
	"34", "40:1-11", "66:13-20", "92", "108", "116", "118", "138", "8", "105", "106",
	"135", "136", "11", "16", "23", "27", "62", "63", "91", "121", "125", "131"];

	var praisePsalms =
	["8", "19:1-6", "33", "66:1-12", "67", "95", "100", "103", "104", "111",
	"113", "114", "117", "145", "146", "147", "148", "149", "150", "1",
	"36", "37", "49", "73", "112", "127", "128", "133", "19:7-14", "50", 2];

	var ascentPsalms =
	["119.1-8", "119.9-16", "119.17-24", "119.25-32", "119.33-40", "119.41-48", "119.49-56",
	"119.57-64", "119.65-72", "119.73-80", "119.81-88", "119.89-96", "119.97-104", "119.105-112",
	"119.113-120", "119.121-128", "119.129-136", "119.137-144", "119.145-152", "119.153-160",
	"119.161-168", "119.169-176", "121", "122", "123, 124", "125, 126", "127", "128", "129",
	"130", "131", "133"];

	index = moment(date).format("D")-1;

	if(type == "praise")
		return "psalm"+praisePsalms[index];
	if(type == "thanks")
		return "psalm"+thanksPsalms[index];
	if(type == "ascent")
		return "psalm"+ascentPsalms[index];
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
