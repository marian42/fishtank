Status = {
	status: '',
	updated: false,
	version: 0,
	dismissedHint: false,
		
	update: function(data) {
		this.rawdata = data;
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
		
		this.nexteventtime = data.nexteventtime ? new Date(data.nexteventtime * 1000) : null;
		this.nexteventtype = data.nexteventtype;
		var eventtypes = ['Feed','Light','Take picture'];
		if (data.nexteventtype !== null)
			$('#nexteventtype')[0].innerHTML = '(' + eventtypes[this.nexteventtype] + ')';
		else $('#nexteventtype')[0].innerHTML = '(nothing planned)';
		this.nextlighteventtime = data.nextlighteventtime ? new Date(data.nextlighteventtime * 1000) : null;
		
		if (data.user) {
			$('#btnlogin').hide();
			$('#currentuser').show();
			$('#currentuser')[0].innerHTML = data.user;
			$('#btnlogout').show();
			$('#btnaddnote').show();
			this.dismissedHint = true;
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
		
		$('#alert').click(function() {$('#alertwrapper').stop(true).fadeOut(100);});
		
		if (!data.user && data.lights && this.getCurrentSaturation() <= 1 && !this.dismissedHint) {
			$('#guesthint').show(100);
			$('#dismisshint').click(function() {Status.dismissedHint = true;});
		}
		else 
			$('#guesthint').hide(100);
	},

	updateTime: function() {
		if (!this.updated)
			return;
		$('#statusstaturation')[0].innerHTML = this.getCurrentSaturation().toFixed(1);
		var now = new Date();
		$('#statuslastfed')[0].innerHTML = '<span title="' + (now.toDateString() != this.saturationchanged.toDateString() ? moment(this.saturationchanged).format('DD.MM.YYYY ') : '') + moment(this.saturationchanged).format('HH:mm') + '" class="tooltip2"><span>last fed ' +  moment(this.saturationchanged).fromNow() + '</span></span>';//'last fed ' + moment(this.saturationchanged).fromNow();
		
		if (this.nexteventtime)
			$('#nexteventtime')[0].innerHTML = '<span title="' + (now.toDateString() != this.nexteventtime.toDateString() ? moment(this.nexteventtime).format('DD.MM.YYYY ') : '') + moment(this.nexteventtime).format('HH:mm') + '" class="tooltip2"><span>' + moment(this.nexteventtime).fromNow().substring(3) + '</span></span>';
		else $('#nexteventtime')[0].innerHTML = '';
		if (this.nextlighteventtime)
			$('#nextlighteventtime')[0].innerHTML = '<span title="' + (now.toDateString() != this.nextlighteventtime.toDateString() ? moment(this.nextlighteventtime).format('DD.MM.YYYY ') : '') + moment(this.nextlighteventtime).format('HH:mm') + '" class="tooltip2"><span>' + '(turns ' + (this.lights ? 'off' : 'on') + ' ' + moment(this.nextlighteventtime).fromNow() + ')</span></span>';
		else $('#nextlighteventtime')[0].innerHTML = '';
	},
	
	alert: function(message, level) {
		if (level === undefined)
			level = 1;
		$('#alert').toggleClass('alert-success', level == 0);
		$('#alert').toggleClass('alert-info', level == 1);
		$('#alert').toggleClass('alert-warning', level == 2);
		$('#alert').toggleClass('alert-danger', level == 3);
		$('#alert')[0].innerHTML = message;
		$('#alertwrapper').stop(true).fadeIn(100).animate({opacity:1}, 3000).fadeOut(100);
	},
	
	checkLogin: function() {
		if (this.rawdata.user != undefined)
			return true;
		this.alert('Login required', 2);
		return false;
	},

	getCurrentSaturation: function() {
		return Math.max(0, this.saturation - (Math.abs(this.saturationchanged.getTime() - Date.now())) / (1000.0 * 3600 * 24));
	}
}