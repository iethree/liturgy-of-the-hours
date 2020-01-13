//service worker for liturgy of the hours

var resourceCache = 'resources';
var contentCache = 'content';
self.importScripts('/js/date-fns.min.js');
// self.importScripts('/js/jquery.min.js');

var resourceList = [
	'https://use.fontawesome.com/releases/v5.5.0/css/all.css',
	'https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.2/css/bulma.min.css',
	'/stylesheets/seasons.css',
	'/stylesheets/daily.css',
	'/stylesheets/bulma-tooltip.min.css',
	
	'/js/home-client.js',
	'/js/home-client-test.js',
	'/js/bible-client.js',
	'/js/hour-client.js',
	
	'images/favicon.png',
	
	'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js',
	'/js/date-fns.min.js',
];

var contentList =[
	'/'
];

//push listener
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Call to Prayer';
  const options = {
    body: event.data.text(),
    icon: '/images/bell.png',
    badge: '/images/clockw.png',
	actions: [
		{
			action: 'go',
			title: 'Go',
			icon:  '/images/go.png'
		},
		{
			action: 'snooze',
			title: 'Snooze 15m',
			icon:  '/images/snooze.png'
		}
	]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', function(event) {  
  var messageId = event.notification.data;

  event.notification.close();

  if (event.action === 'snooze') {  
    snooze(event);
  }  
  else {  
    clients.openWindow("/messages?reply=" + messageId);  
  }  
}, false);

//cache on install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(resourceCache).then(function(cache) {
      return cache.addAll(resourceList);
    })
  );
  event.waitUntil(
    caches.open(contentCache).then(function(cache) {
      return cache.addAll(contentList);
    })
  );
});

//cache falling back to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if(response)
		console.log('found in cache: ',event.request.url);
	  else
		  console.log('not in cache',event.request.url);
	  
	  return response || fetch(event.request);
    })
  );
});

function snooze(event){
	console.log('snooze');
	//setTimeout for a new notification on the server
	
	self.registration.pushManager.getSubscription()
		.then(function(subscription) {
	
	var data = {
	subscription: JSON.stringify(subscription),
	type: 'snooze' //sub or unsub
	};
	 
	 // $.ajax({
		// url: "/subscribe",
		// type: 'POST',
		// data: data,
		// done: function(result){ console.log(result); }
	// });
	});
}
