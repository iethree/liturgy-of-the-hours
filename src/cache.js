//cache.js

var NodeCache = require('node-cache');
var ncache = new NodeCache();
var chalk = require('chalk');

module.exports = function(time){ //time in seconds
	
	return function(req, res, next){	
		let key = '_express_'+req.originalUrl || req.url;
		let cachedBody = ncache.get(key);
		
		if (cachedBody){
			console.log(chalk.cyan("pulling from cache "+key));
			res.send(cachedBody);
			return;
		}
		else{
			res.sendResponse = res.send;
			res.send = function(body){
				console.log(chalk.cyan("saving to cache "+key));
				ncache.set(key, body, time);
				res.sendResponse(body);
			}
			next();
		}
	}
}