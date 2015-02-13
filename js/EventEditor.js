var EventEditor = {
	day: new Array,
	food: new Array,
	event: null,
	
	setup: function() {
		for (var i = 0; i < 7; i++)
			this.day[i] = false;	
		for (var i = 0; i < 6; i++)
			this.food[i] = false;
		this.updateFoodSelector();
		
		$('#btnaddevent')[0].onclick = this.btnAddEventClick;
		$('#btnediteventcancel')[0].onclick = this.btnEditEventCancelClick;
		$('#btnediteventdelete')[0].onclick = this.btnEditEventDeleteClick;
		$('#btnediteventsubmit')[0].onclick = this.btnEditEventSubmitClick;
		
		$("#ddeventtype .dropdown-menu li a").click( function(event) {EventEditor.dropDownEventTypeClick(this); event.preventDefault();});
	},
	
	updateFoodSelector: function() {
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
	},
	
	updateDaySelector: function() {
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
	},
	
	reset: function() {
		this.event = -1;
		this.update();
	},
	
	update: function() {
		for (var i = 0; i < 7; i++)
			this.day[i] = true;
		for (var i = 0; i < 6; i++)
			this.food[i] = true;
		EventEditor.type = 0;
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
			var event = EventView.getMarker(this.event).event;
			EventEditor.type = event.type;
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
	},
	
	getDayInt: function() {
		var result = 0;
		var p = 1;
		for (var i = 0; i < 7; i++) {
			if (this.day[i])
				result += p;
			p *= 2;
			}
		return result;
	},
	
	getFoodInt: function() {
		var result = 0;
		var p = 1;
		for (var i = 0; i < 6; i++) {
			if (this.food[i])
				result += p;
			p *= 2;
			}
		return result;
	},
	
	foodSelectorClick: function(event) {
		var index = $(event.target.parentNode.children).index(event.target);
		if (index == 6) {
			var all = true;
			for (var i = 0; i < 6; i++)
				if (this.food[i] == false)
					all = false;
			for (var i = 0; i < 6; i++)
				this.food[i] = !all;
		}
		else this.food[index] = !this.food[index];
		this.updateFoodSelector();
	},
	
	daySelectorClick: function(event) {
		var index = $(event.target.parentNode.children).index(event.target);
		if (index == 7) {
			var all = true;
			for (var i = 0; i < 7; i++)
				if (this.day[i] == false)
					all = false;
			for (var i = 0; i < 7; i++)
				this.day[i] = !all;
		}
		else this.day[index] = !this.day[index];
		this.updateDaySelector();
	},
	
	btnAddEventClick: function() {
		EventEditor.reset();
		if (!$('#editevent').is(":visible")) {
			$('#editevent').show(400);
		}
		else {
			$('#editevent').hide(400);
		}
	},
	
	btnEditEventCancelClick: function() {
		$('#editevent').hide(400);
	},
	
	btnEditEventDeleteClick: function() {
		if (!Status.checkLogin())
			return;
	
		$('#eventbtnsubmitloading').show();
		$.ajax({
			type: "POST",
			url: 'api/deleteevent',
			data: {id: EventEditor.event},
			success: function(data) {
				$('#editevent').hide(400);
			},
			complete: function(data){
				$('#eventbtnsubmitloading').hide();
				Network.onRequestComplete(data);
			}
		});
	},
	
	btnEditEventSubmitClick: function() {
		if (!Status.checkLogin())
			return;	
		
		$('#eventbtnsubmitloading').show();
		$.ajax({
			type: "POST",
			url: 'api/updateevent',
			data: {
				type: EventEditor.type,
				event: EventEditor.event,
				day: EventEditor.getDayInt(),
				hour: $('#eventhour')[0].value,
				minute: $('#eventminute')[0].value,
				food: EventEditor.getFoodInt(),
				maxsaturation: $('#eventmaxsaturation')[0].value,
				minamount: $('#eventminamount')[0].value,
				maxamount: $('#eventmaxamount')[0].value,
				value: $('#eventlight')[0].checked
				},
			success: function(data) {
				$('#editevent').hide(400);
			},
			complete: function(data){
				$('#eventbtnsubmitloading').hide();
				Network.onRequestComplete(data);
			}
		});
	},
	
	dropDownEventTypeClick: function(element) {
		var index = $($(element)[0].parentNode.parentNode.children).index($(element)[0].parentNode);
		
		EventEditor.type = index;
		$('#ddeventtypecurrent')[0].innerHTML = $(element)[0].innerHTML;
		$('#editeventfeed')[0].style.display = (index == 0 ? 'block' : 'none');
		$('#editeventlight')[0].style.display = (index == 1 ? 'block' : 'none');
	}
};

EventEditor.setup();