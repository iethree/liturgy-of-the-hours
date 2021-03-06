//daily-app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const lowerURLs = require('./lowerURLs.js');
const nunjucks = require('nunjucks');

const dailyapp = express();
const dailyindex = require('./prayer-index.js');
const PORT = process.env.PORT || 3001;

dailyapp.use(logger('dev'));

dailyapp.set('views', path.join(__dirname, '../views'));
dailyapp.set('view engine', 'nunjucks');

nunjucks.configure('views', {
  autoescape: true,
  express: dailyapp
});

dailyapp.use(bodyParser.json());
dailyapp.use(bodyParser.urlencoded({ extended: true }));

dailyapp.use(express.static(path.join(__dirname, '../public')));
dailyapp.use(lowerURLs);
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
  res.render('error', err.message);
});

dailyapp.listen(PORT, ()=>console.log("prayer app on port "+PORT));

module.exports = dailyapp;
