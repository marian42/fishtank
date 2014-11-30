function Network(feeder, feederView, eventView, status, imageView) {
	Network.instance = this;
	this.feeder = feeder;
	this.feederView = feederView;
	this.eventView = eventView;
	this.status = status;
	this.imageView = imageView;
	this.reconnecting = false;
	this.loggedin = false;
	this.username = '';
	this.password = '';
}

Network.prototype.updateStatus = function(callback) {
	var instance = this;
	$.ajax({
		type: "GET",
		url: 'api/status',
		success: function(data) {
			instance.onUpdateSuccess(data);
			if (callback) callback();
		},
		error: function(){
			if (callback) callback();
		}
	});
}

Network.prototype.onUpdateSuccess = function(data) {
	this.status.rawdata = data;
	this.status.update();
	
	for (var i = 0; i < this.feeder.size; i++) {
		this.feeder.container[i].food = data.container[i].food;
		this.feeder.container[i].amount = data.container[i].amount;
		this.feeder.container[i].priority = data.container[i].priority;
		this.feeder.container[i].filled = new Date(data.container[i].filled * 1000);
	}
		
	this.feederView.update(data.feeder);
	this.eventView.update(data);
	this.imageView.update(data.imagecount);
	
	logView.createTable(data.log);
}

Network.prototype.checkForUpdate = function() {
	/* (Network.instance.status.version == 0) {
		Network.instance.updateStatus(Network.instance.checkForUpdate);
		return;
	}*/
	$.ajax({
		type: "GET",
		url:  'api/checkforupdate',
		data: "version=" + Network.instance.status.version,
		success: function(data) {
			if (data == 'true' || Network.instance.reconnecting)
				Network.instance.updateStatus(Network.instance.checkForUpdate);
			else Network.instance.checkForUpdate();
			Network.instance.reconnecting = false;
		},
		error: function(){
			$('#status')[0].innerHTML = 'Failed to connect to server. Retrying...';
			Network.instance.reconnecting = true;
			setTimeout(Network.instance.checkForUpdate, 5000);
		}
	});
}