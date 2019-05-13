var express = require('express');
var router = express.Router();

var bible = require('./bible.js');
var office = require('./office.js');
var hours = require('./hours.js');
var count = require('./count.js');
//var notify = require('./notify.js');

var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('daily-index', {
	title: 'Liturgy of the Hours',
	date: moment().format("MMMM D"),
	time: hours.findNow(),
	season: office.findSeason()
	});
});

router.get('/test', function(req, res, next) {

  res.render('daily-index-test', {
	title: 'Liturgy of the Hours',
	date: moment().format("MMMM D"),
	time: hours.findNow(),
	season: office.findSeason()
	});
});

//notification settings
router.get('/settings', function(req, res, next) {

  res.render('settings', {title: 'Liturgy of the Hours | Settings' });
});
//notification subscription handler
router.post('/subscribe', function(req, res, next) {
  console.log(req.body);
  notify.updateSubscription(req.body, function(result){

	 res.status(200).send(result);
  });
});

router.get('/hour/:hour/:date?', function(req, res, next) {

	if(moment(req.params.date).isValid()) //if a date is provided
		date = moment(req.params.date).format("YYYYMMDD");
	else //otherwise, use today's date
		date = moment().format("YYYYMMDD");

	hours.getHour(req.params.hour, date, function(parts){

		res.render('hour', parts);
	});
});


router.get('/lectionary/:date?', function(req, res, next) {
	if(req.params.date)
		date = moment(req.params.date).format("YYYYMMDD");
	else
		date = moment().format("YYYYMMDD");

	hours.getHour('lectionary', date, function(parts){

		res.render('lectionary', parts);
	});
});

// router.get('/list/', function(req, res, next) {

	// office.getPartList(function(parts){

		// res.render('part-list',
			// {title: "Part List",
			// parts: parts});
	// });
// });

// router.get('/list/:part', function(req, res, next) {

	// office.getPartDump(req.params.part, function(parts){

		// res.render('part-dump',
			// {title: "Parts: "+req.params.part,
			// parts: parts
			// });
	// });
// });

// router.get('/listdump', function(req, res, next) {

  // office.dumpAll(req.params.part, function(parts){

		// res.send(parts);
	// });
// });

// router.get('/edit/:id', function(req, res, next) {

	// if(req.params.id=='new'){
		// res.render('full-editor',
		// { title: "New Part",
		  // part:{
			  // id: 'new', part: '', title: '', subtitle: '', source: '', text: '', season: [], themes: [], times: []
		  // }
		// });
	// }
	// else{

		// office.getById(req.params.id).then(function(part){

			// res.render('full-editor',
				// {	title: "Part Editor",
					// part: part
				// });
		// }).catch(function(err){ console.log ("error!");});
	// }

// });

router.post('/db/:func?', function(req, res, next) {

	console.log("db op: "+req.params.func);

	office.dbOps(req.params.func, req.body, function(result){

		res.status(200).send(result);
	});

});

// router.get('/login/:status?', function(req, res, next) {

// res.render('login', {status: req.params.status});

// });

// router.post('/login/check', password.checkPassword);

router.get('/morning/:date?', function(req, res, next) {

	office.morning(function(response){

		res.render('morning-prayer', response);
	});
});

router.get('/bible/:query?', function(req, res, next) {

	if(!req.params.query)
		res.render('bible',{title: "Bible", text:""});
	else
		bible.get(req.params.query)
			.then(function(response){
				res.render('bible', response);
			});
});


router.post('/count', function(req, res, next) {

  count.getCount(req.body, function(results){
	  console.log("count: "+new Date());
	  res.status(200).send({now: results.now, recent: results.recent});
  });
});

//random proverb
router.get('/rp', function(req, res, next) {

  bible.randomProverb(function(response){
		res.render('collect', response);
	});
});



router.post('/rp', function(req, res, next) {

  bible.randomProverb(function(response){
		res.status(200).send(response.title+" - "+response.text);
	});
});

module.exports = router;
