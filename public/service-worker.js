//service worker for liturgy of the hours

var resourceCache = 'resources';
var contentCache = 'content';
// self.importScripts('/js/date-fns.min.js');
// self.importScripts('/js/jquery.min.js');

var resourceList = [
	'https://use.fontawesome.com/releases/v5.5.0/css/all.css',
	'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.min.css',
	'/stylesheets/seasons.css',
	'/stylesheets/daily.css',
	
	'images/favicon.png',
	
	'/js/date-fns.min.js',
];

//cache on install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(resourceCache).then(function(cache) {
      return cache.addAll(resourceList);
    })
  );
});

//cache falling back to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
	  
	  return response || fetch(event.request);
    })
  );
});
