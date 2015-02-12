function Marker(event) {
	this.id = event.id;
	var proto = $('#markerprototype')[0];
	this.svggroup = proto.cloneNode(true);
	this.svggroup.style.display = 'block';
	this.svggroup.id = "m" + event.id;
	
	this.svggroup.eventId = this.id;
	this.svggroup.addEventListener("click", EventView.onEventMarkerClick, false);
	
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
				for (var i = 0; i < EventView.markers.length; i++)
					if (EventView.markers[i].event.type == 1 && EventView.markers[i].event.value && EventView.markers[i].event.hour * 60 + EventView.markers[i].event.minute > this.event.hour * 60 + this.event.minute)
						min = Math.min(min, EventView.markers[i].event.hour * 60 + EventView.markers[i].event.minute);
				this.svgdarknessline.setAttribute('width',(min - this.event.hour * 60 - this.event.minute) / 6);
			}
			break;
		case 2:
			this.svgimage.setAttribute('xlink:href','img/camera.png');
			break;
	}
	this.svgpath.style.fill = eventcolors[this.event.type];
}