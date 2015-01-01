var eventcolors = ['#FFA372','#FFDE72','#72B8FF']

function Marker(event) {
	this.id = event.id;
	var proto = $('#markerprototype')[0];
	this.svggroup = proto.cloneNode(true);
	this.svggroup.style.display = 'block';
	this.svggroup.id = "m" + event.id;
	
	this.svggroup.eventId = this.id;
	this.svggroup.addEventListener("click", onEventMarkerClick, false);
	/*
	svggroup.addEventListener("mousedown", onContainerMouseDown, false);
	svggroup.addEventListener("mousemove", onContainerMouseMove, false);
	*/
	
	this.svgpath = this.svggroup.children[0];
	this.svgimage = this.svggroup.children[1];	
	this.svgdarknessline = this.svggroup.children[2];
}

Marker.prototype.update = function(event) {
	if (event != null)
		this.event = event;
	var transformation = 'translate(' + (this.event.hour * 10 + this.event.minute / 6) +',0)';
	this.svgpath.setAttribute('transform',transformation);
	this.svgimage.setAttribute('transform',transformation);
	this.svgdarknessline.setAttribute('transform',transformation);
	this.svgdarknessline.setAttribute('width',0);
	switch (this.event.type) {
		case 0:
			var arr = explodeBinArray(this.event.food, 6);
			for (var i = 0; i < 6; i++)
				if (arr[i]) {
					this.svgimage.setAttribute('xlink:href','img/food' + (i+1) + '.png');
					return;
				}
			break;
		case 1:
			this.svgimage.setAttribute('xlink:href','img/light' + (this.event.value ? 1 : 0) + '.png');
			if (this.event.value)
				this.svgdarknessline.setAttribute('width',0);
			else {
				var min = 24 * 60;
				for (var i = 0; i < eventView.markers.length; i++)
					if (eventView.markers[i].event.type == 1 && eventView.markers[i].event.value && eventView.markers[i].event.hour * 60 + eventView.markers[i].event.minute > this.event.hour * 60 + this.event.minute)
						min = Math.min(min, eventView.markers[i].event.hour * 60 + eventView.markers[i].event.minute);
				this.svgdarknessline.setAttribute('width',(min - this.event.hour * 60 - this.event.minute) / 6);
			}
			break;
		case 2:
			this.svgimage.setAttribute('xlink:href','img/camera.png');
			break;
	}
	this.svgpath.style.fill = eventcolors[this.event.type];
}


function EventView() {
	this.markers = new Array();
	this.svg = $('#svgevents')[0];
}

EventView.prototype.getMarker = function(id) {
	for (var i = 0; i < this.markers.length; i++)
		if (this.markers[i].id == id)
			return this.markers[i];
	return null;
}

EventView.prototype.createMarker = function(event) {
	var marker = new Marker(event);
	this.markers.push(marker);	
	this.svg.appendChild(marker.svggroup);
	marker.update(event);
	$(marker.svggroup).hide();
	$(marker.svggroup).show(400);
	return marker;
}

EventView.prototype.deleteMarker = function(index) {
	this.markers[index].svggroup.parentNode.removeChild(this.markers[index].svggroup);
	this.markers.remove(index);
}

EventView.prototype.update = function(data) {
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
			min = Math.min(min, eventView.markers[i].event.hour * 60 + eventView.markers[i].event.minute);
	$('#firstdarknessline')[0].setAttribute('width',min / 6);
	
	$('#btnschedule')[0].innerHTML = data.scheduling ? 'On' : 'Off';
	if (!data.scheduling)
		$('#btnschedule').addClass('btn-danger');
	else $('#btnschedule').removeClass('btn-danger');
	
	this.updateTime();
}

EventView.prototype.updateTime = function() {
	var now = new Date();
	$('#currenttime')[0].setAttribute('x1',(now.getHours() * 10 + now.getMinutes() / 6));
	$('#currenttime')[0].setAttribute('x2',(now.getHours() * 10 + now.getMinutes() / 6));
	
	for (var i = 0; i < this.markers.length; i++) {
		var arr = explodeBinArray(this.markers[i].event.day, 7);
		if (arr[(now.getDay() + 6) % 7])
			this.markers[i].svgpath.style.fill = eventcolors[this.markers[i].event.type];
		else this.markers[i].svgpath.style.fill = '#ADADAD';
	}
}

EventView.prototype.clickMarker = function(id) {
	eventEditor.event = id;
	eventEditor.update();
	if (!$('#editevent').is(":visible")) {
		$('#editevent').show(400);
	}
}

function onEventMarkerClick(event) {
	var id = event.target.parentNode.eventId;
	eventView.clickMarker(id);
}

$('#btnschedule').click(function() {
	$('#scheduleloading').show();
	$.ajax({
		type: "POST",
		url: 'api/enableschedule',
		data: "value=" + (!eventView.scheduling),
		success: function(data) {
			network.updateStatus();
			$('#scheduleloading').hide();			
		},
		error: function(){
			$('#scheduleloading').hide();
		}
	});
});