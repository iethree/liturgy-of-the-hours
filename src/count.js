//count.js
//logger

var datefns = require('date-fns');

var nedb = require('nedb');
var logger = new nedb({filename: '../data/users.log', autoload: true});


exports.getCount = async function(id, page){
		
		//log this visit
		if(id!==undefined)
			logger.update({user: id} , {$set: {page: page, date: new Date()} }, {upsert: true} );
		

		Promise.resolve({
			now: await getRecent(5), //past 5 mins is here now
			recent: await getRecent(180) // past 3 hours is recent
		});
}

async function getRecent(mins){
	return new Promise((resolve, reject)=>{
		logger.count( {date: {$gt:datefns.subMinutes(mins).toISOString()} }, (err, count)=>{
			if(err)
				reject(err);
			else
				resolve(count);
		});
	});
}