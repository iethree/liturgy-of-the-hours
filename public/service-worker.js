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
        title: 'Go'
      }
    ]
  };
  if (Notification.permission == 'granted')
    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {  

  let date = new Date();
  clients.openWindow("/hour/"+event.notification.body.toLowerCase()+"/"+numericalDate());
  
  event.notification.close();
  
}, false);

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
