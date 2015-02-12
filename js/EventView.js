var eventcolors = ['#FFA372','#FFDE72','#72B8FF']

EventView = {
	markers: new Array(),
	svg: null,
	events: null,
	scheduling: null,
	
	setup: function() {
		this.svg = $('#svgevents')[0];
		$('#btnschedule')[0].onclick = EventView.btnScheduleClick;
	},
	
	getMarker: function(id) {
		for (var i = 0; i < this.markers.length; i++)
			if (this.markers[i].id == id)
				return this.markers[i];
		return null;
	},
	
	createMarker: function(event) {
		var marker = new Marker(event);
		this.markers.push(marker);	
		this.svg.appendChild(marker.svggroup);
		marker.update(event);
		$(marker.svggroup).hide();
		$(marker.svggroup).show(400);
		return marker;
	},
	
	deleteMarker: function(index) {
		this.markers[index].svggroup.parentNode.removeChild(this.markers[index].svggroup);
		this.markers.remove(index);
	},
	
	update: function(data) {
		this.events = data.event;
		this.scheduling = data.scheduling;
		for (var i = 0; i < this.events.length; i++) {
			var marker = this.getMarker(this.events[i].id);
			if (marker == null) {
				marker = this.createMarker(this.events[i]);
			}
			else {
				marker.event = this.events[i];
				marker.update();
			}
		}
		for (var i = 0; i < this.markers.length; i++) {
			var found = false;
			for (var j = 0; j < this.events.length; j++)
				if (this.events[j].id == this.markers[i].id) {
					found = true;
					break;
				}
			if (!found) {
				this.deleteMarker(i);
				i--;
			}
		}
		
		var min = 24 * 60;
		for (var i = 0; i < this.markers.length; i++)
			if (this.markers[i].event.type == 1 && this.markers[i].event.value)
				min = Math.min(min, EventView.markers[i].event.hour * 60 + EventView.markers[i].event.minute);
		$('#firstdarknessline')[0].setAttribute('width',min / 6);
		
		$('#btnschedule')[0].innerHTML = data.scheduling ? 'On' : 'Off';
		if (!data.scheduling)
			$('#btnschedule').addClass('btn-danger');
		else $('#btnschedule').removeClass('btn-danger');
		
		this.updateTime();
	},
	
	updateTime: function() {
		var now = new Date();
		$('#currenttime')[0].setAttribute('x1',(now.getHours() * 10 + now.getMinutes() / 6));
		$('#currenttime')[0].setAttribute('x2',(now.getHours() * 10 + now.getMinutes() / 6));
		
		for (var i = 0; i < this.markers.length; i++) {
			var arr = explodeBinArray(this.markers[i].event.day, 7);
			if (arr[(now.getDay() + 6) % 7])
				this.markers[i].svgpath.style.fill = eventcolors[this.markers[i].event.type];
			else this.markers[i].svgpath.style.fill = '#ADADAD';
		}
	},
	
	onClickMarker: function(id) {
		EventEditor.event = id;
		EventEditor.update();
		if (!$('#editevent').is(":visible")) {
			$('#editevent').show(400);
		}
	},
	
	onEventMarkerClick: function(event) {
		var id = event.target.parentNode.eventId;
		EventView.onClickMarker(id);
	},
	
	onBtnScheduleClick: function() {
		$('#scheduleloading').show();
		$.ajax({
			type: "POST",
			url: 'api/enableschedule',
			data: "value=" + (!EventView.scheduling),
			success: function(data) {
				network.updateStatus();
				$('#scheduleloading').hide();			
			},
			error: function(){
				$('#scheduleloading').hide();
			}
		});
	}
};

EventView.setup();