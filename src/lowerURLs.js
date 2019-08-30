//lowerURLs

//middleware to make all URLs lowercase
module.exports = function(req, res, next){	
	req.originalUrl = req.originalUrl.toLowerCase();
	req.url = req.url.toLowerCase();
	next();
}