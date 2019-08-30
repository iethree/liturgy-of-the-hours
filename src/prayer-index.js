var express = require('express');
var router = express.Router();

var bible = require('./bible.js');
var parts = require('./parts.js');
var hours = require('./hours.js');
var count = require('./count.js');
const log = require('./log.js');
var time = require('./time');

/** CG routes */

router.get('/cg', function(req, res, next) {

	res.render('cg-index', {
	 title: 'Daily Prayer',
	 date: time.format.short(),
	 season: time.getSeason()
	 });
 });

 router.get('/cg/:hour/:date?', async(req, res, next)=> {

	let date = time.format.numerical(req.params.date);
	let results = await hours.getHour(req.params.hour, date).catch(log.err);
	res.render('cg-hour', results );
 });


router.get('/', function(req, res, next) {

  res.render('daily-index', {
	title: 'Liturgy of the Hours',
	date: time.format.short(),
	season: time.getSeason()
	});
});

router.get('/hour/:hour/:date?', async(req, res, next)=>{

	let date = time.format.numerical(req.params.date);
	let results = await hours.getHour(req.params.hour, date).catch(log.err);
	res.render('hour', results);
});

router.get('/lectionary/:date?', async(req, res, next)=> {
	
	let date = time.format.numerical(req.params.date);
	let results = await hours.getHour('lectionary', date).catch(log.err);
	res.render('lectionary', results);
});

router.get('/bible/:query?', async (req, res, next) =>{

	if(!req.params.query)
		res.render('bible',{title: "Bible", text:""});
	else{
		let results = await bible.get(req.params.query).catch(log.err).catch(log.err);
		res.render('bible', response);
	}
});

router.post('/count', async (req, res, next)=>{
	
	var cnt = await count.getCount(req.body.id, req.body.page).catch(log.err);
	log.info('count', cnt);
	res.status(200).send(cnt);
});

//random proverb
router.get('/rp', async(req, res, next) =>{

	let response = await bible.randomProverb().catch(log.err);
	res.render('collect', response);
});

router.post('/rp', async(req, res, next)=>{

	let response = await bible.randomProverb().catch(log.err);
	res.status(200).send(response.title+" - "+response.text);
});

// part dumps

router.get('/list', async(req, res, next)=>{

	let results = await parts.getPartList().catch(log.err);
	res.render('parts-index', {parts: results});
});

router.get('/list/:part', async(req, res, next)=>{
	const taglist = {
		times: ['morning', 'midday', 'evening', 'night', 'any'],
		themes: ['petition', 'praise', 'thanks', 'penitence', 'mourning', 'end', 'rest', 'hope', 'lament', 'community', 'beginning', 'death'],
	};

	let results = await parts.showAllParts({part: req.params.part});
	res.render('parts-list', {title: req.params.part, parts: results, taglist: taglist});
});

router.post('/update', async(req, res, next)=>{

	let result = await parts.update(req.body.id, req.body.updates).catch(log.err);
	if(result)
		res.sendStatus(200);
	else
		res.sendStatus(400);
});

module.exports = router;
