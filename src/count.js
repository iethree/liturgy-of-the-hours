//count.js
//logger

var moment = require('moment');

var nedb = require('nedb');
var logger = new nedb({filename: '../data/users.log', autoload: true});


exports.getCount = function(data, callback){
		
		//log this visit
		if(data.id!==undefined)
			logger.insert({user: data.id, page: data.page, date: new Date().valueOf()});
		
		getRecent(5, function(result){ //past 5 minutes is here now
			
			var hereNow = countUnique(result);
			
			getRecent(360, function(result){ //past 6 hours is here recent
				
				var hereRecent = countUnique(result);

				callback({
					now: hereNow, 
					recent: hereRecent-hereNow
				});
			});
		});
}

//test code
// exports.getCount({id: '999999', page: "Test"}, function(val){
	// console.log(val);
// });

function getRecent(mins, callback){
	
	logger.find( {date: {$gt:(new Date - mins*60*1000) } },
	
	function(err, results){
		if(err)
			console.log(err);
		else
			callback(results);
	});
}

function countUnique(list) {
	//count unique user values
	list = list.map(val=>val.user);
	list = new Set(list);

	return list.size;
}