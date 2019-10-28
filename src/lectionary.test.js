//lectionary test
const lectionary = require('./lectionary');
const log = require('logchalk');

lectionary.lessons('20191028')
.then(r=>log.info(r))
.catch(log.err);