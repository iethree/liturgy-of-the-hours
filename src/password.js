// probably terribly insecure super simple password library

require('dotenv').config();
var moment = require('moment');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

var algorithm = 'aes-256-gcm';
var password = process.env.PASSWORD;
var iv = Buffer.from(crypto.randomBytes(16));

tempToken = process.env.TOKEN;

function isAuthorized(cookie){
	
	if(validkey==cookie)
		return true;
	else
		return false;
	
}

function getToken(password){
	
	return tempToken+"__"+moment().add(2,'h');
	
}

exports.checkPassword= function(req, res, next){

	bcrypt.compare(req.body.password, process.env.PASS_WORD, function(err, response) {
		if(err)
			console.log(err);
		if(!response)
			res.redirect('/login/fail');
		else{
			token = getToken(password);
			req.cookies['authenticated'] = token;
			res.cookie('authenticated', token);
			res.redirect('/list');
		}
			
	});
}

exports.checkToken = function(req, res, next){
	
	try{
		if(!req.cookies['authenticated']) //check if cookie is set
			res.redirect('/login');
		
		cookie = req.cookies['authenticated']; //decrypt cookie

		pw = cookie.match(/.+?(?=__)/);
		exp = cookie.match(/(?<=__).*/);
		
		if (pw!=tempToken) //check for correct PW
			res.redirect('/login');
		
		if(moment(exp)>moment()) //check if token has expired
			res.redirect('/login');
		
		console.log("user has correct token");
		next();
	}
	catch(err){
		console.log(err);
		res.redirect('/login');
	}
};


function encrypt(text) {
 let iv = crypto.randomBytes(IV_LENGTH);
 let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
 let encrypted = cipher.update(text);

 encrypted = Buffer.concat([encrypted, cipher.final()]);

 return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
 let textParts = text.split(':');
 let iv = new Buffer(textParts.shift(), 'hex');
 let encryptedText = new Buffer(textParts.join(':'), 'hex');
 let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
 let decrypted = decipher.update(encryptedText);

 decrypted = Buffer.concat([decrypted, decipher.final()]);

 return decrypted.toString();
}
