const express = require('express');
const router = express.Router();
const log = require('logchalk');

const parts = require('./parts.js');
const hours = require('./hours.js');
const count = require('./count.js');
const lectionary = require('./lectionary.js');
const push = require('./push.js');

const time = require('./time');

/** hour routes */

router.get('/', async (req, res, next) => {
	let lect = await lectionary.getLectionary();
	if(!lect) lect.season = "ordinary";
	
   res.render('daily-index', {
		title: 'Liturgy of the Hours',
		date: time.format.short(),
		season: lect.season.toLowerCase()
	});
});

router.get('/hour/:hour/:date?', async(req, res, next)=>{

	let date = time.format.numerical(req.params.date);
	let results = await hours.getHour(req.params.hour, date).catch(log.err);
	res.render('hour', results);
});

router.get('/season/:date?', async(req, res, next)=>{
	let date = req.params.date ? time.format.numerical(req.params.date) : time.format.numerical(new Date());
	let lect = await lectionary.getLectionary(date);
	res.send(lect.season);
});

router.get('/lectionary/:date?', async(req, res, next)=> {
	
	let date = time.format.numerical(req.params.date);
	let results = await hours.getHour('lectionary', date).catch(log.err);
	res.render('lectionary', results);
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
	console.log(results)
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

router.post('/addTag', async(req, res, next)=>{

	let result = await parts.addTag(req.body).catch(log.err);
	if(result)
		res.sendStatus(200);
	else
		res.sendStatus(400);
});

router.post('/removeTag', async(req, res, next)=>{

	let result = await parts.removeTag(req.body).catch(log.err);
	if(result)
		res.sendStatus(200);
	else
		res.sendStatus(400);
});

router.post('/subscribe', async(req, res, next)=>{
	log.debug(req.body)
	push.subscribe(req.body);
	res.sendStatus(201);
});

module.exports = router;
