self.importScripts('/js/date-fns.min.js');

const RESOURCECACHE = 'resource-cache_2020-01-27';
const HOURCACHE = 'hour-cache';

const OFFICES = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins", "Morning", "Noon", "Evening"];

function numericalDate(date=new Date()){
  return dateFns.format( date, 'YYYYMMDD');
}

// A list of local resources we always want to be cached.
const RESOURCECACHE_URLS = [
  '/',
  '/stylesheets/seasons.min.css',
  '/stylesheets/daily.min.css',
  '/stylesheets/bulma.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.11.2/webfonts/fa-solid-900.woff2',

  '/js/home-client.js',
  '/js/hour-client.js',
  '/js/date-fns.min.js',
  '/js/jquery.min.js',

  '/js/manifest.json',

  '/images/favicon.png',
  '/images/bell.png',
  '/images/clock.png',
  '/images/clockw.png',

];

//notifications

//push listener
self.addEventListener('push', function(event) {

  const title = 'Call to Prayer';
  const options = {
    body: event.data.text(),
    icon: '/images/bell.png',
    badge: '/images/clockw.png',
    url: '/hour/'+event.data.text().toLowerCase(),
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
  if (Notification.permission == 'granted')
    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {  

  
  console.log(event.notification);

  if (event.action === 'snooze')
    snooze(event);
  else 
    clients.openWindow("/hour/"+event.notification.body.toLowerCase());
  
  event.notification.close();
  
}, false);

function getDays(num){
   var today = new Date();
   var hrs = [];

   for(let d=0; d<num; d++){
      let day = numericalDate( dateFns.addDays(today, d) );

      for(let o of OFFICES)
         hrs.push(`/hour/${o}/${day}/`);
   }
   return hrs;
}

function snooze(event){
	console.log('snooze');
	
	self.registration.pushManager.getSubscription()
    .then((subscription) => {
      console.log(subscription)
      var data = {
        subscription: JSON.stringify(subscription),
        type: 'snooze'
      };

      fetch('/snooze/', {
        method: 'PUT',

      });

	});
}

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RESOURCECACHE)
      .then(cache => cache.addAll(RESOURCECACHE_URLS))
      .then(self.skipWaiting())
  );
  event.waitUntil(
    caches.open(HOURCACHE)
      .then( cache=>cache.addAll( getDays(14) ) )
      .then( self.skipWaiting() )
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [RESOURCECACHE, HOURCACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for resources from a cache.
self.addEventListener('fetch', event => {
  //ignore extension and post requests
  if(event.request.url.includes('chrome-extension') || event.request.method==="POST")
    event.respondWith(
       fetch(event.request).catch(e=>console.log)
    );

  //for everything else, cache falling back to network
  else
    event.respondWith(
      caches.match(event.request).then((response)=>{
        return response || fetch(event.request);
      })
    );
});