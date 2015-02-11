function Status() {
	this.updated = null;
	this.version = 0;
}

Status.prototype.update = function() {
	var data = this.rawdata;
	this.status = data.status;
	this.version = data.version;
	this.updated = new Date();
	
	$('#status')[0].innerHTML = data.status;	
	
	this.saturation = data.saturation;
	this.saturationchanged = new Date(data.saturationchanged * 1000);
	
	this.foodamount = data.foodamount;
	$('#statusfoodavailabe')[0].innerHTML = this.foodamount.toFixed(1);
	this.autofeedamount = data.autofeedamount;
	$('#statusautofeedamount')[0].innerHTML = this.autofeedamount.toFixed(1);
	
	this.nexteventtime = new Date(data.nexteventtime * 1000);
	this.nexteventtype = data.nexteventtype;
	var eventtypes = ['Feed','Light','Take picture'];
	$('#nexteventtype')[0].innerHTML = '(' + eventtypes[this.nexteventtype] + ')';
	this.nextlighteventtime = new Date(data.nextlighteventtime * 1000);
	
	if (data.user) {
		$('#btnlogin').hide();
		$('#currentuser').show();
		$('#currentuser')[0].innerHTML = data.user;
		$('#btnlogout').show();
		$('#btnaddnote').show();
	}
	else {
		$('#btnlogin').show();
		$('#currentuser').hide();
		$('#btnlogout').hide();
		$('#btnaddnote').hide();
	}
	this.lights = data.lights
	$('#lightsvalue')[0].innerHTML = data.lights ? 'On' : 'Off'
	$('#imglightstatus')[0].setAttribute('src','img/light' + (this.lights ? '0' : '1') + '.png')
	this.updateTime();
}

Status.prototype.updateTime = function() {
	if (!this.updated)
		return;
	$('#statusstaturation')[0].innerHTML = this.getCurrentSaturation().toFixed(1);
	var now = new Date();
	$('#statuslastfed')[0].innerHTML = '<span title="' + (now.toDateString() != this.saturationchanged.toDateString() ? moment(this.saturationchanged).format('DD.MM.YYYY ') : '') + moment(this.saturationchanged).format('HH:mm') + '" class="tooltip2"><span>last fed ' +  moment(this.saturationchanged).fromNow() + '</span></span>';//'last fed ' + moment(this.saturationchanged).fromNow();
	
	$('#nexteventtime')[0].innerHTML = '<span title="' + (now.toDateString() != this.nexteventtime.toDateString() ? moment(this.nexteventtime).format('DD.MM.YYYY ') : '') + moment(this.nexteventtime).format('HH:mm') + '" class="tooltip2"><span>' + moment(this.nexteventtime).fromNow().substring(3) + '</span></span>';
	$('#nextlighteventtime')[0].innerHTML = '<span title="' + (now.toDateString() != this.nextlighteventtime.toDateString() ? moment(this.nextlighteventtime).format('DD.MM.YYYY ') : '') + moment(this.nextlighteventtime).format('HH:mm') + '" class="tooltip2"><span>' + '(turns ' + (this.lights ? 'off' : 'on') + ' ' + moment(this.nextlighteventtime).fromNow() + ')</span></span>';
	
}

Status.prototype.getCurrentSaturation = function() {
	return Math.max(0, this.saturation - (Math.abs(this.saturationchanged.getTime() - Date.now())) / (1000.0 * 3600 * 24));
}