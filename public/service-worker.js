self.importScripts('/js/date-fns.min.js');

const RESOURCECACHE = 'resource-cache_2020-01-20';
const RUNTIME = 'runtime';
const HOURCACHE = 'hour-cache';

const OFFICES = ["Lauds", "Terce", "Sext", "None", "Vespers", "Compline", "Matins"];

function numericalDate(date=new Date()){
  return dateFns.format( date, 'YYYYMMDD');
}

// A list of local resources we always want to be cached.
const RESOURCECACHE_URLS = [
  'index.html',

  '/stylesheets/seasons.min.css',
  '/stylesheets/daily.min.css',

  '/js/home-client.js',
  '/js/hour-client.js',
  '/js/date-fns.min.js',
  '/js/jquery.min.js',

  'https://use.fontawesome.com/releases/v5.5.0/css/all.css'
];

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
  const currentCaches = [RESOURCECACHE, RUNTIME, HOURCACHE];
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

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  if(event.request.url.includes('chrome-extension') || event.request.method==="POST")
    return fetch(event.request).catch(e=>console.log);
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME).then(cache => {
        return fetch(event.request).then(response => {
          // Put a copy of the response in the runtime cache.
          return cache.put(event.request, response.clone()).then(() => {
            return response;
          });
        })
        .catch(e=>console.log);
      });
    })
  );
});