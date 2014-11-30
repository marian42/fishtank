function EventEditor() {
	this.day = new Array;
	this.event = null;
	for (var i = 0; i < 7; i++)
		this.day[i] = false;
	this.food = new Array;
	for (var i = 0; i < 6; i++)
		this.food[i] = false;
		
	this.updateFoodSelector();
}

EventEditor.prototype.updateFoodSelector = function() {
	for (var i = 0; i < 6; i++) {
		if (this.food[i])
			$('#foodselector' + i)[0].classList.add("buttonselected");
		else $('#foodselector' + i)[0].classList.remove("buttonselected");
	}
	var all = true;
	for (var i = 0; i < 6; i++)
		if (this.food[i] == false)
			all = false;
	if (all)
		$('#foodselector6')[0].classList.add("buttonselected");
	else $('#foodselector6')[0].classList.remove("buttonselected");
}

EventEditor.prototype.updateDaySelector = function() {
	for (var i = 0; i < 7; i++) {
		if (this.day[i])
			$('#dayselector' + i)[0].classList.add("buttonselected");
		else $('#dayselector' + i)[0].classList.remove("buttonselected");
	}
	var all = true;
	for (var i = 0; i < 7; i++)
		if (this.day[i] == false)
			all = false;
	if (all)
		$('#dayselector7')[0].classList.add("buttonselected");
	else $('#dayselector7')[0].classList.remove("buttonselected");
}

EventEditor.prototype.reset = function() {
	this.event = -1;
	this.update();
}

EventEditor.prototype.update = function() {
	for (var i = 0; i < 7; i++)
		this.day[i] = true;
	for (var i = 0; i < 6; i++)
		this.food[i] = true;
	eventEditor.type = 0;
	$('#eventhour')[0].value = '15';
	$('#eventminute')[0].value = '00';
	$('#eventmaxsaturation')[0].value = '1';
	$('#eventminamount')[0].value = '0';
	$('#eventmaxamount')[0].value = '2';
	$('#eventlight')[0].checked = true;
	$('#btnediteventdelete').hide();
	
	if (this.event == -1) {
		$('#editeventtitle')[0].innerHTML = 'Add event';
		$('#ddeventtypecurrent')[0].innerHTML = 'Feed';
		$('#editeventfeed')[0].style.display = 'block';
		$('#editeventlight')[0].style.display = 'none';
		$('#eventstatus')[0].innerHTML = 'New Event';
	}
	else {
		var event = eventView.getMarker(this.event).event;
		eventEditor.type = event.type;
		var events = ['Feed','Light','Take picture'];
		this.day = explodeBinArray(event.day,7);
		this.food = explodeBinArray(event.food,6);
		$('#editeventtitle')[0].innerHTML = 'Edit event';
		$('#btnediteventdelete').show();
		$('#ddeventtypecurrent')[0].innerHTML = events[event.type];
		$('#editeventfeed')[0].style.display = (event.type == 0 ? 'block' : 'none');
		$('#editeventlight')[0].style.display = (event.type == 1 ? 'block' : 'none');
		$('#eventhour')[0].value = event.hour;
		$('#eventminute')[0].value = event.minute;		
		$('#eventstatus')[0].innerHTML = event.status;
		
		if (event.type == 0) {		
			$('#eventmaxsaturation')[0].value = event.maxSaturation;
			$('#eventminamount')[0].value = event.minAmount;
			$('#eventmaxamount')[0].value = event.maxAmount;
		}
		if (event.type == 1) 
			$('#eventlight')[0].checked = event.value;
		$('#btnediteventdelete').show();
	}
	this.updateDaySelector();
	this.updateFoodSelector();	
}

EventEditor.prototype.getDayInt = function() {
	var result = 0;
	var p = 1;
	for (var i = 0; i < 7; i++) {
		if (this.day[i])
			result += p;
		p *= 2;
		}
	return result;
}

EventEditor.prototype.getFoodInt = function() {
	var result = 0;
	var p = 1;
	for (var i = 0; i < 6; i++) {
		if (this.food[i])
			result += p;
		p *= 2;
		}
	return result;
}

eventEditor = new EventEditor();

function foodselectorclick(event) {
	var index = $(event.target.parentNode.children).index(event.target);
	if (index == 6) {
		var all = true;
		for (var i = 0; i < 6; i++)
			if (eventEditor.food[i] == false)
				all = false;
		for (var i = 0; i < 6; i++)
			eventEditor.food[i] = !all;
	}
	else eventEditor.food[index] = !eventEditor.food[index];
	eventEditor.updateFoodSelector();

}

function dayselectorclick(event) {
	var index = $(event.target.parentNode.children).index(event.target);
	if (index == 7) {
		var all = true;
		for (var i = 0; i < 7; i++)
			if (eventEditor.day[i] == false)
				all = false;
		for (var i = 0; i < 7; i++)
			eventEditor.day[i] = !all;
	}
	else eventEditor.day[index] = !eventEditor.day[index];
	eventEditor.updateDaySelector();
}

$('#btnaddevent').click(function() {
	eventEditor.reset();
	if (!$('#editevent').is(":visible")) {
		$('#editevent').show(400);
	}
	else {
		$('#editevent').hide(400);
	}
});

$('#btnediteventcancel').click(function() {
	$('#editevent').hide(400);
});

$('#btnediteventdelete').click(function() {
	$('#eventbtnsubmitloading').show();
	$.ajax({
		type: "POST",
		url:  network.server + 'api/deleteevent',
		data: "id=" + eventEditor.event,		
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$('#eventbtnsubmitloading').hide();
			$('#editevent').hide(400);
			
		},
		error: function(){
			$('#eventbtnsubmitloading').hide();
			alert("error!");
		}
	});
});

$('#btnediteventsubmit').click(function() {
	$('#eventbtnsubmitloading').show();
	$.ajax({
		type: "POST",
		url:  network.server + 'api/updateevent',
		data: "type=" + eventEditor.type + "&event=" + eventEditor.event + "&day=" + eventEditor.getDayInt() + "&hour=" + $('#eventhour')[0].value + '&minute=' + $('#eventminute')[0].value + '&food=' + eventEditor.getFoodInt() + '&maxsaturation=' + $('#eventmaxsaturation')[0].value 
				+ '&minamount=' + $('#eventminamount')[0].value + '&maxamount=' + $('#eventmaxamount')[0].value + '&value=' + $('#eventlight')[0].checked,		
		success: function(data) {
			if (data == 'loginrequired')
				alert('You need to be logged in to do this.');
			$('#eventbtnsubmitloading').hide();
			$('#editevent').hide(400);
			
		},
		error: function(){
			$('#eventbtnsubmitloading').hide();
			alert("error!");
		}
	});
});

