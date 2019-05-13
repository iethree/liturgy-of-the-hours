//daily-app.js
require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cache = require('./cache.js');
var lowerURLs = require('./lowerURLs.js');

var http = require('http');
var dailyapp = express();
var dailyindex = require('./daily-index.js');

dailyapp.use(logger('dev'));

dailyapp.set('views', path.join(__dirname, '../views'));
dailyapp.set('view engine', 'jade');
dailyapp.use(bodyParser.urlencoded({ extended: true }));
dailyapp.use(favicon(path.join(__dirname, '../public/images', 'favicon.png')));
dailyapp.use(express.static(path.join(__dirname, '../public')));
//dailyapp.use(['/edit/', '/list/'], password.checkToken);
dailyapp.use(lowerURLs);
dailyapp.use('/hour',cache(60*60)); //cache hours for 1 hour

dailyapp.use('/', dailyindex);

dailyapp.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.redirect('/');
});

dailyapp.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

dailyapp.listen(3001, function(){console.log("prayer app on port 3001");});

module.exports = dailyapp;
