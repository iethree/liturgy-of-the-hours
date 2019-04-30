//settings.js

//push code
const applicationServerPublicKey = 'BDGjlxI-5G_q0k910Oez3eCAKlk9CV0t3yY1y4ypeh041Rv4Wgi-EwSpsVvUc4b4m7-dv6tfj6ClyGNTSAxQ3xQ';

const subscribeButton = document.getElementById('subscribe');
const sliderDiv = document.getElementById('sliders');
var sliders = $(".slider");

let isSubscribed = false;
let swRegistration = null;

if ('serviceWorker' in navigator  && 'PushManager' in window) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
	  swRegistration = registration;
      initializeUI();
	  
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function initializeUI() {
  
  subscribeButton.addEventListener('click', function() {
    subscribeButton.disabled = true;
    if (isSubscribed) {
	 unsubscribeUser();
    } else {
      subscribeUser();
    }
  });
  
  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
      console.log('User IS subscribed.');
	  loadTimes();
    } else {
      console.log('User is NOT subscribed.');
    }

    updateBtn();
  });
}

var times = { //notification times
	saved: {
		'lauds': 6, // 5-8
		'terce': 10, //8-11
		'sext': 12, //11-2
		'none': 15, //2-5
		'vespers': 18, // 5-8
		'compline': 21 // 8-11
	},
	base: {
		'lauds': 5, // 5-8
		'terce': 8, //8-11
		'sext': 11, //11-2
		'none': 14, //2-5
		'vespers': 17, // 5-8
		'compline': 20 // 8-11
	}
};



sliders.change(function(e){
	
	hour = this.getAttribute('hour').toLowerCase();
	newtime = dateFns.setHours(new Date(), Number(this.value)+times.base[hour]);
	
	times.saved[hour] = Number(dateFns.format(newtime, 'H'));
	console.log(times.saved);
	
	$(this).parent().find('.time-label').html(dateFns.format(newtime, 'h a'));
	$('#save').removeClass('hidden');
});

function loadTimes(){
	//load from local storage
	if(localStorage.hasOwnProperty('times')){
		times.saved = JSON.parse(localStorage.getItem('times'));
		
		//set sliders
		for( i of Object.keys(times.saved) ){
			pos = times.saved[i] - times.base[i];
			$('input[hour=\"'+i+'\"]').val(pos);
			newtime = dateFns.setHours(new Date(), times.saved[i]);
			$('span[hour=\"'+i+'\"]').html(dateFns.format(newtime, 'h a'));
		}
	}
}

$('#save').click(function(e){
	saveTimes();
	$('#save').addClass('hidden');
});

function saveTimes(){
	//save to local storage
	localStorage.setItem('times', JSON.stringify(times.saved));
	//send to server
}

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed.');

    updateSubscriptionOnServer('sub', subscription, times);

    isSubscribed = true;

    updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    updateBtn();
  });
}

function unsubscribeUser() {
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    if (subscription) {
      updateSubscriptionOnServer('unsub', subscription);
	  return subscription.unsubscribe();
    }
  })
  .catch(function(error) {
    console.log('Error unsubscribing', error);
  })
  .then(function() {
	

    console.log('User is unsubscribed.');
    isSubscribed = false;

    updateBtn();
  });
}

function updateBtn() {
   subscribeButton.classList.remove('is-loading');
   if (Notification.permission === 'denied') {
    subscribeButton.textContent = 'Push Messaging Blocked.';
    subscribeButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    subscribeButton.innerHTML = '<i class = "fa fa-envelope"></i> <span> &nbsp; Disable Push Messaging </span>';
	sliderDiv.classList.remove('hidden');
	
  } else {
    subscribeButton.innerHTML = '<i class = "fa fa-envelope"></i> <span> &nbsp; Enable Push Messaging </span>';
	sliderDiv.classList.add('hidden');
  }

  subscribeButton.disabled = false;
}

function updateSubscriptionOnServer(action, subscription, times) {
  // Send subscription to application server
  var data = {
	subscription: JSON.stringify(subscription),
	times: times.saved || '',
	type: action //sub or unsub
  };
    
  $.ajax({
		url: "/subscribe",
		type: 'POST',
		data: data,
		done: function(result){ console.log(result); }
	});
}