highlight();
loadVisitedToday();
//highlight button with correct time
function highlight(){
	var season = document.querySelector("h1").classList[0];
	var time = findNow();
	
	document.querySelector("#"+time).classList.add(season);
}

function findNow(){
	var hour = dateFns.format(new Date, 'H');

	if(hour >= 4 && hour < 11)
		return "Morning";
	if(hour >= 11 && hour < 17)
		return "Midday";
	else
		return "Evening";
}

function loadVisitedToday(){
	
	if (localStorage.today && localStorage.offices){ //if viewed data is there
		if(dateFns.isToday(localStorage.today)){ //if data is for today
			
			todayOffices = localStorage.offices.split(',');
			
			for(cnt=0;cnt<todayOffices.length;cnt++){
				
            var check = document.createElement('i');
            check.classList.add('fa', 'fa-check', 'done-check');

            let btn = document.querySelector("#"+todayOffices[cnt]);
				if(btn)
				   btn.appendChild(check);
			}
      }
      else{
         localStorage.today = new Date();
         localStorage.offices = '';
      }
         
	}
}