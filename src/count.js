//count.js - logger

var datefns = require('date-fns');
var nedb = require('nedb');
var logger = new nedb({filename: 'data/users.log', autoload: true});

exports.getCount = async function(id, page){
	console.log(id, page);
	return new Promise((resolve, reject)=>{
		logger.update({user: id} , {$set: {user: id, page: page, date: new Date().toISOString()}, $inc: {visits: 1}}, {upsert: true}, async (err, result)=>{
			let now = await getRecent(5);
			let recent = await getRecent(180) - now;
			resolve({
				now: now, //past 5 mins is here now
				recent: recent // past 3 hours is recent
			});
		});
	});
}

async function getRecent(mins){
	return new Promise((resolve, reject)=>{
		logger.count( {date: {$gt:datefns.subMinutes(new Date(), mins).toISOString()} }, (err, count)=>{
			if(err)
				reject(err);
			else
				resolve(count);
		});
	});
}