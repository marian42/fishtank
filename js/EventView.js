var eventcolors = ['#FFA372','#FFDE72','#72B8FF']

EventView = {
	markers: new Array(),
	svg: null,
	events: null,
	scheduling: null,
	
	setup: function() {
		this.svg = $('#svgevents')[0];
		$('#btnschedule')[0].onclick = this.btnScheduleClick;
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
		
		for (var i = 0; i < this.markers.length; i++)
			this.markers[i].update();
		
		var min = 24 * 60;
		for (var i = 0; i < this.markers.length; i++)
			if (this.markers[i].event.type == 1 && this.markers[i].activeToday())
				min = Math.min(min, EventView.markers[i].event.hour * 60 + EventView.markers[i].event.minute);
		$('#firstdarknessline')[0].setAttribute('width',min / 6);
		
		$('#btnschedule')[0].innerHTML = data.scheduling ? 'On' : 'Off';
		if (!data.scheduling)
			$('#btnschedule').addClass('btn-danger');
		else $('#btnschedule').removeClass('btn-danger');
		
		this.updateTime();
	},
	
	updateTime: function() {
		var now = moment().tz('Europe/Berlin');
		var timeIndicatorPosition = now.hour() + now.minute() / 60;

		$('#currenttime')[0].setAttribute('x1', timeIndicatorPosition * 10);
		$('#currenttime')[0].setAttribute('x2', timeIndicatorPosition * 10);
		
		for (var i = 0; i < this.markers.length; i++) {
			if (this.markers[i].activeToday())
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
	
	btnScheduleClick: function() {
		if (!Status.checkLogin())
			return;	
		
		$('#scheduleloading').show();
		$.ajax({
			type: "POST",
			url: 'api/enableschedule',
			data: {value: !EventView.scheduling},
			complete: function(data){
				$('#scheduleloading').hide();
				Network.onRequestComplete(data);
			}
		});
	},
	
	updateSunriseSunset: function() {
		var lat = 51.328 * Math.PI / 180.0;

		var now = new Date();
		var start = new Date(now.getFullYear(), 0, 0);
		var diff = now - start;
		var oneDay = 1000 * 60 * 60 * 24;
		var day = Math.floor(diff / oneDay);

		var declination = -23.44 * Math.PI / 180.0 * Math.cos(2.0 * Math.PI * (day + 10) / 365);
		var hour_angle = Math.acos(-Math.tan(lat) * Math.tan(declination));

		var sunrise = 0.5 - hour_angle / (2.0 * Math.PI);
		var sunset = 0.5 + hour_angle / (2.0 * Math.PI);
		
		$('#stop3771')[0].setAttribute('offset', sunrise);
		$('#stop3763')[0].setAttribute('offset', sunrise + 0.06);
		$('#stop3767')[0].setAttribute('offset', sunset - 0.06);
		$('#stop3773')[0].setAttribute('offset', sunset);
	}
};

EventView.setup();
EventView.updateSunriseSunset();